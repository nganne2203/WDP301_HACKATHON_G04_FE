import { api } from './client';
import type {
  TimelineEvent,
  CreateTimelineRequest,
  UpdateTimelineRequest,
  ListTimelinesQuery,
} from './types';

export const timelinesApi = {
  list: (query?: ListTimelinesQuery) =>
    api.get<TimelineEvent[]>('/timelines', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<TimelineEvent>(`/timelines/${id}`),

  create: (data: CreateTimelineRequest) =>
    api.post<TimelineEvent>('/timelines', data),

  update: (id: string, data: UpdateTimelineRequest) =>
    api.patch<TimelineEvent>(`/timelines/${id}`, data),

  delete: (id: string) =>
    api.delete<null>(`/timelines/${id}`),
};
