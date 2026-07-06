import { useEffect, useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';

import { useStore } from '@/entities/session/model/store';
import { judgingBoardsApi } from '@/entities/judging-board/api';
import { repositoriesApi } from '@/entities/repository/api';
import { submissionsApi } from '@/entities/submission/api';
import { useEventsQuery, useRoundsQuery, selectDefaultEvent } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { JudgingBoard, Round } from '@/shared/api/types';

export function useJudgeCodeReviewsView() {
  const user = useStore((state) => state.user);
  const storeSelectedEvent = useStore((state) => state.selectedEvent);
  const setSelectedEvent = useStore((state) => state.setSelectedEvent);
  const [selectedRoundId, setSelectedRoundId] = useState('');

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];

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

  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    if (storeSelectedEvent) return events.find((event) => event.id === storeSelectedEvent.id) || events[0];
    return selectDefaultEvent(events) || events[0];
  }, [events, storeSelectedEvent]);

  const setSelectedEventId = (eventId: string) => {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      semester: event.semester || '',
      status: event.status,
    });
    setSelectedRoundId('');
  };

  const roundsQuery = useRoundsQuery({ eventId: activeEvent?.id, limit: 20 }, { enabled: Boolean(activeEvent?.id) });
  const rounds: Round[] = roundsQuery.data || [];
  const activeRound = selectedRoundId
    ? rounds.find((round) => round.id === selectedRoundId) || null
    : rounds[0] || null;

  const boardQuery = useQuery({
    queryKey: queryKeys.judging.boards(activeRound?.id),
    enabled: Boolean(activeRound?.id),
    queryFn: () => judgingBoardsApi.list({ roundId: activeRound!.id, limit: 10 }),
  });

  const myBoard: JudgingBoard | null = useMemo(() => {
    const boards = boardQuery.data?.data || [];
    return boards.find((board) => board.judgeIds.includes(user?.id || '')) || boards[0] || null;
  }, [boardQuery.data, user?.id]);

  const assignedTeams = myBoard?.teams || [];

  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions.list({ roundId: activeRound?.id, limit: 50 }),
    enabled: Boolean(activeRound?.id && assignedTeams.length > 0),
    queryFn: () => submissionsApi.list({ roundId: activeRound!.id, limit: 50 }),
  });
  const submissions = submissionsQuery.data?.data || [];

  const submissionByTeam = useMemo(() => {
    const map: Record<string, (typeof submissions)[0]> = {};
    for (const submission of submissions) map[submission.teamId] = submission;
    return map;
  }, [submissions]);

  const repositoryQueries = useQueries({
    queries: assignedTeams.map((team) => {
      const repositoryId = submissionByTeam[team.id]?.repositoryId;
      return {
        queryKey: queryKeys.repositories.detail(repositoryId),
        enabled: Boolean(repositoryId),
        queryFn: async () => (await repositoriesApi.getById(repositoryId!)).data,
      };
    }),
  });

  const staticAnalysisQueries = useQueries({
    queries: assignedTeams.map((team) => {
      const repositoryId = submissionByTeam[team.id]?.repositoryId;
      return {
        queryKey: queryKeys.repositories.analysis(repositoryId),
        enabled: Boolean(repositoryId),
        queryFn: async () => (await repositoriesApi.listStaticAnalysis(repositoryId!, 1, 5)).data,
      };
    }),
  });

  const aiReviewQueries = useQueries({
    queries: assignedTeams.map((team) => {
      const repositoryId = submissionByTeam[team.id]?.repositoryId;
      return {
        queryKey: queryKeys.repositories.aiReviews(repositoryId),
        enabled: Boolean(repositoryId),
        queryFn: async () => (await repositoriesApi.listAiReviews(repositoryId!, 1, 5)).data,
      };
    }),
  });

  const reviewRows = assignedTeams.map((team, index) => {
    const submission = submissionByTeam[team.id] || null;
    const repository = repositoryQueries[index]?.data || submission?.repository || null;
    const staticAnalysis = staticAnalysisQueries[index]?.data || [];
    const aiReviewData = aiReviewQueries[index]?.data || null;
    const aiReviews = aiReviewData?.aiReviews || [];
    const latestAnalysis = staticAnalysis[0] || null;
    const latestAiReview = aiReviews[0] || null;

    return {
      team,
      submission,
      repository,
      staticAnalysis,
      aiReviews,
      latestAnalysis,
      latestAiReview,
      loading: Boolean(repositoryQueries[index]?.isLoading || staticAnalysisQueries[index]?.isLoading || aiReviewQueries[index]?.isLoading),
    };
  });

  return {
    events,
    eventsQuery,
    activeEvent,
    setSelectedEventId,
    rounds,
    roundsQuery,
    activeRound,
    selectedRoundId,
    setSelectedRoundId,
    boardQuery,
    myBoard,
    reviewRows,
    isLoading: eventsQuery.isLoading || roundsQuery.isLoading || boardQuery.isLoading || submissionsQuery.isLoading,
  };
}
