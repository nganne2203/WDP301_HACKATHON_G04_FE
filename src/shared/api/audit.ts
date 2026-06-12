import { api } from './client';
import type { AuditLog, AuditLogSummary, ListAuditLogsQuery } from './types';

export const auditApi = {
  list: (query?: ListAuditLogsQuery) =>
    api.get<AuditLog[]>('/audit-logs', { params: query as Record<string, string | number | undefined> }),

  getSummary: (query?: Omit<ListAuditLogsQuery, 'page' | 'limit'>) =>
    api.get<AuditLogSummary>('/audit-logs/summary', { params: query as Record<string, string | undefined> }),
};
