import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { ApiError } from '@/shared/api/client';
import { eventsApi } from '@/entities/event/api';
import { judgingBoardsApi } from '@/entities/judging-board/api';
import { repositoriesApi } from '@/entities/repository/api';
import { roundsApi } from '@/entities/round/api';
import { rubricsApi } from '@/entities/rubric/api';
import { scoringApi } from '@/entities/score-sheet/api';
import { submissionsApi } from '@/entities/submission/api';
import type { Criterion, JudgingBoard, Round, ScoreSheet } from '@/shared/api/types';

export function getJudgeScoringErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Could not connect to server.';
}

export function useJudgeScoringView() {
  const queryClient = useQueryClient();
  const { user } = useStore();

  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [generalComment, setGeneralComment] = useState('');
  const [submitConfirm, setSubmitConfirm] = useState(false);

  const eventsQuery = useQuery({
    queryKey: ['judge-scoring-events'],
    queryFn: () => eventsApi.list({ page: 1, limit: 100 }),
  });
  const events = eventsQuery.data?.data || [];
  const activeEvent = useMemo(() => events.find((event) => event.id === selectedEventId) || events[0] || null, [events, selectedEventId]);

  const roundsQuery = useQuery({
    queryKey: ['judge-scoring-rounds', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: () => roundsApi.list({ eventId: activeEvent!.id, limit: 100 }),
  });
  const rounds: Round[] = roundsQuery.data?.data || [];
  const activeRound = useMemo(() => rounds.find((round) => round.id === selectedRoundId) || rounds[0] || null, [rounds, selectedRoundId]);

  const boardQuery = useQuery({
    queryKey: ['judge-board', activeRound?.id, user?.id],
    enabled: Boolean(activeRound?.id),
    queryFn: () => judgingBoardsApi.list({ roundId: activeRound!.id, limit: 100 }),
  });
  const myBoard: JudgingBoard | null = useMemo(() => {
    const boards = boardQuery.data?.data || [];
    return boards.find((board) => board.judgeIds.includes(user?.id || '')) || boards[0] || null;
  }, [boardQuery.data, user?.id]);

  const assignedTeams = myBoard?.teams || [];

  const submissionsQuery = useQuery({
    queryKey: ['judge-submissions', activeRound?.id],
    enabled: Boolean(activeRound?.id && assignedTeams.length > 0),
    queryFn: () => submissionsApi.list({ roundId: activeRound!.id, limit: 100 }),
  });
  const submissions = submissionsQuery.data?.data || [];
  const submissionByTeam = useMemo(() => {
    const map: Record<string, (typeof submissions)[0]> = {};
    for (const submission of submissions) {
      map[submission.teamId] = submission;
    }
    return map;
  }, [submissions]);

  const rubricQuery = useQuery({
    queryKey: ['judge-rubric', activeRound?.rubricId],
    enabled: Boolean(activeRound?.rubricId),
    queryFn: () => rubricsApi.getById(activeRound!.rubricId!),
  });
  const criteria: Criterion[] = rubricQuery.data?.data?.criteria || [];
  const maxScore = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);

  const selectedTeam = assignedTeams.find((team) => team.id === selectedTeamId) || assignedTeams[0] || null;
  const submission = selectedTeam ? submissionByTeam[selectedTeam.id] : null;

  const repositoryQuery = useQuery({
    queryKey: ['judge-repository', submission?.repositoryId],
    enabled: Boolean(submission?.repositoryId),
    queryFn: async () => (await repositoriesApi.getById(submission!.repositoryId!)).data,
  });

  const repositoryAnalysisQuery = useQuery({
    queryKey: ['judge-repository-analysis', submission?.repositoryId],
    enabled: Boolean(submission?.repositoryId),
    queryFn: async () => (await repositoriesApi.listStaticAnalysis(submission!.repositoryId!, 1, 3)).data,
  });

  const repositoryAiQuery = useQuery({
    queryKey: ['judge-repository-ai', submission?.repositoryId],
    enabled: Boolean(submission?.repositoryId),
    queryFn: async () => (await repositoriesApi.listAiReviews(submission!.repositoryId!, 1, 3)).data,
  });

  const sheetsQuery = useQuery({
    queryKey: ['judge-sheets', activeRound?.id, user?.id],
    enabled: Boolean(activeRound?.id && user?.id),
    queryFn: () => scoringApi.listSheets({ roundId: activeRound!.id, judgeId: user?.id, limit: 100 }),
  });
  const allSheets = sheetsQuery.data?.data || [];
  const existingSheet: ScoreSheet | null = allSheets.find((sheet) => sheet.teamId === selectedTeam?.id) || null;
  const sheetStatusByTeamId = useMemo(() => {
    const statusMap = new Map<string, ScoreSheet['status']>();
    for (const sheet of allSheets) {
      statusMap.set(sheet.teamId, sheet.status);
    }
    return statusMap;
  }, [allSheets]);

  useEffect(() => {
    if (existingSheet) {
      const nextScores: Record<string, number> = {};
      const nextComments: Record<string, string> = {};
      for (const entry of existingSheet.scores) {
        if (entry.criterionId) {
          nextScores[entry.criterionId] = entry.scoreValue;
          if (entry.comment) {
            nextComments[entry.criterionId] = entry.comment;
          }
        }
      }
      setScores(nextScores);
      setComments(nextComments);
      setGeneralComment(existingSheet.generalComment || '');
      return;
    }

    setScores({});
    setComments({});
    setGeneralComment('');
  }, [existingSheet?.id]);

  const totalScore = useMemo(() => Object.values(scores).reduce((sum, value) => sum + (value || 0), 0), [scores]);

  const saveMutation = useMutation({
    mutationFn: (submit: boolean) =>
      scoringApi.submitSheet({
        scoreSheetId: existingSheet?.id,
        eventId: activeEvent!.id,
        roundId: activeRound!.id,
        boardId: myBoard!.id,
        teamId: selectedTeam!.id,
        submissionId: submission!.id,
        rubricId: activeRound!.rubricId,
        generalComment,
        submit,
        scores: Object.entries(scores).map(([criterionId, scoreValue]) => ({
          criterionId,
          scoreValue,
          comment: comments[criterionId] || null,
        })),
      }),
    onSuccess: async (_, submit) => {
      toast.success(submit ? `Score sheet submitted for ${selectedTeam?.name}` : 'Draft saved');
      setSubmitConfirm(false);
      await queryClient.invalidateQueries({ queryKey: ['judge-sheets'] });
    },
    onError: (error) => {
      toast.error(getJudgeScoringErrorMessage(error));
    },
  });

  const isSubmitted = existingSheet?.status === 'SUBMITTED' || existingSheet?.status === 'LOCKED';
  const latestAnalysis = repositoryAnalysisQuery.data?.[0] || null;
  const latestAiReview = repositoryAiQuery.data?.aiReviews?.[0] || null;
  const hasIncompleteCriteria = criteria.some((criterion) => scores[criterion.id] === undefined);

  return {
    selectedEventId,
    setSelectedEventId,
    selectedRoundId,
    setSelectedRoundId,
    selectedTeamId,
    setSelectedTeamId,
    scores,
    setScores,
    comments,
    setComments,
    generalComment,
    setGeneralComment,
    submitConfirm,
    setSubmitConfirm,
    eventsQuery,
    events,
    activeEvent,
    roundsQuery,
    rounds,
    activeRound,
    boardQuery,
    myBoard,
    assignedTeams,
    submissionsQuery,
    rubricQuery,
    criteria,
    maxScore,
    selectedTeam,
    submission,
    repositoryQuery,
    existingSheet,
    sheetStatusByTeamId,
    totalScore,
    saveMutation,
    isSubmitted,
    latestAnalysis,
    latestAiReview,
    hasIncompleteCriteria,
  };
}
