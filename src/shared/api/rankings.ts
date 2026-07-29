import { api } from './client';
import type { GenerateRankingsRequest, GenerateRankingsResult, ListRankingsQuery, Ranking, ResolveTieBreakRequest, ResolveTieBreakResult } from './types';

export const rankingsApi = {
  list: (query?: ListRankingsQuery) =>
    api.get<Ranking[]>('/rankings', { params: query as Record<string, string | number | undefined> }),

  generate: (data: GenerateRankingsRequest) =>
    api.post<GenerateRankingsResult>('/rankings/generate', data),

  resolveTieBreak: (data: ResolveTieBreakRequest) =>
    api.post<ResolveTieBreakResult>('/rankings/tie-breaks/resolve', data),
};
