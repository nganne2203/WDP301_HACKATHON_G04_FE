import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';

import { useStore } from '@/entities/session/model/store';
import { judgingBoardsApi } from '@/entities/judging-board/api';
import { repositoriesApi } from '@/entities/repository/api';
import { rubricsApi } from '@/entities/rubric/api';
import { scoringApi } from '@/entities/score-sheet/api';
import { submissionsApi } from '@/entities/submission/api';
import { useEventsQuery, useRoundsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { Criterion, JudgingBoard, Round, ScoreSheet } from '@/shared/api/types';

export function useJudgeDashboardView() {
  const user = useStore((state) => state.user);

  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRoundId, setSelectedRoundId] = useState('');

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => events.find((event) => event.id === selectedEventId) || events[0] || null, [events, selectedEventId]);

  const roundsQuery = useRoundsQuery({ eventId: activeEvent?.id, limit: 10 }, { enabled: Boolean(activeEvent?.id) });
  const rounds: Round[] = roundsQuery.data || [];
  const activeRound = useMemo(() => rounds.find((round) => round.id === selectedRoundId) || rounds[0] || null, [rounds, selectedRoundId]);

  // Fetch judging boards for the round
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

  // Fetch submissions
  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions.list({ roundId: activeRound?.id, limit: 20 }),
    enabled: Boolean(activeRound?.id && assignedTeams.length > 0),
    queryFn: () => submissionsApi.list({ roundId: activeRound!.id, limit: 20 }),
  });
  const submissions = submissionsQuery.data?.data || [];

  const submissionByTeam = useMemo(() => {
    const map: Record<string, (typeof submissions)[0]> = {};
    for (const submission of submissions) {
      map[submission.teamId] = submission;
    }
    return map;
  }, [submissions]);

  // Fetch scoresheets matching the current judge in this round
  const sheetsQuery = useQuery({
    queryKey: queryKeys.scoreSheets.list({ roundId: activeRound?.id, judgeId: user?.id, limit: 20 }),
    enabled: Boolean(activeRound?.id && user?.id),
    queryFn: () => scoringApi.listSheets({ roundId: activeRound!.id, judgeId: user?.id, limit: 20 }),
  });
  const allSheets = sheetsQuery.data?.data || [];

  const sheetByTeamId = useMemo(() => {
    const map = new Map<string, ScoreSheet>();
    for (const sheet of allSheets) {
      map.set(sheet.teamId, sheet);
    }
    return map;
  }, [allSheets]);

  // Fetch rubrics
  const rubricQuery = useQuery({
    queryKey: queryKeys.rubrics.detail(activeRound?.rubricId),
    enabled: Boolean(activeRound?.rubricId),
    queryFn: () => rubricsApi.getById(activeRound!.rubricId!),
  });
  const criteria: Criterion[] = rubricQuery.data?.data?.criteria || [];
  const maxScore = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);

  // Fetch static analysis results in parallel using useQueries
  const staticAnalysisQueries = useQueries({
    queries: assignedTeams.map((team) => {
      const sub = submissionByTeam[team.id];
      const repoId = sub?.repositoryId;
      return {
        queryKey: queryKeys.repositories.analysis(repoId),
        queryFn: async () => {
          if (!repoId) return [];
          try {
            const res = await repositoriesApi.listStaticAnalysis(repoId, 1, 5);
            return Array.isArray(res.data) ? res.data : [];
          } catch (err) {
            console.warn(`Failed to load static analysis for repository ${repoId}`, err);
            return [];
          }
        },
        enabled: Boolean(repoId),
      };
    }),
  });

  const staticAnalysisByTeamId = useMemo(() => {
    const map = new Map<string, any>();
    assignedTeams.forEach((team, idx) => {
      const queryResult = staticAnalysisQueries[idx];
      if (queryResult?.data) {
        map.set(team.id, queryResult.data);
      }
    });
    return map;
  }, [assignedTeams, staticAnalysisQueries]);

  // Fetch AI reviews in parallel
  const aiReviewsQueries = useQueries({
    queries: assignedTeams.map((team) => {
      const sub = submissionByTeam[team.id];
      const repoId = sub?.repositoryId;
      return {
        queryKey: queryKeys.repositories.aiReviews(repoId),
        queryFn: async () => {
          if (!repoId) return null;
          try {
            const res = await repositoriesApi.listAiReviews(repoId, 1, 3);
            return res.data;
          } catch (err) {
            console.warn(`Failed to load AI reviews for repository ${repoId}`, err);
            return null;
          }
        },
        enabled: Boolean(repoId),
      };
    }),
  });

  const aiReviewsByTeamId = useMemo(() => {
    const map = new Map<string, any>();
    assignedTeams.forEach((team, idx) => {
      const queryResult = aiReviewsQueries[idx];
      if (queryResult?.data) {
        map.set(team.id, queryResult.data);
      }
    });
    return map;
  }, [assignedTeams, aiReviewsQueries]);

  // Calculate metrics
  const totalTeamsCount = assignedTeams.length;
  const scoredTeamsCount = assignedTeams.filter((team) => {
    const sheet = sheetByTeamId.get(team.id);
    return sheet?.status === 'SUBMITTED' || sheet?.status === 'LOCKED';
  }).length;
  const draftTeamsCount = assignedTeams.filter((team) => {
    const sheet = sheetByTeamId.get(team.id);
    return sheet?.status === 'DRAFT';
  }).length;
  const pendingTeamsCount = totalTeamsCount - scoredTeamsCount;

  const averageScoreGiven = useMemo(() => {
    const completedSheets = allSheets.filter(s => s.status === 'SUBMITTED' || s.status === 'LOCKED');
    if (!completedSheets.length) return 0;
    const sum = completedSheets.reduce((acc, s) => acc + (s.totalScore || 0), 0);
    return Number((sum / completedSheets.length).toFixed(1));
  }, [allSheets]);

  return {
    selectedEventId,
    setSelectedEventId,
    selectedRoundId,
    setSelectedRoundId,
    eventsQuery,
    events,
    activeEvent,
    roundsQuery,
    rounds,
    activeRound,
    boardQuery,
    myBoard,
    assignedTeams,
    submissionByTeam,
    sheetByTeamId,
    rubricQuery,
    rubricName: rubricQuery.data?.data?.name || 'Round Rubric',
    criteriaCount: criteria.length,
    maxScore,
    staticAnalysisByTeamId,
    aiReviewsByTeamId,
    totalTeamsCount,
    scoredTeamsCount,
    draftTeamsCount,
    pendingTeamsCount,
    averageScoreGiven,
    isLoading: eventsQuery.isLoading || roundsQuery.isLoading || boardQuery.isLoading,
  };
}
