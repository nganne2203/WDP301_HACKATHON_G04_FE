import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { judgingBoardsApi } from '@/entities/judging-board/api';
import { useStore } from '@/entities/session/model/store';
import { useEventsQuery, useRoundsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { JudgingBoard, JudgingBoardRandomizationPreview, Round } from '@/shared/api/types';

export function statusVariant(status: string) {
  if (status === 'SCORING') return 'default' as const;
  if (status === 'ASSIGNED' || status === 'COMPLETED') return 'secondary' as const;
  return 'outline' as const;
}

export function useJudgingView() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<JudgingBoard | null>(null);
  const [showRandomizeConfirm, setShowRandomizeConfirm] = useState(false);
  const [assignedBoards, setAssignedBoards] = useState<JudgingBoard[]>([]);
  const [showAssignedResult, setShowAssignedResult] = useState(false);
  const [randomizationPreview, setRandomizationPreview] = useState<JudgingBoardRandomizationPreview | null>(null);
  const [showRandomizationPreview, setShowRandomizationPreview] = useState(false);

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];
  const activeEvent = useMemo(
    () => events.find((event) => event.id === selectedEvent?.id) || events[0] || null,
    [events, selectedEvent?.id]
  );

  const roundsQuery = useRoundsQuery({ eventId: activeEvent?.id, limit: 10 }, { enabled: Boolean(activeEvent?.id) });
  const rounds: Round[] = roundsQuery.data || [];
  const activeRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId) || rounds[0] || null,
    [rounds, selectedRoundId]
  );

  // A judging stage may contain several rounds (for example the three
  // preliminary boards). Keep the stage selector, but load every round in
  // that stage so coordinators can see and operate on the complete lineup.
  const activeRounds = useMemo(
    () => (activeRound ? rounds.filter((round) => round.roundType === activeRound.roundType) : []),
    [activeRound, rounds]
  );

  const boardsQuery = useQuery({
    queryKey: [...queryKeys.judging.boards(activeEvent?.id), activeRound?.roundType],
    enabled: Boolean(activeEvent?.id && activeRound?.roundType),
    queryFn: () => judgingBoardsApi.list({ eventId: activeEvent!.id, limit: 100 }),
  });
  const boards: JudgingBoard[] = (boardsQuery.data?.data || []).filter((board) =>
    activeRounds.some((round) => round.id === board.roundId)
  );
  const totalTeams = boards.reduce((sum, board) => sum + board.teams.length, 0);
  const totalJudges = new Set(boards.flatMap((board) => board.judgeIds)).size;

  const randomizePreviewMutation = useMutation({
    mutationFn: async () => {
      if (!activeEvent || activeRounds.length === 0) throw new Error('No judging round selected');
      const response = await judgingBoardsApi.randomizePreview({ eventId: activeEvent.id, roundId: activeRound.id });
      return response.data;
    },
    onSuccess: (response) => {
      setRandomizationPreview(response as JudgingBoardRandomizationPreview);
      setShowRandomizeConfirm(false);
      setShowRandomizationPreview(true);
      toast.success(`Created a board assignment preview for ${response.eligibleTeamCount} eligible teams`);
    },
    onError: () => {
      toast.error('Unable to randomize judging boards');
    },
  });

  const confirmRandomizationMutation = useMutation({
    mutationFn: () => {
      if (!activeEvent || activeRounds.length === 0 || !randomizationPreview) {
        throw new Error('Missing data required to confirm board assignment');
      }

      return judgingBoardsApi.confirmRandomization({
        eventId: activeEvent.id,
        roundId: activeRound!.id,
        boards: randomizationPreview.boards.map((board) => ({ boardNumber: board.boardNumber, name: board.name, teamIds: board.teamIds }))
      });
    },
    onSuccess: (response) => {
      const created = response.data.boards || [];
      setAssignedBoards(created);
      setShowRandomizationPreview(false);
      setShowAssignedResult(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.judging.all });
      toast.success(`Confirmed team lineup for ${created.length} judging boards`);
    },
    onError: () => {
      toast.error('Unable to confirm board lineup');
    },
  });

  return {
    selectedRoundId,
    setSelectedRoundId,
    selectedBoard,
    setSelectedBoard,
    showRandomizeConfirm,
    setShowRandomizeConfirm,
    assignedBoards,
    showAssignedResult,
    setShowAssignedResult,
    randomizationPreview,
    showRandomizationPreview,
    setShowRandomizationPreview,
    eventsQuery,
    events,
    activeEvent,
    roundsQuery,
    rounds,
    activeRound,
    activeRounds,
    boardsQuery,
    boards,
    totalTeams,
    totalJudges,
    randomizePreviewMutation,
    confirmRandomizationMutation,
  };
}
