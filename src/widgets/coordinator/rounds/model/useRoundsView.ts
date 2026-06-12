import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { roundsApi } from '@/entities/round/api';
import { useStore } from '@/entities/session/model/store';
import {
  useEventsQuery,
  useRoundsQuery,
  useRubricsQuery,
  useTeamsQuery,
  useTracksQuery,
  useUsersQuery,
} from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { CreateRoundRequest, Round, UpdateRoundRequest } from '@/shared/api/types';

import {
  buildCreateRoundPayload,
  buildUpdateRoundPayload,
  createEmptyRoundForm,
  filterTeamsByTrack,
  getRoundErrorMessage,
  isJudgeUser,
  mapRoundToForm,
  type RoundFormState,
} from './round-form';

export function useRoundsView() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [createForm, setCreateForm] = useState<RoundFormState>(createEmptyRoundForm());
  const [editForm, setEditForm] = useState<RoundFormState>(createEmptyRoundForm());

  const eventsQuery = useEventsQuery();

  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events.find((event) => event.id === selectedEvent?.id) || events[0];
  }, [events, selectedEventId, selectedEvent?.id]);

  const roundsQuery = useRoundsQuery({ eventId: activeEvent?.id, limit: 10 }, { enabled: Boolean(activeEvent?.id) });

  const tracksQuery = useTracksQuery({ eventId: activeEvent?.id, limit: 10 }, { enabled: Boolean(activeEvent?.id) });

  const rubricsQuery = useRubricsQuery({ eventId: activeEvent?.id, limit: 10 }, { enabled: Boolean(activeEvent?.id) });

  const teamsQuery = useTeamsQuery({ eventId: activeEvent?.id, limit: 10 }, { enabled: Boolean(activeEvent?.id) });

  const judgesQuery = useUsersQuery();

  const rounds = roundsQuery.data || [];
  const tracks = tracksQuery.data || [];
  const rubrics = rubricsQuery.data || [];
  const teams = teamsQuery.data || [];
  const judges = (judgesQuery.data?.data || []).filter(isJudgeUser);

  const createMutation = useMutation({
    mutationFn: (payload: CreateRoundRequest) => roundsApi.create(payload),
    onSuccess: (response) => {
      toast.success('Round created', { description: `${response.data.name} has been added.` });
      queryClient.invalidateQueries({ queryKey: queryKeys.rounds.lists() });
      setCreateOpen(false);
      setCreateForm(createEmptyRoundForm());
    },
    onError: (error: unknown) => {
      toast.error('Failed to create round', { description: getRoundErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoundRequest }) => roundsApi.update(id, payload),
    onSuccess: (response) => {
      toast.success('Round updated', { description: `${response.data.name} has been updated.` });
      queryClient.invalidateQueries({ queryKey: queryKeys.rounds.lists() });
      setEditOpen(false);
      setSelectedRound(response.data);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update round', { description: getRoundErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roundsApi.delete(id),
    onSuccess: () => {
      toast.success('Round deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.rounds.lists() });
      setDeleteOpen(false);
      setSelectedRound(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete round', { description: getRoundErrorMessage(error) });
    },
  });

  return {
    activeEvent,
    createForm,
    createMutation,
    createOpen,
    deleteMutation,
    deleteOpen,
    editForm,
    editOpen,
    events,
    eventsQuery,
    filterTeamsByTrack,
    judges,
    judgesQuery,
    rounds,
    roundsQuery,
    rubrics,
    rubricsQuery,
    selectedRound,
    setCreateForm,
    setCreateOpen,
    setDeleteOpen,
    setEditForm,
    setEditOpen,
    setSelectedEventId,
    setSelectedRound,
    teams,
    teamsQuery,
    tracks,
    tracksQuery,
    updateMutation,
    buildCreateRoundPayload,
    buildUpdateRoundPayload,
    getRoundErrorMessage,
    mapRoundToForm,
  };
}
