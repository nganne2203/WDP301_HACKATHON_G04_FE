import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { teamsApi } from '@/entities/team/api';
import { useStore } from '@/entities/session/model/store';
import { useEventsQuery, selectDefaultEvent } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';

export function useMentorTeamsView() {
  const appRole = useStore((state) => state.appRole);
  const isSpeaker = appRole === 'speaker';
  const selectedEvent = useStore((state) => state.selectedEvent);
  const setSelectedEvent = useStore((state) => state.setSelectedEvent);

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];

  // Auto-select first event if store is empty and events are loaded
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      const defaultEvent = selectDefaultEvent(events) || events[0];
      setSelectedEvent({
        id: defaultEvent.id,
        title: defaultEvent.title,
        semester: defaultEvent.semester,
        status: defaultEvent.status,
      });
    }
  }, [events, selectedEvent, setSelectedEvent]);

  const handleEventChange = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent({
        id: event.id,
        title: event.title,
        semester: event.semester,
        status: event.status,
      });
    }
  };

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams.list({ eventId: selectedEvent?.id, limit: 20 }),
    enabled: Boolean(selectedEvent?.id),
    queryFn: async () => (await teamsApi.list({ eventId: selectedEvent?.id, limit: 20 })).data,
  });
  const teams = teamsQuery.data || [];

  return {
    selectedEventId: selectedEvent?.id || '',
    setSelectedEventId: handleEventChange,
    appRole,
    isSpeaker,
    eventsQuery,
    events,
    selectedEvent,
    teamsQuery,
    teams,
  };
}
