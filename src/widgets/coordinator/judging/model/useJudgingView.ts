import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { judgingBoardsApi } from '@/entities/judging-board/api';
import { useEventsQuery, useRoundsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { JudgingBoard, Round } from '@/shared/api/types';

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
  const [showAutoAssignConfirm, setShowAutoAssignConfirm] = useState(false);
  const [assignedBoards, setAssignedBoards] = useState<JudgingBoard[]>([]);
  const [showAssignedResult, setShowAssignedResult] = useState(false);

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

  const autoAssignMutation = useMutation({
    mutationFn: () => judgingBoardsApi.autoAssign({ eventId: activeEvent!.id, roundId: activeRound!.id }),
    onSuccess: (response) => {
      const created = response.data || [];
      setAssignedBoards(created);
      setShowAutoAssignConfirm(false);
      setShowAssignedResult(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.judging.all });
      toast.success(`Auto-assigned teams across ${created.length} judging boards`);
    },
    onError: () => {
      toast.error('Failed to auto-assign teams');
    },
  });

  return {
    selectedEventId,
    setSelectedEventId,
    selectedRoundId,
    setSelectedRoundId,
    selectedBoard,
    setSelectedBoard,
    showAutoAssignConfirm,
    setShowAutoAssignConfirm,
    assignedBoards,
    showAssignedResult,
    setShowAssignedResult,
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
    autoAssignMutation,
  };
}
