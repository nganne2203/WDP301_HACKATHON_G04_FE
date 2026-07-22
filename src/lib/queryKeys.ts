type QueryParams = object | undefined;

const params = <T extends QueryParams>(value: T) => value ?? {};

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  competitions: {
    all: ['competitions'] as const,
    lists: () => [...queryKeys.competitions.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.competitions.lists(), params(query)] as const,
    detail: (id?: string) => [...queryKeys.competitions.all, 'detail', id] as const,
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
    availability: (competitionId?: string, name?: string) =>
      [...queryKeys.teams.all, 'availability', competitionId, name] as const,
    inviteEligibility: (competitionId?: string, email?: string, githubUsername?: string) =>
      [...queryKeys.teams.all, 'invite-eligibility', competitionId, email, githubUsername] as const,
    my: (competitionId?: string) => [...queryKeys.teams.all, 'my', competitionId] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.users.lists(), params(query)] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.notifications.lists(), params(query)] as const,
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
    questions: (id?: string, query?: QueryParams) =>
      [...queryKeys.workshops.all, 'questions', id, params(query)] as const,
    ratings: (id?: string, query?: QueryParams) =>
      [...queryKeys.workshops.all, 'ratings', id, params(query)] as const,
    feedback: (id?: string, query?: QueryParams) =>
      [...queryKeys.workshops.all, 'feedback', id, params(query)] as const,
  },
  submissions: {
    all: ['submissions'] as const,
    lists: () => [...queryKeys.submissions.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.submissions.lists(), params(query)] as const,
  },
  media: {
    all: ['media'] as const,
    history: (query?: QueryParams) => [...queryKeys.media.all, 'history', params(query)] as const,
    gallery: (competitionId?: string, query?: QueryParams) => [...queryKeys.media.all, 'gallery', competitionId, params(query)] as const,
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
    config: (competitionId?: string) => [...queryKeys.github.all, 'config', competitionId] as const,
    user: (username?: string) => [...queryKeys.github.all, 'user', username] as const,
    userSearch: (query?: string) => [...queryKeys.github.all, 'user-search', query] as const,
    usernameAvailability: (username?: string, excludeSelf?: boolean) =>
      [...queryKeys.github.all, 'username-availability', username, excludeSelf] as const,
  },
  judging: {
    all: ['judging'] as const,
    boards: (roundId?: string) => [...queryKeys.judging.all, 'boards', roundId] as const,
    boardSheets: (roundId?: string, boardId?: string) =>
      [...queryKeys.judging.all, 'board-sheets', roundId, boardId] as const,
  },
  operations: {
    all: ['operations'] as const,
    dashboard: (competitionId?: string) => [...queryKeys.operations.all, 'dashboard', competitionId] as const,
    pipeline: (competitionId?: string) => [...queryKeys.operations.all, 'pipeline', competitionId] as const,
  },
  roles: {
    all: ['roles'] as const,
    lists: () => [...queryKeys.roles.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.roles.lists(), params(query)] as const,
    detail: (id?: string) => [...queryKeys.roles.all, 'detail', id] as const,
    permissions: (id?: string) => [...queryKeys.roles.all, 'permissions', id] as const,
  },
  permissions: {
    all: ['permissions'] as const,
    lists: () => [...queryKeys.permissions.all, 'list'] as const,
    list: (query?: QueryParams) => [...queryKeys.permissions.lists(), params(query)] as const,
    grouped: () => [...queryKeys.permissions.all, 'grouped'] as const,
  },
  rankings: {
    all: ['rankings'] as const,
    list: (competitionId?: string, roundId?: string) => [...queryKeys.rankings.all, competitionId, roundId] as const,
  },
  finalists: {
    all: ['finalists'] as const,
    list: (competitionId?: string, roundId?: string) => [...queryKeys.finalists.all, competitionId, roundId] as const,
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
