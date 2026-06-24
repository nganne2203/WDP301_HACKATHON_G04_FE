import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { finalistsApi } from '@/entities/finalist/api';
import { rankingsApi } from '@/entities/ranking/api';
import { useStore } from '@/entities/session/model/store';
import { submissionsApi } from '@/entities/submission/api';
import { participantsApi } from '@/shared/api/participants';
import { useEventsQuery, useMyTeamQuery, useRoundsQuery, useTimelinesQuery, selectDefaultEvent } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';

export function useParticipantDashboardView() {
  const user = useStore((state) => state.user);
  const appRole = useStore((state) => state.appRole);
  const storeSelectedEvent = useStore((state) => state.selectedEvent);
  const setSelectedEvent = useStore((state) => state.setSelectedEvent);

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];

  // Sync ongoing/default event with store if not already set
  useEffect(() => {
    if (events.length > 0 && !storeSelectedEvent) {
      const defaultEvent = selectDefaultEvent(events) || events[0];
      setSelectedEvent({
        id: defaultEvent.id,
        title: defaultEvent.title,
        semester: defaultEvent.semester || '',
        status: defaultEvent.status,
      });
    }
  }, [events, storeSelectedEvent, setSelectedEvent]);

  const selectedEvent = useMemo(() => {
    if (!events.length) return null;
    if (storeSelectedEvent) {
      return events.find((event) => event.id === storeSelectedEvent.id) || events[0];
    }
    return selectDefaultEvent(events) || events[0];
  }, [events, storeSelectedEvent]);

  const selectedEventId = selectedEvent?.id || '';
  const setSelectedEventId = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent({
        id: event.id,
        title: event.title,
        semester: event.semester || '',
        status: event.status,
      });
    }
  };

  const teamQuery = useMyTeamQuery(selectedEvent?.id);
  const team = teamQuery.data;

  const participantQuery = useQuery({
    queryKey: [...queryKeys.participants.all, 'me', selectedEvent?.id],
    enabled: Boolean(selectedEvent?.id && user?.id),
    queryFn: async () => (await participantsApi.getMine(selectedEvent!.id)).data,
    retry: false,
  });

  const participant = participantQuery.data || null;

  const roundsQuery = useRoundsQuery({ eventId: selectedEvent?.id, limit: 20 }, { enabled: Boolean(selectedEvent?.id) });
  const rounds = roundsQuery.data || [];

  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions.list({ eventId: selectedEvent?.id, teamId: team?.id, limit: 20 }),
    enabled: Boolean(selectedEvent?.id && team?.id),
    queryFn: async () =>
      (await submissionsApi.list({
        eventId: selectedEvent?.id,
        teamId: team?.id,
        limit: 20,
      })).data,
  });
  const submissions = submissionsQuery.data || [];

  const timelinesQuery = useTimelinesQuery(
    { eventId: selectedEvent?.id, limit: 20 },
    { enabled: Boolean(selectedEvent?.id) }
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
    queryKey: queryKeys.rankings.list(selectedEvent?.id, undefined),
    enabled: Boolean(selectedEvent?.id && appRole !== 'participant'),
    queryFn: async () => (await rankingsApi.list({ eventId: selectedEvent?.id, limit: 50 })).data,
  });
  const rankings = rankingsQuery.data || [];

  const finalistsQuery = useQuery({
    queryKey: queryKeys.finalists.list(selectedEvent?.id, undefined),
    enabled: Boolean(selectedEvent?.id && appRole !== 'participant'),
    queryFn: async () => (await finalistsApi.list({ eventId: selectedEvent?.id, limit: 50 })).data,
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
    selectedEventId,
    setSelectedEventId,
    eventsQuery,
    events,
    selectedEvent,
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
    rankingsQuery,
    teamRanking,
    isFinalist,
    submissionProgress,
    completedSubmissionCount,
  };
}
