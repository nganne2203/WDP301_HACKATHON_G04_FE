import { api } from './client';
import type { ListRankingsQuery, Ranking, SelectFinalistsRequest, SelectFinalistsResult, SelectManualFinalistsRequest } from './types';

export const finalistsApi = {
  list: (query?: ListRankingsQuery) =>
    api.get<Ranking[]>('/finalists', { params: query as Record<string, string | number | undefined> }),

  select: (data: SelectFinalistsRequest) =>
    api.post<SelectFinalistsResult>('/finalists/select', data),

  selectManual: (data: SelectManualFinalistsRequest) =>
    api.post<SelectFinalistsResult>('/finalists/manual', data),
};
