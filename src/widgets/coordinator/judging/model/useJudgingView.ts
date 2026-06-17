import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { judgingBoardsApi } from '@/entities/judging-board/api';
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
  const [selectedEventId, setSelectedEventId] = useState('');
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
    () => events.find((event) => event.id === selectedEventId) || events[0] || null,
    [events, selectedEventId]
  );

  const roundsQuery = useRoundsQuery({ eventId: activeEvent?.id, limit: 10 }, { enabled: Boolean(activeEvent?.id) });
  const rounds: Round[] = roundsQuery.data || [];
  const activeRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId) || rounds[0] || null,
    [rounds, selectedRoundId]
  );

  const boardsQuery = useQuery({
    queryKey: queryKeys.judging.boards(activeRound?.id),
    enabled: Boolean(activeRound?.id),
    queryFn: () => judgingBoardsApi.list({ roundId: activeRound!.id, limit: 10 }),
  });
  const boards: JudgingBoard[] = boardsQuery.data?.data || [];
  const totalTeams = boards.reduce((sum, board) => sum + board.teams.length, 0);
  const totalJudges = new Set(boards.flatMap((board) => board.judgeIds)).size;

  const randomizePreviewMutation = useMutation({
    mutationFn: () => judgingBoardsApi.randomizePreview({ eventId: activeEvent!.id, roundId: activeRound!.id }),
    onSuccess: (response) => {
      setRandomizationPreview(response.data);
      setShowRandomizeConfirm(false);
      setShowRandomizationPreview(true);
      toast.success(`Created a board assignment preview for ${response.data.eligibleTeamCount} eligible teams`);
    },
    onError: () => {
      toast.error('Unable to randomize judging boards');
    },
  });

  const confirmRandomizationMutation = useMutation({
    mutationFn: () => {
      if (!activeEvent || !activeRound || !randomizationPreview) {
        throw new Error('Missing data required to confirm board assignment');
      }

      return judgingBoardsApi.confirmRandomization({
        eventId: activeEvent.id,
        roundId: activeRound.id,
        boards: randomizationPreview.boards.map((board) => ({
          boardNumber: board.boardNumber,
          name: board.name,
          teamIds: board.teamIds,
        })),
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
    selectedEventId,
    setSelectedEventId,
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
    boardsQuery,
    boards,
    totalTeams,
    totalJudges,
    randomizePreviewMutation,
    confirmRandomizationMutation,
  };
}
