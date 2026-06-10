import { api } from './client';
import type { ScoreSheet, SubmitScoreSheetRequest } from './types';

export const scoringApi = {
  listSheets: (query?: { roundId?: string; judgeId?: string; teamId?: string; boardId?: string; status?: string; page?: number; limit?: number }) =>
    api.get<ScoreSheet[]>('/scoring/sheets', { params: query as Record<string, string | number | undefined> }),

  getSheetById: (id: string) =>
    api.get<ScoreSheet>(`/scoring/sheets/${id}`),

  submitSheet: (data: SubmitScoreSheetRequest) =>
    api.post<ScoreSheet>('/scoring/sheets', data),
};
