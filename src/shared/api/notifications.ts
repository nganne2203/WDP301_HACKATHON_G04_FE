import { api } from './client';
import type { ListNotificationsQuery, MarkAllNotificationsReadResult, Notification } from './types';

export const notificationsApi = {
  list: (query?: ListNotificationsQuery) =>
    api.get<Notification[]>('/notifications', { params: query as Record<string, string | number | undefined> }),

  markAsRead: (id: string) =>
    api.patch<Notification>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch<MarkAllNotificationsReadResult>('/notifications/read-all'),
};
