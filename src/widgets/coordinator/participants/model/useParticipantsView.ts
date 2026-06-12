import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { usersApi } from '@/entities/user/api';
import { ApiError } from '@/shared/api/client';
import type { User } from '@/shared/api/types';

import type { ParticipantFilterType } from './participants-view.utils';

function getParticipantErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

export function useParticipantsView() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ParticipantFilterType>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const usersQuery = useQuery({
    queryKey: ['users', searchQuery],
    queryFn: () =>
      usersApi.list({
        page: 1,
        limit: 100,
        search: searchQuery || undefined,
      }),
  });

  const allUsers = usersQuery.data?.data || [];
  const pagination = usersQuery.data?.pagination;

  const showStatusToast = (user: User, successMessage: string) => {
    const notification = user.emailNotification;

    if (!notification) {
      toast.success(successMessage);
      return;
    }

    if (notification.sent) {
      toast.success(`${successMessage} and email sent`);
      return;
    }

    toast.warning(`${successMessage}, but email was not sent`, {
      description: notification.reason || 'Check email configuration.',
    });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => usersApi.approve(id),
    onSuccess: async (response) => {
      showStatusToast(response.data, 'User approved');
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to approve user', {
        description: getParticipantErrorMessage(error),
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => usersApi.reject(id),
    onSuccess: async (response) => {
      showStatusToast(response.data, 'User rejected');
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to reject user', {
        description: getParticipantErrorMessage(error),
      });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => usersApi.suspend(id),
    onSuccess: async () => {
      toast.success('User suspended');
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to suspend user', {
        description: getParticipantErrorMessage(error),
      });
    },
  });

  const filteredUsers = useMemo(() => {
    if (activeFilter === 'all') return allUsers;
    return allUsers.filter((user) => user.status === activeFilter);
  }, [allUsers, activeFilter]);

  const allSelected = filteredUsers.length > 0 && selectedIds.length === filteredUsers.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const filterCounts = useMemo(() => ({
    all: allUsers.length,
    PENDING: allUsers.filter((user) => user.status === 'PENDING').length,
    APPROVED: allUsers.filter((user) => user.status === 'APPROVED').length,
    REJECTED: allUsers.filter((user) => user.status === 'REJECTED').length,
    SUSPENDED: allUsers.filter((user) => user.status === 'SUSPENDED').length,
  }), [allUsers]);

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(filteredUsers.map((participant) => participant.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const handleExport = () => {
    const dataToExport = selectedIds.length > 0
      ? filteredUsers.filter((participant) => selectedIds.includes(participant.id))
      : filteredUsers;

    toast.success('Export Successful', {
      description: `Exported ${dataToExport.length} user(s) to CSV.`,
    });
  };

  return {
    selectedIds,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filterSheetOpen,
    setFilterSheetOpen,
    usersQuery,
    allUsers,
    filteredUsers,
    pagination,
    approveMutation,
    rejectMutation,
    suspendMutation,
    allSelected,
    someSelected,
    filterCounts,
    toggleAll,
    toggleSelect,
    handleExport,
  };
}
