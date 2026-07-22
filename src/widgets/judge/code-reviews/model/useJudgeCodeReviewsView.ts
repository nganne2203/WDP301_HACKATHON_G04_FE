import { useEffect, useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';

import { useStore } from '@/entities/session/model/store';
import { judgingBoardsApi } from '@/entities/judging-board/api';
import { repositoriesApi } from '@/entities/repository/api';
import { submissionsApi } from '@/entities/submission/api';
import { useCompetitionsQuery, useRoundsQuery, selectDefaultCompetition } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { JudgingBoard, Round } from '@/shared/api/types';

export function useJudgeCodeReviewsView() {
  const user = useStore((state) => state.user);
  const storeSelectedCompetition = useStore((state) => state.selectedCompetition);
  const setSelectedCompetition = useStore((state) => state.setSelectedCompetition);
  const [selectedRoundId, setSelectedRoundId] = useState('');

  const eventsQuery = useCompetitionsQuery();
  const competitions = eventsQuery.data || [];

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

  const activeCompetition = useMemo(() => {
    if (!competitions.length) return null;
    if (storeSelectedCompetition) return competitions.find((competition) => competition.id === storeSelectedCompetition.id) || competitions[0];
    return selectDefaultCompetition(competitions) || competitions[0];
  }, [competitions, storeSelectedCompetition]);

  const roundsQuery = useRoundsQuery({ competitionId: activeCompetition?.id, limit: 20 }, { enabled: Boolean(activeCompetition?.id) });
  const rounds: Round[] = roundsQuery.data || [];
  const activeRound = selectedRoundId
    ? rounds.find((round) => round.id === selectedRoundId) || rounds[0] || null
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
    competitions,
    eventsQuery,
    activeCompetition,
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
