import { api } from './client';
import type {
  Rubric,
  Criterion,
  CreateRubricRequest,
  UpdateRubricRequest,
  CreateCriterionRequest,
  UpdateCriterionRequest,
} from './types';

export const rubricsApi = {
  list: (query?: { eventId?: string; page?: number; limit?: number }) =>
    api.get<Rubric[]>('/rubrics', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<Rubric>(`/rubrics/${id}`),

  create: (data: CreateRubricRequest) =>
    api.post<Rubric>('/rubrics', data),

  update: (id: string, data: UpdateRubricRequest) =>
    api.patch<Rubric>(`/rubrics/${id}`, data),

  delete: (id: string) =>
    api.delete<null>(`/rubrics/${id}`),

  listCriteria: (rubricId: string) =>
    api.get<Criterion[]>(`/rubrics/${rubricId}/criteria`),

  createCriterion: (rubricId: string, data: CreateCriterionRequest) =>
    api.post<Criterion>(`/rubrics/${rubricId}/criteria`, data),

  updateCriterion: (rubricId: string, criterionId: string, data: UpdateCriterionRequest) =>
    api.patch<Criterion>(`/rubrics/${rubricId}/criteria/${criterionId}`, data),

  deleteCriterion: (rubricId: string, criterionId: string) =>
    api.delete<null>(`/rubrics/${rubricId}/criteria/${criterionId}`),
};
