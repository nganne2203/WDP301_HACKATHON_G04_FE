import { api } from './client';
import type { ListRankingsQuery, Ranking, SelectFinalistsRequest, SelectFinalistsResult } from './types';

export const finalistsApi = {
  list: (query?: ListRankingsQuery) =>
    api.get<Ranking[]>('/finalists', { params: query as Record<string, string | number | undefined> }),

  select: (data: SelectFinalistsRequest) =>
    api.post<SelectFinalistsResult>('/finalists/select', data),
};
