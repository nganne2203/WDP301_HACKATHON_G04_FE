import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { githubApi } from '@/entities/github/api';
import { repositoriesApi } from '@/entities/repository/api';
import { useStore } from '@/entities/session/model/store';
import { useCompetitionsQuery, useRoundsQuery, useTeamsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { Repository, RepositoryAccessState, RepositoryStatus, RevokeGitHubMembersResult } from '@/shared/api/types';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';

import { getApiErrorMessage } from './repository-view.utils';

export const PERMISSIONS = ['pull', 'triage', 'push', 'maintain', 'admin'] as const;

export function useRepositoriesView() {
  const queryClient = useQueryClient();
  const selectedCompetition = useStore((state) => state.selectedCompetition);
  const [repositoriesPage, setRepositoriesPage] = useState(1);
  const [repositorySearch, setRepositorySearch] = useState('');
  const [repositoryStatus, setRepositoryStatus] = useState<'all' | RepositoryStatus>('all');
  const [repositoryAccessState, setRepositoryAccessState] = useState<'all' | RepositoryAccessState>('all');
  const debouncedRepositorySearch = useDebouncedValue(repositorySearch.trim(), 300);
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

  const eventsQuery = useCompetitionsQuery();
  const competitions = eventsQuery.data || [];
  const activeCompetition = useMemo(() => {
    if (!competitions.length) return null;
    return competitions.find((competition) => competition.id === selectedCompetition?.id) || competitions[0];
  }, [competitions, selectedCompetition?.id]);
  const activeCompetitionId = activeCompetition?.id || '';

  useEffect(() => {
    setRepositoriesPage(1);
    setSelectedTeamId('');
    setSelectedRoundId('none');
    setSelectedRepositoryId('');
    setSelectedRepository(null);
  }, [activeCompetitionId]);

  const configQuery = useQuery({
    queryKey: queryKeys.github.config(activeCompetitionId),
    enabled: Boolean(activeCompetitionId),
    queryFn: async () => (await githubApi.getConfig(activeCompetitionId)).data,
  });

  const teamsQuery = useTeamsQuery({ competitionId: activeCompetitionId, limit: 10 }, { enabled: Boolean(activeCompetitionId) });

  const roundsQuery = useRoundsQuery({ competitionId: activeCompetitionId, limit: 10 }, { enabled: Boolean(activeCompetitionId) });

  const repositoriesQuery = useQuery({
    queryKey: queryKeys.repositories.list({
      competitionId: activeCompetitionId,
      page: repositoriesPage,
      limit: 10,
      search: debouncedRepositorySearch || undefined,
      status: repositoryStatus === 'all' ? undefined : repositoryStatus,
      accessState: repositoryAccessState === 'all' ? undefined : repositoryAccessState,
    }),
    enabled: Boolean(activeCompetitionId),
    queryFn: () => repositoriesApi.list({
      competitionId: activeCompetitionId,
      page: repositoriesPage,
      limit: 10,
      search: debouncedRepositorySearch || undefined,
      status: repositoryStatus === 'all' ? undefined : repositoryStatus,
      accessState: repositoryAccessState === 'all' ? undefined : repositoryAccessState,
    }),
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
    setRepositorySearch('');
    setRepositoryStatus('all');
    setRepositoryAccessState('all');
  }, [activeCompetitionId]);

  useEffect(() => {
    setRepositoriesPage(1);
  }, [debouncedRepositorySearch, repositoryStatus, repositoryAccessState]);

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
      if (!activeCompetitionId) throw new Error('Please select an competition first.');
      return (await githubApi.saveConfig({
        competitionId: activeCompetitionId,
        organizationName,
        ownerUsername,
        githubToken,
        enabled,
      })).data;
    },
    onSuccess: async () => {
      setGithubToken('');
      toast.success('GitHub configuration saved');
      await queryClient.invalidateQueries({ queryKey: queryKeys.github.config(activeCompetitionId) });
    },
    onError: (error) => toast.error('Could not save GitHub configuration', { description: getApiErrorMessage(error) }),
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      if (!activeCompetitionId) throw new Error('Please select an competition first.');
      return (await githubApi.testConnection(activeCompetitionId)).data;
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
      if (!activeCompetitionId) throw new Error('Please select an competition first.');
      if (!selectedTeamId) throw new Error('Please select a team first.');
      return (await githubApi.createRepository({
        competitionId: activeCompetitionId,
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
      if (!activeCompetitionId) throw new Error('Please select an competition first.');
      return (await githubApi.assignCollaborator(collabRepoName, collabUsername, {
        competitionId: activeCompetitionId,
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
      if (!activeCompetitionId) throw new Error('Please select an competition first.');
      return (await githubApi.revokeCollaborator(collabRepoName, collabUsername, {
        competitionId: activeCompetitionId,
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
      if (!activeCompetitionId) throw new Error('Please select an competition first.');
      return (await githubApi.registerRepositoryWebhook(collabRepoName, { competitionId: activeCompetitionId })).data;
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
      if (!activeCompetitionId) throw new Error('Please select an competition first.');
      return (await githubApi.inviteOrganizationMember({
        competitionId: activeCompetitionId,
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
      if (!activeCompetitionId) throw new Error('Please select an competition first.');
      return (await githubApi.revokeMembers({
        competitionId: activeCompetitionId,
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
      if (!activeCompetitionId) throw new Error('Please select an competition first.');
      if (!selectedTeamId) throw new Error('Please select a team first.');
      return (await repositoriesApi.create({
        competitionId: activeCompetitionId,
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
      if (!activeCompetitionId) throw new Error('Please select an competition first.');
      return (await githubApi.bulkCreateRepositories({
        competitionId: activeCompetitionId,
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
      if (!activeCompetitionId) throw new Error('Please select an competition first.');
      return (await githubApi.bulkGrantAccess({ competitionId: activeCompetitionId })).data;
    },
    onSuccess: (result) => {
      toast.success('Bulk collaborator access granted', {
        description: `Successfully granted access for ${result.success.length} collaborators. Failed: ${result.failed.length}.`,
      });
      if (result.failed.length > 0) {
        result.failed.forEach((fail: any) => {
          toast.error(`Could not grant access for ${fail.username || 'member'}`, {
            description: fail.error,
          });
        });
      }
    },
    onError: (error) => toast.error('Could not grant bulk access', { description: getApiErrorMessage(error) }),
  });

  const bulkRevokeAccessMutation = useMutation({
    mutationFn: async () => {
      if (!activeCompetitionId) throw new Error('Please select an competition first.');
      return (await githubApi.bulkRevokeAccess({ competitionId: activeCompetitionId })).data;
    },
    onSuccess: (result) => {
      toast.success('Bulk collaborator access revoked', {
        description: `Successfully revoked access for ${result.success.length} collaborators. Failed: ${result.failed.length}.`,
      });
      if (result.failed.length > 0) {
        result.failed.forEach((fail: any) => {
          toast.error(`Could not revoke access for ${fail.username || 'member'}`, {
            description: fail.error,
          });
        });
      }
    },
    onError: (error) => toast.error('Could not revoke bulk access', { description: getApiErrorMessage(error) }),
  });

  return {
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
    competitions,
    activeCompetition,
    activeCompetitionId,
    configQuery,
    teamsQuery,
    roundsQuery,
    repositoriesQuery,
    repositoriesPage,
    setRepositoriesPage,
    repositorySearch,
    setRepositorySearch,
    repositoryStatus,
    setRepositoryStatus,
    repositoryAccessState,
    setRepositoryAccessState,
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
