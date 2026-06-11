import { api } from './client';
import type { OperationsDashboardMetrics, PipelineSummary } from './types';

export const operationsApi = {
  getDashboardMetrics: (query?: { eventId?: string }) =>
    api.get<OperationsDashboardMetrics>('/operations/dashboard', {
      params: query as Record<string, string | undefined>,
    }),

  getPipelineSummary: (query?: { eventId?: string }) =>
    api.get<PipelineSummary[]>('/operations/pipeline-summary', {
      params: query as Record<string, string | undefined>,
    }),
};
