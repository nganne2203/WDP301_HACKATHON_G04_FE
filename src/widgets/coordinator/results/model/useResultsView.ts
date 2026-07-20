import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { finalistsApi } from '@/entities/finalist/api';
import { rankingsApi } from '@/entities/ranking/api';
import { resultsApi } from '@/entities/result/api';
import { useStore } from '@/entities/session/model/store';
import { useCompetitionsQuery, useRoundsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { RepositoryAccessAction } from '@/shared/api/types';

function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

export function useResultsView() {
  const queryClient = useQueryClient();
  const appRole = useStore((state) => state.appRole);
  const hasPermission = useStore((state) => state.hasPermission);
  const selectedCompetition = useStore((state) => state.selectedCompetition);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [repositoryAccessAction, setRepositoryAccessAction] = useState<RepositoryAccessAction>('NONE');
  const [manualSelectedTeamIds, setManualSelectedTeamIds] = useState<string[]>([]);
  const [manualSelectionReason, setManualSelectionReason] = useState('');
  const canGenerateRankings = appRole === 'admin' || hasPermission('RANKING_GENERATE');
  const canSelectFinalists = appRole === 'admin' || hasPermission('FINALIST_SELECT');
  const canPublishResults = appRole === 'admin' || hasPermission('RESULT_PUBLISH');
  const canManageResults = canGenerateRankings || canSelectFinalists || canPublishResults;

  const eventsQuery = useCompetitionsQuery();
  const competitions = eventsQuery.data || [];
  const activeCompetition = competitions.find((e) => e.id === selectedCompetition?.id) || competitions[0] || null;
  const activeCompetitionId = activeCompetition?.id || '';

  const roundsQuery = useRoundsQuery({ competitionId: activeCompetitionId, limit: 10 }, { enabled: Boolean(activeCompetitionId) });
  const rounds = roundsQuery.data || [];
  const activeRound = rounds.find((r) => r.id === selectedRoundId) || rounds[0] || null;
  const activeRoundId = activeRound?.id || '';
  const canGenerateRankingsForRound = canGenerateRankings && activeRound?.roundType === 'FINAL';

  const rankingsQuery = useQuery({
    queryKey: queryKeys.rankings.list(activeCompetitionId, activeRoundId),
    enabled: Boolean(activeCompetitionId) && Boolean(activeRoundId),
    queryFn: async () => (await rankingsApi.list({ competitionId: activeCompetitionId, roundId: activeRoundId, limit: 500 })).data,
  });
  const rankings = rankingsQuery.data || [];

  const finalistsQuery = useQuery({
    queryKey: queryKeys.finalists.list(activeCompetitionId, activeRoundId),
    enabled: Boolean(activeCompetitionId) && Boolean(activeRoundId),
    queryFn: async () => (await finalistsApi.list({ competitionId: activeCompetitionId, roundId: activeRoundId, limit: 500 })).data,
  });
  const finalists = finalistsQuery.data || [];
  const isCustomSelectionMode = activeCompetition?.competitionConfig?.finalistSelectionMode === 'CUSTOM';

  useEffect(() => {
    setManualSelectedTeamIds((finalistsQuery.data || []).map((ranking) => ranking.teamId).filter(Boolean) as string[]);
  }, [activeCompetitionId, activeRoundId, finalistsQuery.data]);

  const generateRankingsMutation = useMutation({
    mutationFn: async () => {
      if (!activeCompetitionId) throw new Error('Please select an competition.');
      if (!activeRoundId) throw new Error('Please select a round.');
      return (await rankingsApi.generate({ competitionId: activeCompetitionId, roundId: activeRoundId })).data;
    },
    onSuccess: async (result) => {
      toast.success(`Rankings generated - ${result.summary?.generatedCount ?? result.rankings.length} entries`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.rankings.list(activeCompetitionId, activeRoundId) });
    },
    onError: (error) => toast.error('Could not generate rankings', { description: getApiErrorMessage(error) }),
  });

  const selectFinalistsMutation = useMutation({
    mutationFn: async () => {
      if (!activeCompetitionId) throw new Error('Please select an competition.');
      if (!activeRoundId) throw new Error('Please select a round.');
      return (await finalistsApi.select({ competitionId: activeCompetitionId, roundId: activeRoundId })).data;
    },
    onSuccess: async (result) => {
      toast.success(`Finalists selected - ${result.summary?.finalistCount ?? result.finalists.length} teams`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.finalists.list(activeCompetitionId, activeRoundId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.rankings.list(activeCompetitionId, activeRoundId) });
    },
    onError: (error) => toast.error('Could not select finalists', { description: getApiErrorMessage(error) }),
  });

  const publishResultsMutation = useMutation({
    mutationFn: async () => {
      if (!activeCompetitionId) throw new Error('Please select an competition.');
      if (!activeRoundId) throw new Error('Please select a round.');
      return (await resultsApi.publish({
        competitionId: activeCompetitionId,
        roundId: activeRoundId,
        repositoryAccessAction,
      })).data;
    },
    onSuccess: async (result) => {
      toast.success('Results published', {
        description: `${result.rankings.length} rankings published. Repositories: ${result.repositoryAccessAction.action}.`,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.rankings.list(activeCompetitionId, activeRoundId) });
    },
    onError: (error) => toast.error('Could not publish results', { description: getApiErrorMessage(error) }),
  });

  const selectManualFinalistsMutation = useMutation({
    mutationFn: async () => {
      if (!activeCompetitionId) throw new Error('Please select an competition.');
      if (!activeRoundId) throw new Error('Please select a round.');
      if (manualSelectedTeamIds.length === 0) throw new Error('Please select at least one team.');
      return (await finalistsApi.selectManual({
        competitionId: activeCompetitionId,
        roundId: activeRoundId,
        teamIds: manualSelectedTeamIds,
        selectionReason: manualSelectionReason || undefined,
      })).data;
    },
    onSuccess: async (result) => {
      toast.success(`Manual finalists saved - ${result.summary?.finalistCount ?? result.finalists.length} teams`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.finalists.list(activeCompetitionId, activeRoundId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.rankings.list(activeCompetitionId, activeRoundId) });
    },
    onError: (error) => toast.error('Could not save manual finalists', { description: getApiErrorMessage(error) }),
  });

  const toggleManualTeamSelection = (teamId: string, checked: boolean) => {
    setManualSelectedTeamIds((current) => {
      if (checked) return current.includes(teamId) ? current : [...current, teamId];
      return current.filter((id) => id !== teamId);
    });
  };

  return {
    competitions,
    eventsQuery,
    activeCompetition,
    activeCompetitionId,
    rounds,
    roundsQuery,
    activeRound,
    activeRoundId,
    selectedRoundId,
    setSelectedRoundId,

    rankings,
    rankingsQuery,
    finalists,
    finalistsQuery,
    canManageResults,
    canGenerateRankings,
    canGenerateRankingsForRound,
    canSelectFinalists,
    canPublishResults,
    isCustomSelectionMode,
    manualSelectedTeamIds,
    manualSelectionReason,
    setManualSelectionReason,
    toggleManualTeamSelection,

    repositoryAccessAction,
    setRepositoryAccessAction,

    generateRankingsMutation,
    selectFinalistsMutation,
    selectManualFinalistsMutation,
    publishResultsMutation,
  };
}
