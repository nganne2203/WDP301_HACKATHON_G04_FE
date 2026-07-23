import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { roundsApi } from '@/entities/round/api';
import { useStore } from '@/entities/session/model/store';
import {
  useCompetitionsQuery,
  useRoundsQuery,
  useRubricsQuery,
  useTracksQuery,
  useUsersQuery,
} from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { CreateRoundRequest, Round, UpdateRoundRequest } from '@/shared/api/types';

import {
  buildCreateRoundPayload,
  buildUpdateRoundPayload,
  createEmptyRoundForm,
  getRoundErrorMessage,
  isJudgeUser,
  mapRoundToForm,
  type RoundFormState,
} from './round-form';

export function useRoundsView() {
  const queryClient = useQueryClient();
  const selectedCompetition = useStore((state) => state.selectedCompetition);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [createForm, setCreateForm] = useState<RoundFormState>(createEmptyRoundForm());
  const [editForm, setEditForm] = useState<RoundFormState>(createEmptyRoundForm());

  const eventsQuery = useCompetitionsQuery();

  const competitions = eventsQuery.data || [];
  const activeCompetition = useMemo(() => {
    if (!competitions.length) return null;
    return competitions.find((competition) => competition.id === selectedCompetition?.id) || competitions[0];
  }, [competitions, selectedCompetition?.id]);

  const roundsQuery = useRoundsQuery({ competitionId: activeCompetition?.id, limit: 10 }, { enabled: Boolean(activeCompetition?.id) });

  const tracksQuery = useTracksQuery({ competitionId: activeCompetition?.id, limit: 10 }, { enabled: Boolean(activeCompetition?.id) });

  const rubricsQuery = useRubricsQuery({ competitionId: activeCompetition?.id, limit: 10 }, { enabled: Boolean(activeCompetition?.id) });

  const judgesQuery = useUsersQuery({ page: 1, limit: 100, status: 'ACTIVE', roles: ['JUDGE'] });

  const rounds = roundsQuery.data || [];
  const tracks = tracksQuery.data || [];
  const rubrics = rubricsQuery.data || [];
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

  const submitCreateRound = () => {
    if (!activeCompetition) return;

    try {
      createMutation.mutate(buildCreateRoundPayload(createForm, activeCompetition));
    } catch (error) {
      toast.error('Failed to create round', { description: getRoundErrorMessage(error) });
    }
  };

  const submitUpdateRound = () => {
    if (!selectedRound) return;

    try {
      updateMutation.mutate({ id: selectedRound.id, payload: buildUpdateRoundPayload(editForm, activeCompetition) });
    } catch (error) {
      toast.error('Failed to update round', { description: getRoundErrorMessage(error) });
    }
  };

  return {
    activeCompetition,
    createForm,
    createMutation,
    createOpen,
    deleteMutation,
    deleteOpen,
    editForm,
    editOpen,
    competitions,
    eventsQuery,
    judges,
    judgesQuery,
    rounds,
    roundsQuery,
    rubrics,
    rubricsQuery,
    selectedRound,
    submitCreateRound,
    submitUpdateRound,
    setCreateForm,
    setCreateOpen,
    setDeleteOpen,
    setEditForm,
    setEditOpen,
    setSelectedRound,
    tracks,
    tracksQuery,
    updateMutation,
    buildCreateRoundPayload,
    buildUpdateRoundPayload,
    getRoundErrorMessage,
    mapRoundToForm,
  };
}
