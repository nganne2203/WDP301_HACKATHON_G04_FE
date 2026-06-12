import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { workshopsApi } from '@/shared/api';
import { useEventsQuery, useTimelinesQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import type { Workshop } from '@/shared/api/types';
import type { CreateWorkshopRequest, UpdateWorkshopRequest } from '@/shared/api/workshops';

import {
  buildWorkshopPayload,
  buildWorkshopUpdatePayload,
  createEmptyWorkshopForm,
  mapWorkshopToForm,
  type WorkshopFormState,
} from './workshop-form';

export function useWorkshopsView() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [createForm, setCreateForm] = useState<WorkshopFormState>(createEmptyWorkshopForm());
  const [editForm, setEditForm] = useState<WorkshopFormState>(createEmptyWorkshopForm());

  const eventsQuery = useEventsQuery();

  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events.find((event) => event.id === selectedEvent?.id) || events[0];
  }, [events, selectedEventId, selectedEvent?.id]);

  const workshopsQuery = useQuery({
    queryKey: queryKeys.workshops.list({ eventId: activeEvent?.id, page, limit: 10 }),
    enabled: Boolean(activeEvent?.id),
    queryFn: () => workshopsApi.list({ eventId: activeEvent?.id, page, limit: 10 }),
  });

  const workshopTimelinesQuery = useTimelinesQuery(
    {
      eventId: activeEvent?.id,
      eventType: 'WORKSHOP',
      page: 1,
      limit: 10,
    },
    { enabled: Boolean(activeEvent?.id) }
  );

  const workshops = workshopsQuery.data?.data || [];
  const pagination = workshopsQuery.data?.pagination;
  const workshopTimelines = workshopTimelinesQuery.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateWorkshopRequest) => workshopsApi.create(payload),
    onSuccess: (response) => {
      toast.success('Workshop created', { description: `${response.data.title} has been scheduled.` });
      queryClient.invalidateQueries({ queryKey: queryKeys.workshops.lists() });
      setCreateOpen(false);
      setCreateForm(createEmptyWorkshopForm());
    },
    onError: (error: unknown) => {
      toast.error('Failed to create workshop', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWorkshopRequest }) => workshopsApi.update(id, payload),
    onSuccess: (response) => {
      toast.success('Workshop updated', { description: `${response.data.title} has been updated.` });
      queryClient.invalidateQueries({ queryKey: queryKeys.workshops.lists() });
      setEditOpen(false);
      setSelectedWorkshop(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update workshop', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workshopsApi.delete(id),
    onSuccess: () => {
      toast.success('Workshop deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.workshops.lists() });
      setDeleteOpen(false);
      setSelectedWorkshop(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete workshop', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const handleCreate = () => {
    if (!activeEvent?.id) return;
    if (!createForm.title.trim()) {
      toast.error('Workshop title is required');
      return;
    }
    if (!createForm.startTime || !createForm.endTime) {
      toast.error('Start time and end time are required');
      return;
    }
    createMutation.mutate(buildWorkshopPayload(createForm, activeEvent.id));
  };

  const handleUpdate = () => {
    if (!selectedWorkshop) return;
    if (!editForm.title.trim()) {
      toast.error('Workshop title is required');
      return;
    }
    if (!editForm.startTime || !editForm.endTime) {
      toast.error('Start time and end time are required');
      return;
    }
    updateMutation.mutate({
      id: selectedWorkshop.id,
      payload: buildWorkshopUpdatePayload(editForm),
    });
  };

  const openEditDialog = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setEditForm(mapWorkshopToForm(workshop));
    setEditOpen(true);
  };

  const liveCount = workshops.filter((workshop) => workshop.status === 'LIVE').length;
  const completedCount = workshops.filter((workshop) => workshop.status === 'COMPLETED').length;

  return {
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
    liveCount,
    openEditDialog,
    selectedWorkshop,
    setCreateForm,
    setCreateOpen,
    setDeleteOpen,
    setEditForm,
    setEditOpen,
    setSelectedEventId: (eventId: string) => {
      setSelectedEventId(eventId);
      setPage(1);
    },
    page,
    pagination,
    setPage,
    setSelectedWorkshop,
    workshopTimelines,
    workshopTimelinesQuery,
    workshops,
    workshopsQuery,
    updateMutation,
  };
}
