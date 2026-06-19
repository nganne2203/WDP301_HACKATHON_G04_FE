import { api } from './client';
import type {
  JudgingBoard,
  CreateJudgingBoardRequest,
  UpdateJudgingBoardRequest,
  AutoAssignRequest,
  ConfirmJudgingBoardRandomizationRequest,
  JudgingBoardRandomizationPreview,
  ListJudgingBoardsQuery,
} from './types';

export const judgingBoardsApi = {
  list: (query?: ListJudgingBoardsQuery) =>
    api.get<JudgingBoard[]>('/judging-boards', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<JudgingBoard>(`/judging-boards/${id}`),

  create: (data: CreateJudgingBoardRequest) =>
    api.post<JudgingBoard>('/judging-boards', data),

  randomizePreview: (data: AutoAssignRequest) =>
    api.post<JudgingBoardRandomizationPreview>('/judging-boards/randomize-preview', data),

  confirmRandomization: (data: ConfirmJudgingBoardRandomizationRequest) =>
    api.post<{ boards: JudgingBoard[]; boardCount: number; confirmedTeamCount: number }>('/judging-boards/confirm-randomization', data),

  autoAssign: (data: AutoAssignRequest) =>
    api.post<JudgingBoard[]>('/judging-boards/auto-assign', data),

  update: (id: string, data: UpdateJudgingBoardRequest) =>
    api.patch<JudgingBoard>(`/judging-boards/${id}`, data),
};
