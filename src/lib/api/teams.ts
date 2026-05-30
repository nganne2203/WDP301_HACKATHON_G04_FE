import { api } from './client';
import type {
  CreateTeamRequest,
  InvitationDecisionResult,
  InviteMembersRequest,
  InviteMembersResult,
  ListTeamsQuery,
  ReplaceInvitationRequest,
  Team,
  TeamInvitation,
} from './types';

export const teamsApi = {
  list: (query?: ListTeamsQuery) =>
    api.get<Team[]>('/teams', { params: query as Record<string, string | number | undefined> }),

  create: (data: CreateTeamRequest) =>
    api.post<Team>('/teams', data),

  getById: (id: string) =>
    api.get<Team>(`/teams/${id}`),

  getMyTeam: (eventId: string) =>
    api.get<Team>('/teams/my', { params: { eventId } }),

  inviteMembers: (teamId: string, data: InviteMembersRequest) =>
    api.post<InviteMembersResult>(`/teams/${teamId}/invitations`, data),

  replaceInvitation: (teamId: string, invitationId: string, data: ReplaceInvitationRequest) =>
    api.patch<TeamInvitation>(`/teams/${teamId}/invitations/${invitationId}/replace`, data),

  cancelInvitation: (teamId: string, invitationId: string) =>
    api.delete<TeamInvitation>(`/teams/${teamId}/invitations/${invitationId}`),

  acceptInvitation: (token: string) =>
    api.post<InvitationDecisionResult>(`/teams/invitations/${token}/accept`, undefined, { auth: false }),

  declineInvitation: (token: string) =>
    api.post<InvitationDecisionResult>(`/teams/invitations/${token}/decline`, undefined, { auth: false }),
};
