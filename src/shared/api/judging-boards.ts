import { api } from './client';
import type {
  JudgingBoard,
  CreateJudgingBoardRequest,
  UpdateJudgingBoardRequest,
  AutoAssignRequest,
  ListJudgingBoardsQuery,
} from './types';

export const judgingBoardsApi = {
  list: (query?: ListJudgingBoardsQuery) =>
    api.get<JudgingBoard[]>('/judging-boards', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<JudgingBoard>(`/judging-boards/${id}`),

  create: (data: CreateJudgingBoardRequest) =>
    api.post<JudgingBoard>('/judging-boards', data),

  autoAssign: (data: AutoAssignRequest) =>
    api.post<JudgingBoard[]>('/judging-boards/auto-assign', data),

  update: (id: string, data: UpdateJudgingBoardRequest) =>
    api.patch<JudgingBoard>(`/judging-boards/${id}`, data),
};
