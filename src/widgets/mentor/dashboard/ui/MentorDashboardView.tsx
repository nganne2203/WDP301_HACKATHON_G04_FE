import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Calendar, Github, Loader2, Presentation, UsersRound } from 'lucide-react';

import { teamsApi } from '@/entities/team/api';
import { useStore } from '@/entities/session/model/store';
import { useEventsQuery, useWorkshopsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

function formatDateTime(value?: string | null) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleString();
}

export function MentorDashboardView() {
  const user = useStore((state) => state.user);
  const appRole = useStore((state) => state.appRole);
  const [selectedEventId, setSelectedEventId] = useState('');

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];
  const selectedEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  const workshopsQuery = useWorkshopsQuery(
    { eventId: selectedEvent?.id, presenterId: user?.id, limit: 20 },
    { enabled: Boolean(selectedEvent?.id && user?.id) }
  );
  const workshops = workshopsQuery.data || [];

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams.list({ eventId: selectedEvent?.id, limit: 10 }),
    enabled: Boolean(selectedEvent?.id),
    queryFn: async () => (await teamsApi.list({ eventId: selectedEvent?.id, limit: 10 })).data,
  });
  const teams = teamsQuery.data || [];

  const activeWorkshops = workshops.filter((workshop) => workshop.status === 'LIVE' || workshop.status === 'SCHEDULED');
  const confirmedTeams = teams.filter((team) => team.status === 'CONFIRMED' || team.status === 'ACTIVE');
  const latestWorkshops = [...workshops]
    .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())
    .slice(0, 3);
  const isSpeaker = appRole === 'speaker';

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{isSpeaker ? 'Speaker Dashboard' : 'Mentor Dashboard'}</h1>
          <p className="text-sm text-muted-foreground">
            {isSpeaker
              ? 'Track your workshop schedule and event context.'
              : 'Track your mentoring sessions and get a quick event snapshot.'}
          </p>
        </div>
        <div className="w-full md:w-80">
          <Label>Event</Label>
          <Select value={selectedEvent?.id || ''} onValueChange={setSelectedEventId} disabled={eventsQuery.isLoading}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Presentation className="w-4 h-4" />
              {isSpeaker ? 'My Sessions' : 'My Workshops'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{workshops.length}</p>
            <p className="text-sm text-muted-foreground mt-1">{activeWorkshops.length} active or upcoming</p>
          </CardContent>
        </Card>
        {!isSpeaker && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UsersRound className="w-4 h-4" />
              Assigned Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{confirmedTeams.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Confirmed or active teams in your mentoring scope</p>
          </CardContent>
        </Card>
        )}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Event Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{selectedEvent?.status || '—'}</p>
            <p className="text-sm text-muted-foreground mt-1">{selectedEvent?.title || 'No event selected'}</p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertTitle>{isSpeaker ? 'Speaker scope' : 'Mentor assignment scope'}</AlertTitle>
        <AlertDescription>
          {isSpeaker
            ? 'This dashboard focuses on workshops where you are the presenter. Team assignment is not part of the speaker role in the current API surface.'
            : 'This dashboard shows your workshops and the teams seeded into your mentoring scope for the selected event.'}
        </AlertDescription>
      </Alert>

      <div className={`grid grid-cols-1 gap-6 ${isSpeaker ? 'lg:grid-cols-1' : 'lg:grid-cols-[1.2fr_0.8fr]'}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Upcoming Sessions</CardTitle>
            {!isSpeaker && <Button asChild variant="outline" size="sm">
              <Link to="/mentor/teams">Open Team View</Link>
            </Button>}
          </CardHeader>
          <CardContent className="space-y-3">
            {workshopsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading workshops...
              </div>
            ) : latestWorkshops.length === 0 ? (
              <Alert>
                <AlertTitle>{isSpeaker ? 'No speaking sessions' : 'No mentoring workshops'}</AlertTitle>
                <AlertDescription>
                  {isSpeaker
                    ? 'No workshops are assigned to you as presenter for the selected event.'
                    : 'No workshops are assigned to you for the selected event.'}
                </AlertDescription>
              </Alert>
            ) : (
              latestWorkshops.map((workshop) => (
                <div key={workshop.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{workshop.title}</p>
                      <p className="text-sm text-muted-foreground">{workshop.event?.title || selectedEvent?.title}</p>
                    </div>
                    <Badge variant="outline">{workshop.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">{formatDateTime(workshop.startTime)}</p>
                  {workshop.meetLink && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-700">
                      <Github className="w-4 h-4" />
                      <a href={workshop.meetLink} target="_blank" rel="noreferrer" className="underline">
                        {isSpeaker ? 'Open session link' : 'Open mentoring link'}
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {!isSpeaker && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full" variant="outline">
              <Link to="/mentor/teams">Browse Event Teams</Link>
            </Button>
            {selectedEvent?.id && (
              <Button asChild className="w-full" variant="outline">
                <Link to={`/events/${selectedEvent.id}/gallery`}>Open Event Gallery</Link>
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Team mentoring assignment, direct mentor notes, and team-specific repository review are not wired yet in the current API surface.
            </p>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
