import { api } from './client';
import type {
  TimelineActivity,
  CreateTimelineRequest,
  UpdateTimelineRequest,
  ListTimelinesQuery,
} from './types';

export const timelinesApi = {
  list: (query?: ListTimelinesQuery) =>
    api.get<TimelineActivity[]>('/timelines', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<TimelineActivity>(`/timelines/${id}`),

  create: (data: CreateTimelineRequest) =>
    api.post<TimelineActivity>('/timelines', data),

  update: (id: string, data: UpdateTimelineRequest) =>
    api.patch<TimelineActivity>(`/timelines/${id}`, data),

  delete: (id: string) =>
    api.delete<null>(`/timelines/${id}`),
};
