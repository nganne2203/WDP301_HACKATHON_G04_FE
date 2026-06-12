type QueryParams = object | undefined;

const params = <T extends QueryParams>(value: T) => value ?? {};

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.events.lists(), params(query)] as const,
    detail: (id?: string) => [...queryKeys.events.all, 'detail', id] as const,
  },
  rounds: {
    all: ['rounds'] as const,
    lists: () => [...queryKeys.rounds.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.rounds.lists(), params(query)] as const,
    detail: (id?: string) => [...queryKeys.rounds.all, 'detail', id] as const,
  },
  tracks: {
    all: ['tracks'] as const,
    lists: () => [...queryKeys.tracks.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.tracks.lists(), params(query)] as const,
  },
  rubrics: {
    all: ['rubrics'] as const,
    lists: () => [...queryKeys.rubrics.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.rubrics.lists(), params(query)] as const,
    detail: (id?: string) => [...queryKeys.rubrics.all, 'detail', id] as const,
  },
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.teams.lists(), params(query)] as const,
    my: (eventId?: string) => [...queryKeys.teams.all, 'my', eventId] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.users.lists(), params(query)] as const,
  },
  participants: {
    all: ['participants'] as const,
    lists: () => [...queryKeys.participants.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.participants.lists(), params(query)] as const,
  },
  timelines: {
    all: ['timelines'] as const,
    lists: () => [...queryKeys.timelines.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.timelines.lists(), params(query)] as const,
  },
  workshops: {
    all: ['workshops'] as const,
    lists: () => [...queryKeys.workshops.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.workshops.lists(), params(query)] as const,
  },
  submissions: {
    all: ['submissions'] as const,
    lists: () => [...queryKeys.submissions.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.submissions.lists(), params(query)] as const,
  },
  media: {
    all: ['media'] as const,
    history: (query?: QueryParams) => [...queryKeys.media.all, 'history', params(query)] as const,
    gallery: (eventId?: string, query?: QueryParams) => [...queryKeys.media.all, 'gallery', eventId, params(query)] as const,
    admin: (query?: QueryParams) => [...queryKeys.media.all, 'admin', params(query)] as const,
    statistics: (query?: QueryParams) => [...queryKeys.media.all, 'statistics', params(query)] as const,
  },
  repositories: {
    all: ['repositories'] as const,
    lists: () => [...queryKeys.repositories.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.repositories.lists(), params(query)] as const,
    detail: (id?: string) => [...queryKeys.repositories.all, 'detail', id] as const,
    commits: (id?: string) => [...queryKeys.repositories.all, 'commits', id] as const,
    diffs: (id?: string) => [...queryKeys.repositories.all, 'diffs', id] as const,
    analysis: (id?: string) => [...queryKeys.repositories.all, 'analysis', id] as const,
    impact: (id?: string) => [...queryKeys.repositories.all, 'impact', id] as const,
    aiReviews: (id?: string) => [...queryKeys.repositories.all, 'ai-reviews', id] as const,
  },
  github: {
    all: ['github'] as const,
    config: (eventId?: string) => [...queryKeys.github.all, 'config', eventId] as const,
  },
  judging: {
    all: ['judging'] as const,
    boards: (roundId?: string) => [...queryKeys.judging.all, 'boards', roundId] as const,
    boardSheets: (roundId?: string, boardId?: string) =>
      [...queryKeys.judging.all, 'board-sheets', roundId, boardId] as const,
  },
  operations: {
    all: ['operations'] as const,
    dashboard: (eventId?: string) => [...queryKeys.operations.all, 'dashboard', eventId] as const,
    pipeline: (eventId?: string) => [...queryKeys.operations.all, 'pipeline', eventId] as const,
  },
  rankings: {
    all: ['rankings'] as const,
    list: (eventId?: string, roundId?: string) => [...queryKeys.rankings.all, eventId, roundId] as const,
  },
  finalists: {
    all: ['finalists'] as const,
    list: (eventId?: string, roundId?: string) => [...queryKeys.finalists.all, eventId, roundId] as const,
  },
  scoreSheets: {
    all: ['score-sheets'] as const,
    lists: () => [...queryKeys.scoreSheets.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.scoreSheets.lists(), params(query)] as const,
  },
  auditLogs: {
    all: ['audit-logs'] as const,
    list: (query?: QueryParams) => [...queryKeys.auditLogs.all, 'list', params(query)] as const,
    summary: (query?: QueryParams) => [...queryKeys.auditLogs.all, 'summary', params(query)] as const,
  },
} as const;
