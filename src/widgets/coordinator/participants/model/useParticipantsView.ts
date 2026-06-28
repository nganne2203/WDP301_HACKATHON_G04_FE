import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { usersApi } from '@/entities/user/api';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import type { User } from '@/shared/api/types';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';

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
  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 300);
  const [activeFilter, setActiveFilter] = useState<ParticipantFilterType>('all');
  const [page, setPage] = useState(1);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const statusFilter = activeFilter === 'all' ? undefined : activeFilter;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const usersQuery = useQuery({
    queryKey: queryKeys.users.list({
      page,
      limit: 10,
      status: statusFilter,
      search: debouncedSearchQuery || undefined,
    }),
    queryFn: () =>
      usersApi.list({
        page,
        limit: 10,
        status: statusFilter,
        search: debouncedSearchQuery || undefined,
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to suspend user', {
        description: getParticipantErrorMessage(error),
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => usersApi.updateStatus(id, 'ACTIVE'),
    onSuccess: async () => {
      toast.success('Google account re-activated');
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to re-activate user', {
        description: getParticipantErrorMessage(error),
      });
    },
  });

  const filteredUsers = allUsers;

  const allSelected = filteredUsers.length > 0 && selectedIds.length === filteredUsers.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const filterCounts = useMemo(() => ({
    all: allUsers.length,
    PENDING: allUsers.filter((user) => user.status === 'PENDING').length,
    APPROVED: allUsers.filter((user) => user.status === 'APPROVED').length,
    ACTIVE: allUsers.filter((user) => user.status === 'ACTIVE').length,
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
    setActiveFilter: (filter: ParticipantFilterType) => {
      setActiveFilter(filter);
      setPage(1);
    },
    page,
    setPage,
    filterSheetOpen,
    setFilterSheetOpen,
    usersQuery,
    allUsers,
    filteredUsers,
    pagination,
    approveMutation,
    rejectMutation,
    suspendMutation,
    activateMutation,
    allSelected,
    someSelected,
    filterCounts,
    toggleAll,
    toggleSelect,
    handleExport,
  };
}
