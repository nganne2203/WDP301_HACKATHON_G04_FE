import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/event/api';
import { ApiError } from '@/shared/api/client';
import type { CreateEventRequest, Event } from '@/shared/api/types';
import {
  eventFormSchema,
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

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list({ page: 1, limit: 100 }),
  });

  const events = eventsQuery.data?.data || [];

  const createForm = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: { status: 'DRAFT' },
  });

  const editForm = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEventRequest) => eventsApi.create(data),
    onSuccess: async (response) => {
      toast.success('Event Created', { description: `${response.data.title} has been created.` });
      setCreateOpen(false);
      createForm.reset({ status: 'DRAFT' });
      await queryClient.invalidateQueries({ queryKey: ['events'] });
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
      await queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to update event', {
        description: getEventErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: async () => {
      toast.success('Event Deleted', { description: 'The event has been deleted.' });
      setDeleteOpen(false);
      setSelectedEvent(null);
      await queryClient.invalidateQueries({ queryKey: ['events'] });
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
      createForm.reset({ status: 'DRAFT' });
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
    sendInvitations,
    getEventErrorMessage,
  };
}
