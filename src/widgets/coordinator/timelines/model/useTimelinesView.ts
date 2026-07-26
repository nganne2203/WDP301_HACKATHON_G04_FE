import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { timelinesApi } from '@/shared/api';
import { useCompetitionsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import type { CreateTimelineRequest, TimelineActivity, UpdateTimelineRequest } from '@/shared/api/types';
import { getCompetitionReadOnlyMessage, isCompetitionReadOnly } from '@/shared/lib/competition-readonly';

import {
  buildTimelinePayload,
  buildTimelineUpdatePayload,
  createEmptyTimelineForm,
  mapTimelineToForm,
  type TimelineFormState,
} from './timeline-form';

export function useTimelinesView() {
  const queryClient = useQueryClient();
  const selectedCompetition = useStore((state) => state.selectedCompetition);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineActivity | null>(null);
  const [createForm, setCreateForm] = useState<TimelineFormState>(createEmptyTimelineForm());
  const [editForm, setEditForm] = useState<TimelineFormState>(createEmptyTimelineForm());

  const eventsQuery = useCompetitionsQuery();

  const competitions = eventsQuery.data || [];
  const activeCompetition = useMemo(() => {
    if (!competitions.length) return null;
    return competitions.find((competition) => competition.id === selectedCompetition?.id) || competitions[0];
  }, [competitions, selectedCompetition?.id]);

  const timelinesQuery = useQuery({
    queryKey: queryKeys.timelines.list({ competitionId: activeCompetition?.id, page, limit: 10 }),
    enabled: Boolean(activeCompetition?.id),
    queryFn: () => timelinesApi.list({ competitionId: activeCompetition?.id, page, limit: 10 }),
  });

  const timelines = timelinesQuery.data?.data || [];
  const pagination = timelinesQuery.data?.pagination;
  const timelinesReadOnly = isCompetitionReadOnly(activeCompetition);

  const ensureTimelinesWritable = () => {
    if (!timelinesReadOnly) return true;
    toast.error('Competition is read-only', {
      description: getCompetitionReadOnlyMessage('Timeline'),
    });
    return false;
  };

  const setCreateDialogOpen = (open: boolean) => {
    if (open && !ensureTimelinesWritable()) return;
    setCreateOpen(open);
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateTimelineRequest) => timelinesApi.create(payload),
    onSuccess: (response) => {
      toast.success('Timeline created', { description: `${response.data.title} has been scheduled.` });
      queryClient.invalidateQueries({ queryKey: queryKeys.timelines.lists() });
      setCreateOpen(false);
      setCreateForm(createEmptyTimelineForm());
    },
    onError: (error: unknown) => {
      toast.error('Failed to create timeline', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTimelineRequest }) => timelinesApi.update(id, payload),
    onSuccess: (response) => {
      toast.success('Timeline updated', { description: `${response.data.title} has been updated.` });
      queryClient.invalidateQueries({ queryKey: queryKeys.timelines.lists() });
      setEditOpen(false);
      setSelectedTimeline(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update timeline', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => timelinesApi.delete(id),
    onSuccess: () => {
      toast.success('Timeline deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.timelines.lists() });
      setDeleteOpen(false);
      setSelectedTimeline(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete timeline', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const handleCreate = () => {
    if (!activeCompetition?.id) return;
    if (!ensureTimelinesWritable()) return;
    if (!createForm.title.trim()) {
      toast.error('Timeline title is required');
      return;
    }
    createMutation.mutate(buildTimelinePayload(createForm, activeCompetition.id));
  };

  const handleUpdate = () => {
    if (!selectedTimeline) return;
    if (!ensureTimelinesWritable()) return;
    if (!editForm.title.trim()) {
      toast.error('Timeline title is required');
      return;
    }
    updateMutation.mutate({
      id: selectedTimeline.id,
      payload: buildTimelineUpdatePayload(editForm),
    });
  };

  const openEditDialog = (timeline: TimelineActivity) => {
    if (!ensureTimelinesWritable()) return;
    setSelectedTimeline(timeline);
    setEditForm(mapTimelineToForm(timeline));
    setEditOpen(true);
  };

  const openDeleteDialog = (timeline: TimelineActivity) => {
    if (!ensureTimelinesWritable()) return;
    setSelectedTimeline(timeline);
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!selectedTimeline) return;
    if (!ensureTimelinesWritable()) return;
    deleteMutation.mutate(selectedTimeline.id);
  };

  const completedCount = timelines.filter((timeline) => timeline.status === 'COMPLETED').length;
  const activeCount = timelines.filter((timeline) => timeline.status === 'ONGOING').length;

  return {
    activeCount,
    activeCompetition,
    completedCount,
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
    selectedTimeline,
    setCreateForm,
    setCreateOpen: setCreateDialogOpen,
    setDeleteOpen,
    setEditForm,
    setEditOpen,
    page,
    pagination,
    setPage,
    setSelectedTimeline,
    timelines,
    timelinesReadOnly,
    timelinesQuery,
    updateMutation,
  };
}
