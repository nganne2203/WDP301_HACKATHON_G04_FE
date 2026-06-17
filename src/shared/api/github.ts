import { api } from './client';
import type {
  AssignGitHubCollaboratorRequest,
  AssignGitHubCollaboratorResult,
  CreateGitHubRepositoryRequest,
  CreateGitHubRepositoryResult,
  GitHubConfig,
  InviteGitHubOrganizationMemberRequest,
  InviteGitHubOrganizationMemberResult,
  RegisterGitHubWebhookRequest,
  RegisterGitHubWebhookResult,
  RevokeGitHubCollaboratorRequest,
  RevokeGitHubCollaboratorResult,
  RevokeGitHubMembersRequest,
  RevokeGitHubMembersResult,
  SaveGitHubConfigRequest,
  TestGitHubConnectionResult,
  BulkCreateGitHubRepositoriesRequest,
  BulkCreateGitHubRepositoriesResult,
} from './types';

export const githubApi = {
  getConfig: (eventId: string) =>
    api.get<GitHubConfig>('/github/config', { params: { eventId } }),

  saveConfig: (data: SaveGitHubConfigRequest) =>
    api.post<GitHubConfig>('/github/config', data),

  testConnection: (eventId: string) =>
    api.post<TestGitHubConnectionResult>('/github/config/test', { eventId }),

  createRepository: (data: CreateGitHubRepositoryRequest) =>
    api.post<CreateGitHubRepositoryResult>('/github/repositories', data),

  assignCollaborator: (repoName: string, username: string, data: AssignGitHubCollaboratorRequest) =>
    api.put<AssignGitHubCollaboratorResult>(
      `/github/repositories/${encodeURIComponent(repoName)}/collaborators/${encodeURIComponent(username)}`,
      data
    ),

  registerRepositoryWebhook: (repoName: string, data: RegisterGitHubWebhookRequest) =>
    api.post<RegisterGitHubWebhookResult>(
      `/github/repositories/${encodeURIComponent(repoName)}/webhooks/register`,
      data
    ),

  revokeCollaborator: (repoName: string, username: string, data: RevokeGitHubCollaboratorRequest) =>
    api.delete<RevokeGitHubCollaboratorResult>(
      `/github/repositories/${encodeURIComponent(repoName)}/collaborators/${encodeURIComponent(username)}`,
      { data }
    ),

  inviteOrganizationMember: (data: InviteGitHubOrganizationMemberRequest) =>
    api.post<InviteGitHubOrganizationMemberResult>('/github/organization/invitations', data),

  revokeMembers: (data: RevokeGitHubMembersRequest) =>
    api.post<RevokeGitHubMembersResult>('/github/organization/revoke-members', data),

  bulkCreateRepositories: (data: BulkCreateGitHubRepositoriesRequest) =>
    api.post<BulkCreateGitHubRepositoriesResult>('/github/repositories/bulk', data),
};
