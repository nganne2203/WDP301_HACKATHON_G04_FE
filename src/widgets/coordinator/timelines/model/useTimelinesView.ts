import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { eventsApi, timelinesApi } from '@/shared/api';
import { ApiError } from '@/shared/api/client';
import type { CreateTimelineRequest, TimelineEvent, UpdateTimelineRequest } from '@/shared/api/types';

import {
  buildTimelinePayload,
  buildTimelineUpdatePayload,
  createEmptyTimelineForm,
  mapTimelineToForm,
  type TimelineFormState,
} from './timeline-form';

export function useTimelinesView() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineEvent | null>(null);
  const [createForm, setCreateForm] = useState<TimelineFormState>(createEmptyTimelineForm());
  const [editForm, setEditForm] = useState<TimelineFormState>(createEmptyTimelineForm());

  const eventsQuery = useQuery({
    queryKey: ['coordinator-timeline-events'],
    queryFn: async () => (await eventsApi.list({ page: 1, limit: 100 })).data,
  });

  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events.find((event) => event.id === selectedEvent?.id) || events[0];
  }, [events, selectedEventId, selectedEvent?.id]);

  const timelinesQuery = useQuery({
    queryKey: ['coordinator-timelines', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => (await timelinesApi.list({ eventId: activeEvent?.id, page: 1, limit: 100 })).data,
  });

  const timelines = timelinesQuery.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateTimelineRequest) => timelinesApi.create(payload),
    onSuccess: (response) => {
      toast.success('Timeline created', { description: `${response.data.title} has been scheduled.` });
      queryClient.invalidateQueries({ queryKey: ['coordinator-timelines'] });
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
      queryClient.invalidateQueries({ queryKey: ['coordinator-timelines'] });
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
      queryClient.invalidateQueries({ queryKey: ['coordinator-timelines'] });
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
    if (!activeEvent?.id) return;
    if (!createForm.title.trim()) {
      toast.error('Timeline title is required');
      return;
    }
    createMutation.mutate(buildTimelinePayload(createForm, activeEvent.id));
  };

  const handleUpdate = () => {
    if (!selectedTimeline) return;
    if (!editForm.title.trim()) {
      toast.error('Timeline title is required');
      return;
    }
    updateMutation.mutate({
      id: selectedTimeline.id,
      payload: buildTimelineUpdatePayload(editForm),
    });
  };

  const openEditDialog = (timeline: TimelineEvent) => {
    setSelectedTimeline(timeline);
    setEditForm(mapTimelineToForm(timeline));
    setEditOpen(true);
  };

  const completedCount = timelines.filter((timeline) => timeline.status === 'COMPLETED').length;
  const activeCount = timelines.filter((timeline) => timeline.status === 'ONGOING').length;

  return {
    activeCount,
    activeEvent,
    completedCount,
    createForm,
    createMutation,
    createOpen,
    deleteMutation,
    deleteOpen,
    editForm,
    editOpen,
    events,
    eventsQuery,
    handleCreate,
    handleUpdate,
    openEditDialog,
    selectedTimeline,
    setCreateForm,
    setCreateOpen,
    setDeleteOpen,
    setEditForm,
    setEditOpen,
    setSelectedEventId,
    setSelectedTimeline,
    timelines,
    timelinesQuery,
    updateMutation,
  };
}
