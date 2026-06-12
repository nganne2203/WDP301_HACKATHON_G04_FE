import { api } from './client';
import type { PublishResultsRequest, PublishResultsResult } from './types';

export const resultsApi = {
  publish: (data: PublishResultsRequest) =>
    api.post<PublishResultsResult>('/results/publish', data),
};
