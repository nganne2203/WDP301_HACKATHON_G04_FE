import { api } from './client';
import type {
  Rubric,
  Criterion,
  CreateRubricRequest,
  UpdateRubricRequest,
  CreateCriterionRequest,
  UpdateCriterionRequest,
  ListRubricsQuery,
} from './types';

export const rubricsApi = {
  list: (query?: ListRubricsQuery) =>
    api.get<Rubric[]>('/rubrics', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<Rubric>(`/rubrics/${id}`),

  create: (data: CreateRubricRequest) =>
    api.post<Rubric>('/rubrics', data),

  update: (id: string, data: UpdateRubricRequest) =>
    api.patch<Rubric>(`/rubrics/${id}`, data),

  delete: (id: string) =>
    api.delete<null>(`/rubrics/${id}`),

  createCriterion: (rubricId: string, data: CreateCriterionRequest) =>
    api.post<{ criterion: Criterion; rubric: Rubric }>(`/rubrics/${rubricId}/criteria`, data),

  updateCriterion: (rubricId: string, criterionId: string, data: UpdateCriterionRequest) =>
    api.patch<{ criterion: Criterion; rubric: Rubric }>(`/rubrics/${rubricId}/criteria/${criterionId}`, data),

  deleteCriterion: (rubricId: string, criterionId: string) =>
    api.delete<{ deletedCriterionId: string; rubric: Rubric }>(`/rubrics/${rubricId}/criteria/${criterionId}`),
};
