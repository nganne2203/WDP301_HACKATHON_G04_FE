import { api } from './client';
import type {
  Participant,
  CreateParticipantRequest,
  UpdateParticipantRequest,
  ListParticipantsQuery,
  CheckInQr,
} from './types';

export const participantsApi = {
  list: (query?: ListParticipantsQuery) =>
    api.get<Participant[]>('/participants', { params: query as Record<string, string | number | boolean | undefined> }),

  getById: (id: string) =>
    api.get<Participant>(`/participants/${id}`),

  getMine: (competitionId: string) =>
    api.get<Participant>('/participants/me', { params: { competitionId } }),

  register: (data: CreateParticipantRequest) =>
    api.post<Participant>('/participants', data),

  update: (id: string, data: UpdateParticipantRequest) =>
    api.patch<Participant>(`/participants/${id}`, data),

  checkIn: (id: string) =>
    api.patch<Participant>(`/participants/${id}/check-in`, { checkInStatus: 'CHECKED_IN' }),

  generateCheckInQr: (competitionId: string) =>
    api.post<CheckInQr>('/participants/check-in/qr', { competitionId }),

  scanCheckInQr: (token: string) =>
    api.post<Participant>('/participants/check-in/scan', { token }),
};
