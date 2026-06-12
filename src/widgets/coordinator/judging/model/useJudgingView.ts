import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/event/api';
import { judgingBoardsApi } from '@/entities/judging-board/api';
import { roundsApi } from '@/entities/round/api';
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

  const eventsQuery = useQuery({
    queryKey: ['coordinator-judging-events'],
    queryFn: () => eventsApi.list({ page: 1, limit: 100 }),
  });
  const events = eventsQuery.data?.data || [];
  const activeEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || events[0] || null,
    [events, selectedEventId]
  );

  const roundsQuery = useQuery({
    queryKey: ['coordinator-judging-rounds', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: () => roundsApi.list({ eventId: activeEvent!.id, limit: 100 }),
  });
  const rounds: Round[] = roundsQuery.data?.data || [];
  const activeRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId) || rounds[0] || null,
    [rounds, selectedRoundId]
  );

  const boardsQuery = useQuery({
    queryKey: ['coordinator-judging-boards', activeRound?.id],
    enabled: Boolean(activeRound?.id),
    queryFn: () => judgingBoardsApi.list({ roundId: activeRound!.id, limit: 100 }),
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
      queryClient.invalidateQueries({ queryKey: ['coordinator-judging-boards'] });
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
