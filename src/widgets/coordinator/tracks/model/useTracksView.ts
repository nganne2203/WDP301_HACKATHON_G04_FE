import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { tracksApi } from '@/shared/api';
import { useCompetitionsQuery, useTracksQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import type { CreateTrackRequest, Track, UpdateTrackRequest } from '@/shared/api/types';
import { getCompetitionReadOnlyMessage, isCompetitionReadOnly } from '@/shared/lib/competition-readonly';

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
  const tracksReadOnly = isCompetitionReadOnly(activeCompetition);

  const ensureTracksWritable = () => {
    if (!tracksReadOnly) return true;
    toast.error('Competition is read-only', {
      description: getCompetitionReadOnlyMessage('Tracks'),
    });
    return false;
  };

  const setCreateDialogOpen = (open: boolean) => {
    if (open && !ensureTracksWritable()) return;
    setCreateOpen(open);
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateTrackRequest) => tracksApi.create(payload),
    onSuccess: (response) => {
      toast.success('Track created', { description: `${response.data.name} is ready.` });
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks.lists() });
      setCreateOpen(false);
      setCreateForm(createEmptyTrackForm());
    },
    onError: (error: unknown) => {
      toast.error('Could not create track', {
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
    if (!ensureTracksWritable()) return;
    setSelectedTrack(track);
    setEditForm(mapTrackToForm(track));
    setEditOpen(true);
  };

  const openDeleteDialog = (track: Track) => {
    if (!ensureTracksWritable()) return;
    setSelectedTrack(track);
    setDeleteOpen(true);
  };

  const handleCreate = () => {
    if (!activeCompetition?.id) return;
    if (!ensureTracksWritable()) return;
    if (!createForm.name.trim()) {
      toast.error('Track name is required');
      return;
    }
    const name = createForm.name.trim().toLocaleLowerCase();
    if (tracks.some((track) => track.name.trim().toLocaleLowerCase() === name)) {
      toast.error('Track name already exists', { description: 'Use a different name for this competition.' });
      return;
    }

    try {
      createMutation.mutate(buildTrackPayload(createForm, activeCompetition.id));
    } catch (error) {
      toast.error('Could not create track', {
        description: error instanceof ApiError ? error.firstError : 'Please check the track details.',
      });
    }
  };

  const handleUpdate = () => {
    if (!selectedTrack) return;
    if (!ensureTracksWritable()) return;
    if (!editForm.name.trim()) {
      toast.error('Track name is required');
      return;
    }
    const name = editForm.name.trim().toLocaleLowerCase();
    if (tracks.some((track) => track.id !== selectedTrack.id && track.name.trim().toLocaleLowerCase() === name)) {
      toast.error('Track name already exists', { description: 'Use a different name for this competition.' });
      return;
    }

    try {
      updateMutation.mutate({
        id: selectedTrack.id,
        payload: buildTrackUpdatePayload(editForm),
      });
    } catch (error) {
      toast.error('Could not update track', {
        description: error instanceof ApiError ? error.firstError : 'Please check the track details.',
      });
    }
  };

  const handleDelete = () => {
    if (!selectedTrack) return;
    if (!ensureTracksWritable()) return;
    deleteMutation.mutate(selectedTrack.id);
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
    handleDelete,
    handleUpdate,
    openDeleteDialog,
    openEditDialog,
    selectedTrack,
    setCreateForm,
    setCreateOpen: setCreateDialogOpen,
    setDeleteOpen,
    setEditForm,
    setEditOpen,
    tracks,
    tracksReadOnly,
    tracksQuery,
    updateMutation,
  };
}
