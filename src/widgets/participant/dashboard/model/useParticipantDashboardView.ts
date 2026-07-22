import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { finalistsApi } from '@/entities/finalist/api';
import { rankingsApi } from '@/entities/ranking/api';
import { useStore } from '@/entities/session/model/store';
import { submissionsApi } from '@/entities/submission/api';
import { participantsApi } from '@/shared/api/participants';
import { ApiError } from '@/shared/api/client';
import { useCompetitionsQuery, useMyTeamQuery, useRoundsQuery, useTimelinesQuery, selectDefaultCompetition } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';

function getCheckInErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'CHECK_IN_QR_EXPIRED') return 'This check-in QR has expired. Ask the coordinator for a new one.';
    if (error.code === 'PARTICIPANT_ALREADY_CHECKED_IN') return 'You have already checked in for this competition.';
    if (error.code === 'INVALID_CHECK_IN_QR') return 'This is not a valid competition check-in QR.';
    return error.firstError;
  }
  if (error instanceof Error) return error.message;
  return 'Could not process this QR. Please try again.';
}

export function useParticipantDashboardView() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useStore((state) => state.user);
  const appRole = useStore((state) => state.appRole);
  const storeSelectedCompetition = useStore((state) => state.selectedCompetition);
  const setSelectedCompetition = useStore((state) => state.setSelectedCompetition);
  const processedCheckInTokenRef = useRef<string | null>(null);

  const eventsQuery = useCompetitionsQuery();
  const competitions = eventsQuery.data || [];

  // Sync ongoing/default competition with store if not already set
  useEffect(() => {
    if (competitions.length > 0 && !storeSelectedCompetition) {
      const defaultCompetition = selectDefaultCompetition(competitions) || competitions[0];
      setSelectedCompetition({
        id: defaultCompetition.id,
        title: defaultCompetition.title,
        semester: defaultCompetition.semester || '',
        status: defaultCompetition.status,
      });
    }
  }, [competitions, storeSelectedCompetition, setSelectedCompetition]);

  const selectedCompetition = useMemo(() => {
    if (!competitions.length) return null;
    if (storeSelectedCompetition) {
      return competitions.find((competition) => competition.id === storeSelectedCompetition.id) || competitions[0];
    }
    return selectDefaultCompetition(competitions) || competitions[0];
  }, [competitions, storeSelectedCompetition]);

  const clearCheckInTokenFromUrl = useCallback(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('checkInToken') && !params.has('token')) return;
    params.delete('checkInToken');
    params.delete('token');
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
        hash: location.hash,
      },
      { replace: true },
    );
  }, [location.hash, location.pathname, location.search, navigate]);

  const urlCheckInMutation = useMutation({
    mutationFn: (token: string) => participantsApi.scanCheckInQr(token),
    onSuccess: async (response) => {
      const checkedInCompetition = competitions.find((competition) => competition.id === response.data.competitionId);
      if (checkedInCompetition) {
        setSelectedCompetition({
          id: checkedInCompetition.id,
          title: checkedInCompetition.title,
          semester: checkedInCompetition.semester || '',
          status: checkedInCompetition.status,
        });
      }

      toast.success('Check-in successful', {
        description: 'Your attendance has been recorded.',
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.participants.all });
    },
    onError: (error: unknown) => {
      toast.error('Check-in failed', { description: getCheckInErrorMessage(error) });
    },
    onSettled: clearCheckInTokenFromUrl,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const checkInToken = params.get('checkInToken') || params.get('token');
    if (!checkInToken || processedCheckInTokenRef.current === checkInToken) return;

    processedCheckInTokenRef.current = checkInToken;
    urlCheckInMutation.mutate(checkInToken);
  }, [location.search, urlCheckInMutation]);

  const teamQuery = useMyTeamQuery(selectedCompetition?.id);
  const team = teamQuery.data;

  const participantQuery = useQuery({
    queryKey: [...queryKeys.participants.all, 'me', selectedCompetition?.id],
    enabled: Boolean(selectedCompetition?.id && user?.id),
    queryFn: async () => (await participantsApi.getMine(selectedCompetition!.id)).data,
    retry: false,
  });

  const participant = participantQuery.data || null;

  const roundsQuery = useRoundsQuery({ competitionId: selectedCompetition?.id, limit: 20 }, { enabled: Boolean(selectedCompetition?.id) });
  const rounds = roundsQuery.data || [];

  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions.list({ competitionId: selectedCompetition?.id, teamId: team?.id, limit: 20 }),
    enabled: Boolean(selectedCompetition?.id && team?.id),
    queryFn: async () =>
      (await submissionsApi.list({
        competitionId: selectedCompetition?.id,
        teamId: team?.id,
        limit: 20,
      })).data,
  });
  const submissions = submissionsQuery.data || [];

  const timelinesQuery = useTimelinesQuery(
    { competitionId: selectedCompetition?.id, limit: 20 },
    { enabled: Boolean(selectedCompetition?.id) }
  );
  const timelineItems = useMemo(
    () => [...(timelinesQuery.data || [])].sort((left, right) => {
      const leftTime = left.startTime ? new Date(left.startTime).getTime() : Number.MAX_SAFE_INTEGER;
      const rightTime = right.startTime ? new Date(right.startTime).getTime() : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    }),
    [timelinesQuery.data]
  );

  const rankingsQuery = useQuery({
    queryKey: queryKeys.rankings.list(selectedCompetition?.id, undefined),
    enabled: Boolean(selectedCompetition?.id && appRole),
    queryFn: async () => (await rankingsApi.list({ competitionId: selectedCompetition?.id, limit: 50 })).data,
  });
  const rankings = rankingsQuery.data || [];

  const finalistsQuery = useQuery({
    queryKey: queryKeys.finalists.list(selectedCompetition?.id, undefined),
    enabled: Boolean(selectedCompetition?.id && appRole),
    queryFn: async () => (await finalistsApi.list({ competitionId: selectedCompetition?.id, limit: 50 })).data,
  });
  const finalists = finalistsQuery.data || [];

  const teamRanking = useMemo(
    () => rankings.find((ranking) => ranking.teamId && ranking.teamId === team?.id) || null,
    [rankings, team?.id]
  );
  const isFinalist = useMemo(
    () => finalists.some((ranking) => ranking.teamId && ranking.teamId === team?.id),
    [finalists, team?.id]
  );

  const completedSubmissionCount = submissions.filter((submission) => submission.status !== 'DRAFT').length;
  const submissionProgress = rounds.length > 0
    ? Math.round((completedSubmissionCount / rounds.length) * 100)
    : 0;

  return {
    user,
    eventsQuery,
    competitions,
    selectedCompetition,
    participantQuery,
    participant,
    teamQuery,
    team,
    roundsQuery,
    rounds,
    submissionsQuery,
    submissions,
    timelinesQuery,
    timelineItems,
    urlCheckInMutation,
    rankingsQuery,
    teamRanking,
    isFinalist,
    submissionProgress,
    completedSubmissionCount,
  };
}
