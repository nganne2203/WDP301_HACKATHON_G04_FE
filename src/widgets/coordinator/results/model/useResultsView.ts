import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/event/api';
import { finalistsApi } from '@/entities/finalist/api';
import { rankingsApi } from '@/entities/ranking/api';
import { resultsApi } from '@/entities/result/api';
import { roundsApi } from '@/entities/round/api';
import type { RepositoryAccessAction } from '@/shared/api/types';

function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

export function useResultsView() {
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [repositoryAccessAction, setRepositoryAccessAction] = useState<RepositoryAccessAction>('NONE');

  const eventsQuery = useQuery({
    queryKey: ['results-events'],
    queryFn: async () => (await eventsApi.list({ page: 1, limit: 100 })).data,
  });
  const events = eventsQuery.data || [];
  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;
  const activeEventId = activeEvent?.id || '';

  const roundsQuery = useQuery({
    queryKey: ['results-rounds', activeEventId],
    enabled: Boolean(activeEventId),
    queryFn: async () => (await roundsApi.list({ eventId: activeEventId, limit: 100 })).data,
  });
  const rounds = roundsQuery.data || [];
  const activeRound = rounds.find((r) => r.id === selectedRoundId) || rounds[0] || null;
  const activeRoundId = activeRound?.id || '';

  const rankingsQuery = useQuery({
    queryKey: ['rankings', activeEventId, activeRoundId],
    enabled: Boolean(activeEventId) && Boolean(activeRoundId),
    queryFn: async () => (await rankingsApi.list({ eventId: activeEventId, roundId: activeRoundId, limit: 100 })).data,
  });
  const rankings = rankingsQuery.data || [];

  const finalistsQuery = useQuery({
    queryKey: ['finalists', activeEventId, activeRoundId],
    enabled: Boolean(activeEventId) && Boolean(activeRoundId),
    queryFn: async () => (await finalistsApi.list({ eventId: activeEventId, roundId: activeRoundId, limit: 100 })).data,
  });
  const finalists = finalistsQuery.data || [];

  const generateRankingsMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event.');
      if (!activeRoundId) throw new Error('Please select a round.');
      return (await rankingsApi.generate({ eventId: activeEventId, roundId: activeRoundId })).data;
    },
    onSuccess: async (result) => {
      toast.success(`Rankings generated — ${result.generated} entries`);
      await queryClient.invalidateQueries({ queryKey: ['rankings', activeEventId, activeRoundId] });
    },
    onError: (error) => toast.error('Could not generate rankings', { description: getApiErrorMessage(error) }),
  });

  const selectFinalistsMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event.');
      if (!activeRoundId) throw new Error('Please select a round.');
      return (await finalistsApi.select({ eventId: activeEventId, roundId: activeRoundId })).data;
    },
    onSuccess: async (result) => {
      toast.success(`Finalists selected — ${result.selected} teams`);
      await queryClient.invalidateQueries({ queryKey: ['finalists', activeEventId, activeRoundId] });
      await queryClient.invalidateQueries({ queryKey: ['rankings', activeEventId, activeRoundId] });
    },
    onError: (error) => toast.error('Could not select finalists', { description: getApiErrorMessage(error) }),
  });

  const publishResultsMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event.');
      if (!activeRoundId) throw new Error('Please select a round.');
      return (await resultsApi.publish({
        eventId: activeEventId,
        roundId: activeRoundId,
        repositoryAccessAction,
      })).data;
    },
    onSuccess: async (result) => {
      toast.success('Results published', {
        description: `${result.published} rankings published. Repositories: ${result.repositoryAccessAction}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ['rankings', activeEventId, activeRoundId] });
    },
    onError: (error) => toast.error('Could not publish results', { description: getApiErrorMessage(error) }),
  });

  return {
    events,
    eventsQuery,
    activeEvent,
    activeEventId,
    selectedEventId,
    setSelectedEventId,

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

    repositoryAccessAction,
    setRepositoryAccessAction,

    generateRankingsMutation,
    selectFinalistsMutation,
    publishResultsMutation,
  };
}
