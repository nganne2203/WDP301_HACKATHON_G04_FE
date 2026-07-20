import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { tracksApi } from '@/shared/api';
import { useCompetitionsQuery, useTracksQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import type { CreateTrackRequest, Track, UpdateTrackRequest } from '@/shared/api/types';

import {
  buildTrackPayload,
  buildTrackUpdatePayload,
  createEmptyTrackForm,
  mapTrackToForm,
  type TrackFormState,
} from './track-form';

export function useTracksView() {
  const queryClient = useQueryClient();
  const selectedCompetition = useStore((state) => state.selectedCompetition);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [createForm, setCreateForm] = useState<TrackFormState>(createEmptyTrackForm());
  const [editForm, setEditForm] = useState<TrackFormState>(createEmptyTrackForm());

  const eventsQuery = useCompetitionsQuery();

  const competitions = eventsQuery.data || [];
  const activeCompetition = useMemo(() => {
    if (!competitions.length) return null;
    return competitions.find((competition) => competition.id === selectedCompetition?.id) || competitions[0];
  }, [competitions, selectedCompetition?.id]);

  const tracksQuery = useTracksQuery(
    { competitionId: activeCompetition?.id, page: 1, limit: 10 },
    { enabled: Boolean(activeCompetition?.id) }
  );

  const tracks = tracksQuery.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateTrackRequest) => tracksApi.create(payload),
    onSuccess: (response) => {
      toast.success('Track created', { description: `${response.data.name} is ready.` });
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks.lists() });
      setCreateOpen(false);
      setCreateForm(createEmptyTrackForm());
    },
    onError: (error: unknown) => {
      toast.error('Failed to create track', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTrackRequest }) => tracksApi.update(id, payload),
    onSuccess: (response) => {
      toast.success('Track updated', { description: `${response.data.name} has been updated.` });
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks.lists() });
      setEditOpen(false);
      setSelectedTrack(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update track', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tracksApi.delete(id),
    onSuccess: () => {
      toast.success('Track deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks.lists() });
      setDeleteOpen(false);
      setSelectedTrack(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete track', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const openEditDialog = (track: Track) => {
    setSelectedTrack(track);
    setEditForm(mapTrackToForm(track));
    setEditOpen(true);
  };

  const openDeleteDialog = (track: Track) => {
    setSelectedTrack(track);
    setDeleteOpen(true);
  };

  const handleCreate = () => {
    if (!activeCompetition?.id) return;
    if (!createForm.name.trim()) {
      toast.error('Track name is required');
      return;
    }

    createMutation.mutate(buildTrackPayload(createForm, activeCompetition.id));
  };

  const handleUpdate = () => {
    if (!selectedTrack) return;
    if (!editForm.name.trim()) {
      toast.error('Track name is required');
      return;
    }

    updateMutation.mutate({
      id: selectedTrack.id,
      payload: buildTrackUpdatePayload(editForm),
    });
  };

  const confirmedTracks = tracks.filter((track) => track.status === 'OPEN' || track.status === 'COMPLETED').length;

  return {
    activeCompetition,
    confirmedTracks,
    createForm,
    createMutation,
    createOpen,
    deleteMutation,
    deleteOpen,
    editForm,
    editOpen,
    competitions,
    eventsQuery,
    handleCreate,
    handleUpdate,
    openDeleteDialog,
    openEditDialog,
    selectedTrack,
    setCreateForm,
    setCreateOpen,
    setDeleteOpen,
    setEditForm,
    setEditOpen,
    tracks,
    tracksQuery,
    updateMutation,
  };
}
