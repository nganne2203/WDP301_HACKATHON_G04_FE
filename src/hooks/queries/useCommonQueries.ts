import { useQuery } from '@tanstack/react-query';

import { eventsApi } from '@/entities/event/api';
import { roundsApi } from '@/entities/round/api';
import { rubricsApi } from '@/entities/rubric/api';
import { teamsApi } from '@/entities/team/api';
import { timelinesApi } from '@/entities/timeline/api';
import { tracksApi } from '@/entities/track/api';
import { usersApi } from '@/entities/user/api';
import { workshopsApi } from '@/entities/workshop/api';
import { ApiError } from '@/shared/api/client';
import type {
  ListEventsQuery,
  ListRoundsQuery,
  ListRubricsQuery,
  ListTeamsQuery,
  ListTimelinesQuery,
  ListTracksQuery,
  ListUsersQuery,
} from '@/shared/api/types';
import type { ListWorkshopsQuery } from '@/shared/api/workshops';
import { queryKeys } from '@/lib/queryKeys';

type QueryOptions = {
  enabled?: boolean;
  retry?: boolean | number;
  staleTime?: number;
};

export function useEventsQuery(query: ListEventsQuery = { page: 1, limit: 10 }, options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.events.list(query),
    queryFn: async () => (await eventsApi.list(query)).data,
    ...options,
  });
}

export function useRoundsQuery(query: ListRoundsQuery, options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.rounds.list(query),
    queryFn: async () => (await roundsApi.list(query)).data,
    ...options,
  });
}

export function useTracksQuery(query: ListTracksQuery, options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.tracks.list(query),
    queryFn: async () => (await tracksApi.list(query)).data,
    ...options,
  });
}

export function useRubricsQuery(query: ListRubricsQuery, options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.rubrics.list(query),
    queryFn: async () => (await rubricsApi.list(query)).data,
    ...options,
  });
}

export function useTeamsQuery(query: ListTeamsQuery, options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.teams.list(query),
    queryFn: async () => (await teamsApi.list(query)).data,
    ...options,
  });
}

export function useMyTeamQuery(eventId: string | undefined, options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.teams.my(eventId),
    enabled: Boolean(eventId) && (options?.enabled ?? true),
    retry: false,
    queryFn: async () => {
      try {
        return (await teamsApi.getMyTeam(eventId!)).data;
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404) return null;
        throw error;
      }
    },
    ...options,
  });
}

export function useUsersQuery(query: ListUsersQuery = { page: 1, limit: 10 }, options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.users.list(query),
    queryFn: () => usersApi.list(query),
    ...options,
  });
}

export function useTimelinesQuery(query: ListTimelinesQuery, options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.timelines.list(query),
    queryFn: async () => (await timelinesApi.list(query)).data,
    ...options,
  });
}

export function useWorkshopsQuery(query: ListWorkshopsQuery, options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.workshops.list(query),
    queryFn: async () => (await workshopsApi.list(query)).data,
    ...options,
  });
}

export function selectDefaultEvent<T extends { status?: string | null }>(events: T[] | undefined): T | null {
  if (!events || !events.length) return null;
  const ongoing = events.find((e) => e.status?.toUpperCase() === 'ONGOING');
  if (ongoing) return ongoing;
  const upcoming = events.find((e) => e.status?.toUpperCase() === 'UPCOMING');
  if (upcoming) return upcoming;
  return events[0];
}
