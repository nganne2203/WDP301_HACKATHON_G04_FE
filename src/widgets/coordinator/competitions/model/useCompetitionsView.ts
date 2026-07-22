import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/competition/api';
import { useCompetitionsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import type { CreateCompetitionRequest, Competition } from '@/shared/api/types';
import {
  eventFormSchema,
  getCompetitionLifecycleActionLabel,
  getNextCompetitionStatus,
  getTodayDateInputValue,
  parseInviteEmails,
  toCreateCompetitionRequest,
  toEditCompetitionFormValues,
  toUpdateCompetitionRequest,
  type CompetitionFormValues,
} from '@/features/competition-management/model/competition-form';

function getCompetitionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function useCompetitionsView() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);

  const eventsQuery = useCompetitionsQuery();

  const competitions = eventsQuery.data || [];

  const createForm = useForm<CompetitionFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      minTeamMembers: 3,
      maxTeamMembers: 5,
      finalistSelectionMode: 'FIXED_PER_BOARD',
    },
  });

  const editForm = useForm<CompetitionFormValues>({
    resolver: zodResolver(eventFormSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCompetitionRequest) => eventsApi.create(data),
    onSuccess: async (response) => {
      toast.success('Competition Created', { description: `${response.data.title} has been created.` });
      setCreateOpen(false);
      createForm.reset({
        minTeamMembers: 3,
        maxTeamMembers: 5,
        finalistSelectionMode: 'FIXED_PER_BOARD',
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.competitions.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to create competition', {
        description: getCompetitionErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCompetitionRequest> }) => eventsApi.update(id, data),
    onSuccess: async (response) => {
      toast.success('Competition Updated', { description: `${response.data.title} has been updated.` });
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.competitions.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to update competition', {
        description: getCompetitionErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Competition['status'] }) => eventsApi.updateStatus(id, { status }),
    onSuccess: async (response) => {
      toast.success('Competition status updated', {
        description: `${response.data.title} is now ${response.data.status.replaceAll('_', ' ').toLowerCase()}.`,
      });
      setSelectedCompetition((current) => (current?.id === response.data.id ? response.data : current));
      await queryClient.invalidateQueries({ queryKey: queryKeys.competitions.lists() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.competitions.detail(response.data.id) });
    },
    onError: (error: unknown) => {
      toast.error('Failed to update competition status', {
        description: getCompetitionErrorMessage(error, 'Please resolve the checklist items and try again.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: async () => {
      toast.success('Competition Deleted', { description: 'The competition has been deleted.' });
      setDeleteOpen(false);
      setSelectedCompetition(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.competitions.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete competition', {
        description: getCompetitionErrorMessage(error, 'Please try again.'),
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
        description: getCompetitionErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const handleCreate = (data: CompetitionFormValues) => {
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

    createMutation.mutate(toCreateCompetitionRequest(data));
  };

  const handleEdit = (data: CompetitionFormValues) => {
    if (!selectedCompetition) return;
    updateMutation.mutate({
      id: selectedCompetition.id,
      data: toUpdateCompetitionRequest(data),
    });
  };

  const openCreateDialog = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      createForm.reset({
        minTeamMembers: 3,
        maxTeamMembers: 5,
        finalistSelectionMode: 'FIXED_PER_BOARD',
      });
    }
  };

  const openDetailsDialog = (competition: Competition) => {
    setSelectedCompetition(competition);
    setDetailsOpen(true);
  };

  const openEditDialog = (competition: Competition) => {
    setSelectedCompetition(competition);
    editForm.reset(toEditCompetitionFormValues(competition));
    setEditOpen(true);
  };

  const openDeleteDialog = (competition: Competition) => {
    if (competition.status !== 'DRAFT') {
      toast.error('Only draft competitions can be deleted', {
        description: 'Use the lifecycle action to archive competitions that already entered operations.',
      });
      return;
    }
    setSelectedCompetition(competition);
    setDeleteOpen(true);
  };

  const openInviteDialog = (competition: Competition) => {
    setSelectedCompetition(competition);
    setInviteEmails('');
    setInviteMessage('');
    setInviteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedCompetition) return;
    deleteMutation.mutate(selectedCompetition.id);
  };

  const getNextStatus = (competition: Competition) => getNextCompetitionStatus(competition.status);

  const getStatusActionLabel = (competition: Competition) => getCompetitionLifecycleActionLabel(competition.status);

  const advanceStatus = (competition: Competition) => {
    const nextStatus = getNextStatus(competition);
    if (!nextStatus) return;
    statusMutation.mutate({ id: competition.id, status: nextStatus });
  };

  const canDeleteCompetition = (competition: Competition) => competition.status === 'DRAFT';

  const sendInvitations = () => {
    if (!selectedCompetition) return;
    const emails = parseInviteEmails(inviteEmails);
    if (emails.length === 0) {
      toast.error('No email addresses entered');
      return;
    }

    inviteMutation.mutate({
      id: selectedCompetition.id,
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
    selectedCompetition,
    eventsQuery,
    competitions,
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
    canDeleteCompetition,
    sendInvitations,
    getCompetitionErrorMessage,
  };
}
