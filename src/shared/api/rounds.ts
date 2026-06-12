import { api } from './client';
import type { Round, CreateRoundRequest, UpdateRoundRequest, ListRoundsQuery } from './types';

export const roundsApi = {
  list: (query?: ListRoundsQuery) =>
    api.get<Round[]>('/rounds', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<Round>(`/rounds/${id}`),

  create: (data: CreateRoundRequest) =>
    api.post<Round>('/rounds', data),

  update: (id: string, data: UpdateRoundRequest) =>
    api.patch<Round>(`/rounds/${id}`, data),

  delete: (id: string) =>
    api.delete<null>(`/rounds/${id}`),
};
