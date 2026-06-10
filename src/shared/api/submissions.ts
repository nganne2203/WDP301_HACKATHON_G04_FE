import { api } from './client';
import type {
  Submission,
  CreateSubmissionRequest,
  UpdateSubmissionRequest,
  ListSubmissionsQuery,
  SubmissionStatus,
} from './types';

export const submissionsApi = {
  list: (query?: ListSubmissionsQuery) =>
    api.get<Submission[]>('/submissions', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<Submission>(`/submissions/${id}`),

  create: (data: CreateSubmissionRequest) =>
    api.post<Submission>('/submissions', data),

  update: (id: string, data: UpdateSubmissionRequest) =>
    api.patch<Submission>(`/submissions/${id}`, data),

  submit: (id: string) =>
    api.post<Submission>(`/submissions/${id}/submit`),

  updateStatus: (id: string, status: SubmissionStatus) =>
    api.patch<Submission>(`/submissions/${id}/status`, { status }),
};
