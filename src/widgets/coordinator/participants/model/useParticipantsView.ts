import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { usersApi } from '@/entities/user/api';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import type { User, UserRoleName } from '@/shared/api/types';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';

import {
  buildCreateUserPayload,
  buildUpdateUserPayload,
  createEmptyParticipantUserForm,
  mapUserToParticipantUserForm,
  userNeedsStudentInfo,
  type ParticipantUserFormState,
} from './participant-user-form';
import type { ParticipantFilterType } from './participants-view.utils';

function getParticipantErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

export function useParticipantsView() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState<ParticipantUserFormState>(createEmptyParticipantUserForm());
  const [editForm, setEditForm] = useState<ParticipantUserFormState>(createEmptyParticipantUserForm());
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 300);
  const [activeFilter, setActiveFilter] = useState<ParticipantFilterType>('all');
  const [roleFilter, setRoleFilter] = useState<UserRoleName | 'all'>('all');
  const [page, setPage] = useState(1);
  const statusFilter = activeFilter === 'all' ? undefined : activeFilter;
  const rolesFilter = roleFilter === 'all' ? undefined : [roleFilter];

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, roleFilter]);

  const usersQuery = useQuery({
    queryKey: queryKeys.users.list({
      page,
      limit: 10,
      status: statusFilter,
      search: debouncedSearchQuery || undefined,
      roles: rolesFilter,
    }),
    queryFn: () =>
      usersApi.list({
        page,
        limit: 10,
        status: statusFilter,
        search: debouncedSearchQuery || undefined,
        roles: rolesFilter,
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
      showStatusToast(response.data, 'User activated');
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to activate user', {
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

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(buildCreateUserPayload(createForm)),
    onSuccess: async (response) => {
      toast.success('User created', { description: `${response.data.fullName} has been added.` });
      setCreateOpen(false);
      setCreateForm(createEmptyParticipantUserForm());
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to create user', {
        description: getParticipantErrorMessage(error),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingUser) throw new Error('No user selected');
      return usersApi.update(editingUser.id, buildUpdateUserPayload(editForm));
    },
    onSuccess: async (response) => {
      toast.success('User updated', { description: `${response.data.fullName} has been updated.` });
      setEditOpen(false);
      setEditingUser(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to update user', {
        description: getParticipantErrorMessage(error),
      });
    },
  });

  const validateUserForm = (form: ParticipantUserFormState, mode: 'create' | 'edit') => {
    if (!form.fullName.trim()) {
      toast.error('Full name is required');
      return false;
    }
    if (!form.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (mode === 'create' && form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }
    if (form.roles.length === 0) {
      toast.error('At least one role is required');
      return false;
    }
    if (userNeedsStudentInfo(form) && (!form.studentType || !form.studentId.trim())) {
      toast.error('Student type and student ID are required for participant users');
      return false;
    }
    if (userNeedsStudentInfo(form) && form.studentType === 'EXTERNAL' && !form.schoolName.trim()) {
      toast.error('School name is required for external students');
      return false;
    }
    return true;
  };

  const handleCreateUser = () => {
    if (!validateUserForm(createForm, 'create')) return;
    createMutation.mutate();
  };

  const handleUpdateUser = () => {
    if (!editingUser || !validateUserForm(editForm, 'edit')) return;
    updateMutation.mutate();
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditForm(mapUserToParticipantUserForm(user));
    setEditOpen(true);
  };

  const handleExport = () => {
    const dataToExport = filteredUsers;

    if (dataToExport.length === 0) {
      toast.error('No users to export');
      return;
    }

    const headers = ['Full Name', 'Email', 'GitHub', 'Roles', 'Student Type', 'Student ID', 'School', 'Status', 'Created At'];
    const rows = dataToExport.map((user) => [
      user.fullName,
      user.email,
      user.githubUsername || '',
      user.roles.map((role) => role.name || role.code).filter(Boolean).join('; '),
      user.studentType || '',
      user.studentId || '',
      user.schoolName || '',
      user.status,
      user.createdAt,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `participants-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Export Successful', {
      description: `Exported ${dataToExport.length} user(s) to CSV.`,
    });
  };

  return {
    createForm,
    setCreateForm,
    createOpen,
    setCreateOpen: (open: boolean) => {
      setCreateOpen(open);
      if (!open) setCreateForm(createEmptyParticipantUserForm());
    },
    createMutation,
    editForm,
    setEditForm,
    editOpen,
    setEditOpen: (open: boolean) => {
      setEditOpen(open);
      if (!open) setEditingUser(null);
    },
    editingUser,
    updateMutation,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter: (filter: ParticipantFilterType) => {
      setActiveFilter(filter);
      setPage(1);
    },
    roleFilter,
    setRoleFilter: (role: UserRoleName | 'all') => {
      setRoleFilter(role);
      setPage(1);
    },
    page,
    setPage,
    usersQuery,
    allUsers,
    filteredUsers,
    pagination,
    approveMutation,
    rejectMutation,
    suspendMutation,
    activateMutation,
    handleCreateUser,
    handleUpdateUser,
    openEditDialog,
    handleExport,
  };
}
