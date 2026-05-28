import { api } from './client';
import type {
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  UpdateEventStatusRequest,
  ListEventsQuery,
} from './types';

export const eventsApi = {
  list: (query?: ListEventsQuery) =>
    api.get<Event[]>('/events', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<Event>(`/events/${id}`),

  create: (data: CreateEventRequest) =>
    api.post<Event>('/events', data),

  update: (id: string, data: UpdateEventRequest) =>
    api.patch<Event>(`/events/${id}`, data),

  updateStatus: (id: string, data: UpdateEventStatusRequest) =>
    api.patch<Event>(`/events/${id}/status`, data),

  delete: (id: string) =>
    api.delete<null>(`/events/${id}`),
};
