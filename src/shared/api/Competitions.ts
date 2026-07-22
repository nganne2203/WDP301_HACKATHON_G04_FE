import { api } from './client';
import type {
  Competition,
  CreateCompetitionRequest,
  UpdateCompetitionRequest,
  UpdateCompetitionStatusRequest,
  ListCompetitionsQuery,
  SendCompetitionInvitationsRequest,
  SendCompetitionInvitationsResult,
} from './types';

export const eventsApi = {
  list: (query?: ListCompetitionsQuery) =>
    api.get<Competition[]>('/competitions', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<Competition>(`/competitions/${id}`),

  create: (data: CreateCompetitionRequest) =>
    api.post<Competition>('/competitions', data),

  update: (id: string, data: UpdateCompetitionRequest) =>
    api.patch<Competition>(`/competitions/${id}`, data),

  updateStatus: (id: string, data: UpdateCompetitionStatusRequest) =>
    api.patch<Competition>(`/competitions/${id}/status`, data),

  sendInvitations: (id: string, data: SendCompetitionInvitationsRequest) =>
    api.post<SendCompetitionInvitationsResult>(`/competitions/${id}/invitations`, data),

  delete: (id: string) =>
    api.delete<null>(`/competitions/${id}`),
};
