import { api } from './client';
import type {
  Track,
  CreateTrackRequest,
  UpdateTrackRequest,
  ListTracksQuery,
} from './types';

export const tracksApi = {
  list: (query?: ListTracksQuery) =>
    api.get<Track[]>('/tracks', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<Track>(`/tracks/${id}`),

  create: (data: CreateTrackRequest) =>
    api.post<Track>('/tracks', data),

  update: (id: string, data: UpdateTrackRequest) =>
    api.patch<Track>(`/tracks/${id}`, data),

  delete: (id: string) =>
    api.delete<null>(`/tracks/${id}`),
};
