import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { githubApi } from '@/entities/github/api';
import { repositoriesApi } from '@/entities/repository/api';
import { useEventsQuery, useRoundsQuery, useTeamsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { Repository, RevokeGitHubMembersResult } from '@/shared/api/types';

import { getApiErrorMessage } from './repository-view.utils';

export const PERMISSIONS = ['pull', 'triage', 'push', 'maintain', 'admin'] as const;

export function useRepositoriesView() {
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [repositoriesPage, setRepositoriesPage] = useState(1);
  const [organizationName, setOrganizationName] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [enabled, setEnabled] = useState(false);

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedRoundId, setSelectedRoundId] = useState('none');
  const [repoName, setRepoName] = useState('');
  const [repoDescription, setRepoDescription] = useState('');
  const [repoPrivate, setRepoPrivate] = useState(true);

  const [linkOwner, setLinkOwner] = useState('');
  const [linkRepo, setLinkRepo] = useState('');
  const [linkBranch, setLinkBranch] = useState('main');

  const [selectedRepositoryId, setSelectedRepositoryId] = useState('');
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [collabRepoName, setCollabRepoName] = useState('');
  const [collabUsername, setCollabUsername] = useState('');
  const [collabPermission, setCollabPermission] = useState<typeof PERMISSIONS[number]>('push');

  const [inviteEmail, setInviteEmail] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [revokeResult, setRevokeResult] = useState<RevokeGitHubMembersResult | null>(null);

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);
  const activeEventId = activeEvent?.id || '';

  const configQuery = useQuery({
    queryKey: queryKeys.github.config(activeEventId),
    enabled: Boolean(activeEventId),
    queryFn: async () => (await githubApi.getConfig(activeEventId)).data,
  });

  const teamsQuery = useTeamsQuery({ eventId: activeEventId, limit: 10 }, { enabled: Boolean(activeEventId) });

  const roundsQuery = useRoundsQuery({ eventId: activeEventId, limit: 10 }, { enabled: Boolean(activeEventId) });

  const repositoriesQuery = useQuery({
    queryKey: queryKeys.repositories.list({ eventId: activeEventId, page: repositoriesPage, limit: 10 }),
    enabled: Boolean(activeEventId),
    queryFn: () => repositoriesApi.list({ eventId: activeEventId, page: repositoriesPage, limit: 10 }),
  });

  const teams = teamsQuery.data || [];
  const rounds = roundsQuery.data || [];
  const repositories = repositoriesQuery.data?.data || [];
  const repositoriesPagination = repositoriesQuery.data?.pagination;
  const selectedRepositorySummary = repositories.find((repository) => repository.id === selectedRepositoryId) || null;

  useEffect(() => {
    setOrganizationName('');
    setOwnerUsername('');
    setGithubToken('');
    setEnabled(false);
    setSelectedTeamId('');
    setSelectedRoundId('none');
    setLinkOwner('');
    setLinkRepo('');
    setLinkBranch('main');
    setSelectedRepositoryId('');
    setCollabRepoName('');
    setRevokeResult(null);
    setRepositoriesPage(1);
  }, [activeEventId]);

  useEffect(() => {
    if (!configQuery.data) return;
    setOrganizationName(configQuery.data.organizationName || '');
    setOwnerUsername(configQuery.data.ownerUsername || '');
    setEnabled(Boolean(configQuery.data.enabled));
  }, [configQuery.data]);

  useEffect(() => {
    if (!repositories.length) return;
    const preferred = repositories.find((item) => item.id === selectedRepositoryId) || repositories[0];
    setSelectedRepositoryId(preferred.id);
    setCollabRepoName((current) => current || preferred.githubRepo);
  }, [repositories, selectedRepositoryId]);

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.saveConfig({
        eventId: activeEventId,
        organizationName,
        ownerUsername,
        githubToken,
        enabled,
      })).data;
    },
    onSuccess: async () => {
      setGithubToken('');
      toast.success('GitHub configuration saved');
      await queryClient.invalidateQueries({ queryKey: queryKeys.github.config(activeEventId) });
    },
    onError: (error) => toast.error('Could not save GitHub configuration', { description: getApiErrorMessage(error) }),
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.testConnection(activeEventId)).data;
    },
    onSuccess: (result) => {
      toast.success('GitHub connection works', {
        description: `${result.organizationName} is accessible.`,
      });
    },
    onError: (error) => toast.error('GitHub connection failed', { description: getApiErrorMessage(error) }),
  });

  const createRepositoryMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      if (!selectedTeamId) throw new Error('Please select a team first.');
      return (await githubApi.createRepository({
        eventId: activeEventId,
        teamId: selectedTeamId,
        roundId: selectedRoundId === 'none' ? null : selectedRoundId,
        repoName,
        description: repoDescription,
        private: repoPrivate,
      })).data;
    },
    onSuccess: async (result) => {
      toast.success('Repository created', {
        description: result.htmlUrl || result.repoName,
      });
      setRepoName('');
      setRepoDescription('');
      setRepoPrivate(true);
      setCollabRepoName(result.repoName);
      await queryClient.invalidateQueries({ queryKey: queryKeys.repositories.lists() });
    },
    onError: (error) => toast.error('Could not create repository', { description: getApiErrorMessage(error) }),
  });

  const assignCollaboratorMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.assignCollaborator(collabRepoName, collabUsername, {
        eventId: activeEventId,
        permission: collabPermission,
      })).data;
    },
    onSuccess: async (result) => {
      toast.success('Collaborator assigned', {
        description: `${result.username} has ${result.permission} access to ${result.repoName}.`,
      });
      setCollabUsername('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.repositories.lists() });
    },
    onError: (error) => toast.error('Could not assign collaborator', { description: getApiErrorMessage(error) }),
  });

  const revokeCollaboratorMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.revokeCollaborator(collabRepoName, collabUsername, {
        eventId: activeEventId,
      })).data;
    },
    onSuccess: async (result) => {
      toast.success('Collaborator revoked', {
        description: `${result.username} was removed from ${result.repoName}.`,
      });
      setCollabUsername('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.repositories.lists() });
    },
    onError: (error) => toast.error('Could not revoke collaborator', { description: getApiErrorMessage(error) }),
  });

  const registerWebhookMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.registerRepositoryWebhook(collabRepoName, { eventId: activeEventId })).data;
    },
    onSuccess: async (result) => {
      toast.success('Webhook registered', {
        description: `${result.repoName} is now pointing to ${result.callbackUrl}.`,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.repositories.lists() });
    },
    onError: (error) => toast.error('Could not register webhook', { description: getApiErrorMessage(error) }),
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.inviteOrganizationMember({
        eventId: activeEventId,
        email: inviteEmail,
        role: 'direct_member',
      })).data;
    },
    onSuccess: (result) => {
      toast.success('Organization invitation sent', {
        description: result.email,
      });
      setInviteEmail('');
    },
    onError: (error) => toast.error('Could not invite organization member', { description: getApiErrorMessage(error) }),
  });

  const revokeMembersMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.revokeMembers({
        eventId: activeEventId,
        confirmationText: 'REVOKE MEMBERS',
      })).data;
    },
    onSuccess: (result) => {
      setRevokeResult(result);
      setConfirmationText('');
      toast.success('Organization member revoke completed', {
        description: `${result.removed.length} removed, ${result.failed.length} failed.`,
      });
    },
    onError: (error) => toast.error('Could not revoke organization members', { description: getApiErrorMessage(error) }),
  });

  const syncRepositoryMutation = useMutation({
    mutationFn: (repositoryId: string) => repositoriesApi.syncCommits(repositoryId),
    onSuccess: async () => {
      toast.success('Sync commits requested');
      await queryClient.invalidateQueries({ queryKey: queryKeys.repositories.lists() });
    },
    onError: (error) => toast.error('Could not sync commits', { description: getApiErrorMessage(error) }),
  });

  const analyzeRepositoryMutation = useMutation({
    mutationFn: (repositoryId: string) => repositoriesApi.analyzeCommit(repositoryId),
    onSuccess: () => toast.success('Analyze commit requested'),
    onError: (error) => toast.error('Could not request analysis', { description: getApiErrorMessage(error) }),
  });

  const triggerAiReviewMutation = useMutation({
    mutationFn: (repositoryId: string) => repositoriesApi.triggerTeamAggregateReview(repositoryId),
    onSuccess: () => toast.success('Team aggregate AI review requested'),
    onError: (error) => toast.error('Could not trigger AI review', { description: getApiErrorMessage(error) }),
  });

  const triggerPerPushReviewMutation = useMutation({
    mutationFn: (repositoryId: string) => repositoriesApi.triggerPerPushReview(repositoryId),
    onSuccess: () => toast.success('Per-push AI review requested'),
    onError: (error) => toast.error('Could not trigger per-push review', { description: getApiErrorMessage(error) }),
  });

  const linkRepositoryMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      if (!selectedTeamId) throw new Error('Please select a team first.');
      return (await repositoriesApi.create({
        eventId: activeEventId,
        teamId: selectedTeamId,
        githubOwner: linkOwner,
        githubRepo: linkRepo,
        repositoryUrl: `https://github.com/${linkOwner}/${linkRepo}`,
        defaultBranch: linkBranch || 'main',
      })).data;
    },
    onSuccess: async (result) => {
      toast.success('Repository linked', { description: result.repositoryFullName });
      setLinkOwner('');
      setLinkRepo('');
      setLinkBranch('main');
      await queryClient.invalidateQueries({ queryKey: queryKeys.repositories.lists() });
    },
    onError: (error) => toast.error('Could not link repository', { description: getApiErrorMessage(error) }),
  });

  const bulkCreateRepositoriesMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.bulkCreateRepositories({
        eventId: activeEventId,
        roundId: selectedRoundId === 'none' ? null : selectedRoundId,
        assignCollaborators: false,
      })).data;
    },
    onSuccess: async (result) => {
      toast.success('Bulk repository creation completed', {
        description: `Created ${result.totalReposCreated} repositories successfully. Success: ${result.success.length}, Failed: ${result.failed.length}.`,
      });
      if (result.failed.length > 0) {
        result.failed.forEach((fail) => {
          toast.error(`Failed to create repository for team ${fail.teamName}`, {
            description: fail.error,
          });
        });
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.repositories.lists() });
    },
    onError: (error) => toast.error('Could not create bulk repositories', { description: getApiErrorMessage(error) }),
  });

  const bulkGrantAccessMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.bulkGrantAccess({ eventId: activeEventId })).data;
    },
    onSuccess: (result) => {
      toast.success('Cấp quyền hàng loạt thành công', {
        description: `Đã cấp quyền cho ${result.success.length} collaborator. Thất bại: ${result.failed.length}.`,
      });
      if (result.failed.length > 0) {
        result.failed.forEach((fail: any) => {
          toast.error(`Lỗi cấp quyền cho ${fail.username || 'thành viên'}`, {
            description: fail.error,
          });
        });
      }
    },
    onError: (error) => toast.error('Không thể cấp quyền hàng loạt', { description: getApiErrorMessage(error) }),
  });

  const bulkRevokeAccessMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.bulkRevokeAccess({ eventId: activeEventId })).data;
    },
    onSuccess: (result) => {
      toast.success('Thu hồi quyền hàng loạt thành công', {
        description: `Đã thu hồi quyền cho ${result.success.length} collaborator. Thất bại: ${result.failed.length}.`,
      });
      if (result.failed.length > 0) {
        result.failed.forEach((fail: any) => {
          toast.error(`Lỗi thu hồi quyền cho ${fail.username || 'thành viên'}`, {
            description: fail.error,
          });
        });
      }
    },
    onError: (error) => toast.error('Không thể thu hồi quyền hàng loạt', { description: getApiErrorMessage(error) }),
  });

  return {
    selectedEventId,
    setSelectedEventId,
    organizationName,
    setOrganizationName,
    ownerUsername,
    setOwnerUsername,
    githubToken,
    setGithubToken,
    enabled,
    setEnabled,
    selectedTeamId,
    setSelectedTeamId,
    selectedRoundId,
    setSelectedRoundId,
    repoName,
    setRepoName,
    repoDescription,
    setRepoDescription,
    repoPrivate,
    setRepoPrivate,
    selectedRepositoryId,
    setSelectedRepositoryId,
    selectedRepository,
    setSelectedRepository,
    collabRepoName,
    setCollabRepoName,
    collabUsername,
    setCollabUsername,
    collabPermission,
    setCollabPermission,
    inviteEmail,
    setInviteEmail,
    confirmationText,
    setConfirmationText,
    revokeResult,
    eventsQuery,
    events,
    activeEvent,
    activeEventId,
    configQuery,
    teamsQuery,
    roundsQuery,
    repositoriesQuery,
    repositoriesPage,
    setRepositoriesPage,
    repositoriesPagination,
    teams,
    rounds,
    repositories,
    selectedRepositorySummary,
    saveConfigMutation,
    testConnectionMutation,
    createRepositoryMutation,
    assignCollaboratorMutation,
    revokeCollaboratorMutation,
    registerWebhookMutation,
    inviteMemberMutation,
    revokeMembersMutation,
    syncRepositoryMutation,
    analyzeRepositoryMutation,
    triggerAiReviewMutation,
    triggerPerPushReviewMutation,
    linkRepositoryMutation,
    bulkCreateRepositoriesMutation,
    bulkGrantAccessMutation,
    bulkRevokeAccessMutation,
    linkOwner,
    setLinkOwner,
    linkRepo,
    setLinkRepo,
    linkBranch,
    setLinkBranch,
    config: configQuery.data,
  };
}
