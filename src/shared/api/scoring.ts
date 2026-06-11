import { api } from './client';
import type { ListScoreSheetsQuery, ScoreSheet, SubmitScoreSheetRequest } from './types';

export const scoringApi = {
  listSheets: (query?: ListScoreSheetsQuery) =>
    api.get<ScoreSheet[]>('/score-sheets', { params: query as Record<string, string | number | undefined> }),

  getSheetById: (id: string) =>
    api.get<ScoreSheet>(`/score-sheets/${id}`),

  submitSheet: async (data: SubmitScoreSheetRequest) => {
    const { scoreSheetId, submit = false, ...payload } = data;

    const draftResponse = scoreSheetId
      ? await api.patch<ScoreSheet>(`/score-sheets/${scoreSheetId}`, {
        generalComment: payload.generalComment,
        scores: payload.scores,
      })
      : await api.post<ScoreSheet>('/score-sheets', {
        eventId: payload.eventId,
        roundId: payload.roundId,
        boardId: payload.boardId,
        teamId: payload.teamId,
        submissionId: payload.submissionId,
        rubricId: payload.rubricId ?? null,
        generalComment: payload.generalComment,
        scores: payload.scores,
      });

    if (!submit) {
      return draftResponse;
    }

    return api.post<ScoreSheet>(`/score-sheets/${draftResponse.data.id}/submit`);
  },
};
