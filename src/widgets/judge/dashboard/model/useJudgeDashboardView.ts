import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useStore } from '@/entities/session/model/store';
import { judgingBoardsApi } from '@/entities/judging-board/api';
import { rubricsApi } from '@/entities/rubric/api';
import { scoringApi } from '@/entities/score-sheet/api';
import { submissionsApi } from '@/entities/submission/api';
import { useCompetitionsQuery, useRoundsQuery, selectDefaultCompetition } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { Criterion, JudgingBoard, Round, ScoreSheet } from '@/shared/api/types';

export function useJudgeDashboardView() {
  const user = useStore((state) => state.user);
  const storeSelectedCompetition = useStore((state) => state.selectedCompetition);
  const setSelectedCompetition = useStore((state) => state.setSelectedCompetition);

  const [selectedRoundId, setSelectedRoundId] = useState('');

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

  const activeCompetition = useMemo(() => {
    if (!competitions.length) return null;
    if (storeSelectedCompetition) {
      return competitions.find((competition) => competition.id === storeSelectedCompetition.id) || competitions[0];
    }
    return selectDefaultCompetition(competitions) || competitions[0];
  }, [competitions, storeSelectedCompetition]);

  const roundsQuery = useRoundsQuery({ competitionId: activeCompetition?.id, limit: 10 }, { enabled: Boolean(activeCompetition?.id) });
  const rounds: Round[] = roundsQuery.data || [];
  
  const activeRound = useMemo(() => {
    if (selectedRoundId) {
      return rounds.find((round) => round.id === selectedRoundId) || rounds[0] || null;
    }
    const scoringRound = rounds.find((round) => round.status === 'SCORING');
    return scoringRound || rounds[0] || null;
  }, [rounds, selectedRoundId]);

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
  const scoringOpen = activeRound?.status === 'SCORING' && myBoard?.status === 'SCORING';

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
  const rubric = rubricQuery.data?.data;
  const criteria: Criterion[] = rubric?.criteria || [];
  const totalWeight = Number(rubric?.totalScore || 0);
  const scoringCoefficient = Number(rubric?.criterionMaxScore || 0);

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
    const sum = completedSheets.reduce((acc, s) => acc + (s.finalScore || 0), 0);
    return Number((sum / completedSheets.length).toFixed(1));
  }, [allSheets]);

  return {
    selectedRoundId,
    setSelectedRoundId,
    eventsQuery,
    competitions,
    activeCompetition,
    roundsQuery,
    rounds,
    activeRound,
    boardQuery,
    myBoard,
    assignedTeams,
    submissionByTeam,
    sheetByTeamId,
    rubricQuery,
    rubricName: rubric?.title || 'Round Rubric',
    criteriaCount: criteria.length,
    totalWeight,
    scoringCoefficient,
    totalTeamsCount,
    scoredTeamsCount,
    draftTeamsCount,
    pendingTeamsCount,
    averageScoreGiven,
    scoringOpen,
    isLoading: eventsQuery.isLoading || roundsQuery.isLoading || boardQuery.isLoading,
  };
}
