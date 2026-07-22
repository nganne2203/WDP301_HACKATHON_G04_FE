import { api } from './client';
import type { OperationsDashboardMetrics, PipelineSummary } from './types';

export const operationsApi = {
  getDashboardMetrics: (query?: { competitionId?: string }) =>
    api.get<OperationsDashboardMetrics>('/operations/dashboard', {
      params: query as Record<string, string | undefined>,
    }),

  getPipelineSummary: (query?: { competitionId?: string }) =>
    api.get<PipelineSummary>('/operations/pipeline-summary', {
      params: query as Record<string, string | undefined>,
    }),
};
