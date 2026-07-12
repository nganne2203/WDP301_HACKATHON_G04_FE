import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/event/api';
import { useEventsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import type { CreateEventRequest, Event } from '@/shared/api/types';
import {
  eventFormSchema,
  getEventLifecycleActionLabel,
  getNextEventStatus,
  getTodayDateInputValue,
  parseInviteEmails,
  toCreateEventRequest,
  toEditEventFormValues,
  toUpdateEventRequest,
  type EventFormValues,
} from '@/features/event-management/model/event-form';

function getEventErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function useEventsView() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const eventsQuery = useEventsQuery();

  const events = eventsQuery.data || [];

  const createForm = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      finalistSelectionMode: 'FIXED_PER_BOARD',
      fillRemainingFinalistsByOverallScore: false,
    },
  });

  const editForm = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEventRequest) => eventsApi.create(data),
    onSuccess: async (response) => {
      toast.success('Event Created', { description: `${response.data.title} has been created.` });
      setCreateOpen(false);
      createForm.reset({
        finalistSelectionMode: 'FIXED_PER_BOARD',
        fillRemainingFinalistsByOverallScore: false,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to create event', {
        description: getEventErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEventRequest> }) => eventsApi.update(id, data),
    onSuccess: async (response) => {
      toast.success('Event Updated', { description: `${response.data.title} has been updated.` });
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to update event', {
        description: getEventErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Event['status'] }) => eventsApi.updateStatus(id, { status }),
    onSuccess: async (response) => {
      toast.success('Event status updated', {
        description: `${response.data.title} is now ${response.data.status.replaceAll('_', ' ').toLowerCase()}.`,
      });
      setSelectedEvent((current) => (current?.id === response.data.id ? response.data : current));
      await queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(response.data.id) });
    },
    onError: (error: unknown) => {
      toast.error('Failed to update event status', {
        description: getEventErrorMessage(error, 'Please resolve the checklist items and try again.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: async () => {
      toast.success('Event Deleted', { description: 'The event has been deleted.' });
      setDeleteOpen(false);
      setSelectedEvent(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete event', {
        description: getEventErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: ({ id, emails, message }: { id: string; emails: string[]; message?: string }) =>
      eventsApi.sendInvitations(id, { emails, message }),
    onSuccess: (response) => {
      const { total, sent, skipped, failed } = response.data;
      if (failed > 0 || skipped > 0) {
        toast.warning('Invitations processed with delivery issues', {
          description: `${sent}/${total} sent, ${skipped} skipped, ${failed} failed.`,
        });
      } else {
        toast.success('Invitations sent', {
          description: `${sent}/${total} invitation email(s) sent.`,
        });
      }
      setInviteOpen(false);
      setInviteEmails('');
      setInviteMessage('');
    },
    onError: (error: unknown) => {
      toast.error('Failed to send invitations', {
        description: getEventErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const handleCreate = (data: EventFormValues) => {
    const today = getTodayDateInputValue();

    if (data.startDate && data.startDate < today) {
      createForm.setError('startDate', {
        type: 'validate',
        message: 'Start date cannot be in the past',
      });
      return;
    }

    if (data.endDate && data.endDate < today) {
      createForm.setError('endDate', {
        type: 'validate',
        message: 'End date cannot be in the past',
      });
      return;
    }

    createMutation.mutate(toCreateEventRequest(data));
  };

  const handleEdit = (data: EventFormValues) => {
    if (!selectedEvent) return;
    updateMutation.mutate({
      id: selectedEvent.id,
      data: toUpdateEventRequest(data),
    });
  };

  const openCreateDialog = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      createForm.reset({
        finalistSelectionMode: 'FIXED_PER_BOARD',
        fillRemainingFinalistsByOverallScore: false,
      });
    }
  };

  const openDetailsDialog = (event: Event) => {
    setSelectedEvent(event);
    setDetailsOpen(true);
  };

  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    editForm.reset(toEditEventFormValues(event));
    setEditOpen(true);
  };

  const openDeleteDialog = (event: Event) => {
    if (event.status !== 'DRAFT') {
      toast.error('Only draft events can be deleted', {
        description: 'Use the lifecycle action to archive events that already entered operations.',
      });
      return;
    }
    setSelectedEvent(event);
    setDeleteOpen(true);
  };

  const openInviteDialog = (event: Event) => {
    setSelectedEvent(event);
    setInviteEmails('');
    setInviteMessage('');
    setInviteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedEvent) return;
    deleteMutation.mutate(selectedEvent.id);
  };

  const getNextStatus = (event: Event) => getNextEventStatus(event.status);

  const getStatusActionLabel = (event: Event) => getEventLifecycleActionLabel(event.status);

  const advanceStatus = (event: Event) => {
    const nextStatus = getNextStatus(event);
    if (!nextStatus) return;
    statusMutation.mutate({ id: event.id, status: nextStatus });
  };

  const canDeleteEvent = (event: Event) => event.status === 'DRAFT';

  const sendInvitations = () => {
    if (!selectedEvent) return;
    const emails = parseInviteEmails(inviteEmails);
    if (emails.length === 0) {
      toast.error('No email addresses entered');
      return;
    }

    inviteMutation.mutate({
      id: selectedEvent.id,
      emails,
      message: inviteMessage || undefined,
    });
  };

  return {
    createOpen,
    detailsOpen,
    setDetailsOpen,
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    inviteOpen,
    setInviteOpen,
    inviteEmails,
    setInviteEmails,
    inviteMessage,
    setInviteMessage,
    selectedEvent,
    eventsQuery,
    events,
    createForm,
    editForm,
    createMutation,
    updateMutation,
    statusMutation,
    deleteMutation,
    inviteMutation,
    handleCreate,
    handleEdit,
    openCreateDialog,
    openDetailsDialog,
    openEditDialog,
    openDeleteDialog,
    openInviteDialog,
    confirmDelete,
    getNextStatus,
    getStatusActionLabel,
    advanceStatus,
    canDeleteEvent,
    sendInvitations,
    getEventErrorMessage,
  };
}
