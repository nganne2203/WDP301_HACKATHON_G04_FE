import { api } from './client';
import type { Round, CreateRoundRequest, UpdateRoundRequest } from './types';

export const roundsApi = {
  list: (query?: { eventId?: string; roundType?: string; status?: string; page?: number; limit?: number }) =>
    api.get<Round[]>('/rounds', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<Round>(`/rounds/${id}`),

  create: (data: CreateRoundRequest) =>
    api.post<Round>('/rounds', data),

  update: (id: string, data: UpdateRoundRequest) =>
    api.patch<Round>(`/rounds/${id}`, data),
};
