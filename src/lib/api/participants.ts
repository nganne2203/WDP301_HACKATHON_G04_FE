import { api } from './client';
import type {
  Participant,
  CreateParticipantRequest,
  UpdateParticipantRequest,
  ListParticipantsQuery,
} from './types';

export const participantsApi = {
  list: (query?: ListParticipantsQuery) =>
    api.get<Participant[]>('/participants', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<Participant>(`/participants/${id}`),

  register: (data: CreateParticipantRequest) =>
    api.post<Participant>('/participants', data),

  update: (id: string, data: UpdateParticipantRequest) =>
    api.patch<Participant>(`/participants/${id}`, data),

  checkIn: (id: string) =>
    api.patch<Participant>(`/participants/${id}/check-in`, {}),
};
