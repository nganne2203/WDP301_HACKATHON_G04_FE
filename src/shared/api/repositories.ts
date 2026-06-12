import { api } from './client';
import type {
  AnalyzeRepositoryCommitRequest,
  CreateRepositoryRequest,
  ListRepositoriesQuery,
  Repository,
  RepositoryAiReview,
  RepositoryCommit,
  RepositoryCommitDiff,
  RepositoryImpactDecision,
  RepositoryStaticAnalysisResult,
  TriggerPerPushReviewRequest,
  TriggerTeamAggregateReviewRequest,
  UpdateRepositoryRequest,
} from './types';

export const repositoriesApi = {
  list: (query?: ListRepositoriesQuery) =>
    api.get<Repository[]>('/repositories', {
      params: query as Record<string, string | number | undefined>,
    }),

  getById: (id: string) =>
    api.get<Repository>(`/repositories/${id}`),

  create: (data: CreateRepositoryRequest) =>
    api.post<Repository>('/repositories', data),

  update: (id: string, data: UpdateRepositoryRequest) =>
    api.patch<Repository>(`/repositories/${id}`, data),

  listCommits: (id: string, page = 1, limit = 20) =>
    api.get<RepositoryCommit[]>(`/repositories/${id}/commits`, {
      params: { page, limit },
    }),

  listCommitDiffs: (id: string, page = 1, limit = 20) =>
    api.get<RepositoryCommitDiff[]>(`/repositories/${id}/commit-diffs`, {
      params: { page, limit },
    }),

  listStaticAnalysis: (id: string, page = 1, limit = 20) =>
    api.get<RepositoryStaticAnalysisResult[]>(`/repositories/${id}/static-analysis`, {
      params: { page, limit },
    }),

  listImpactDecisions: (id: string, page = 1, limit = 20) =>
    api.get<RepositoryImpactDecision[]>(`/repositories/${id}/impact-decisions`, {
      params: { page, limit },
    }),

  listAiReviews: (id: string, page = 1, limit = 20) =>
    api.get<{ repository: Repository | null; aiReviews: RepositoryAiReview[] }>(`/repositories/${id}/ai-reviews`, {
      params: { page, limit },
    }),

  syncCommits: (id: string) =>
    api.post<{ repositoryId: string; queued?: boolean; jobId?: string | null }>(`/repositories/${id}/sync-commits`),

  analyzeCommit: (id: string, data: AnalyzeRepositoryCommitRequest = {}) =>
    api.post<{ repositoryId: string; commitSha?: string | null; queued?: boolean; jobId?: string | null }>(
      `/repositories/${id}/analyze-commit`,
      data
    ),

  triggerPerPushReview: (id: string, data: TriggerPerPushReviewRequest = {}) =>
    api.post<{ review?: RepositoryAiReview | null; queued?: boolean; jobId?: string | null }>(
      `/repositories/${id}/ai-reviews/per-push`,
      data
    ),

  triggerTeamAggregateReview: (id: string, data: TriggerTeamAggregateReviewRequest = {}) =>
    api.post<{ review?: RepositoryAiReview | null; queued?: boolean; jobId?: string | null }>(
      `/repositories/${id}/ai-reviews/team-aggregate`,
      data
    ),
};
