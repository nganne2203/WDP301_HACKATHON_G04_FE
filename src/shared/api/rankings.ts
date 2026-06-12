import { api } from './client';
import type { GenerateRankingsRequest, GenerateRankingsResult, ListRankingsQuery, Ranking } from './types';

export const rankingsApi = {
  list: (query?: ListRankingsQuery) =>
    api.get<Ranking[]>('/rankings', { params: query as Record<string, string | number | undefined> }),

  generate: (data: GenerateRankingsRequest) =>
    api.post<GenerateRankingsResult>('/rankings/generate', data),
};
