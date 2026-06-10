import { api } from './client';
import type { Submission, CreateSubmissionRequest, UpdateSubmissionRequest } from './types';

export const submissionsApi = {
  list: (query?: { eventId?: string; roundId?: string; teamId?: string; status?: string; page?: number; limit?: number }) =>
    api.get<Submission[]>('/submissions', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<Submission>(`/submissions/${id}`),

  create: (data: CreateSubmissionRequest) =>
    api.post<Submission>('/submissions', data),

  update: (id: string, data: UpdateSubmissionRequest) =>
    api.patch<Submission>(`/submissions/${id}`, data),
};
