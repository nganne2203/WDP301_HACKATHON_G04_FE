import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { teamsApi } from '@/entities/team/api';
import { useStore } from '@/entities/session/model/store';
import { useEventsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';

export function useMentorTeamsView() {
  const [selectedEventId, setSelectedEventId] = useState('');
  const appRole = useStore((state) => state.appRole);
  const isSpeaker = appRole === 'speaker';

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];
  const selectedEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams.list({ eventId: selectedEvent?.id, limit: 20 }),
    enabled: Boolean(selectedEvent?.id),
    queryFn: async () => (await teamsApi.list({ eventId: selectedEvent?.id, limit: 20 })).data,
  });
  const teams = teamsQuery.data || [];

  return {
    selectedEventId,
    setSelectedEventId,
    appRole,
    isSpeaker,
    eventsQuery,
    events,
    selectedEvent,
    teamsQuery,
    teams,
  };
}
