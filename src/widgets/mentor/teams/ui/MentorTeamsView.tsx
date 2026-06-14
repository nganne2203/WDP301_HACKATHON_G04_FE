import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Github, Loader2, Users, UsersRound } from 'lucide-react';

import { teamsApi } from '@/entities/team/api';
import { useEventsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

function initials(value?: string) {
  if (!value) return 'TM';
  return value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export function MentorTeams() {
  const [selectedEventId, setSelectedEventId] = useState('');

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

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Teams Overview</h1>
          <p className="text-sm text-muted-foreground">Event teams visible to mentors in the current frontend scope.</p>
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

      <Alert>
        <UsersRound className="h-4 w-4" />
        <AlertTitle>Current limitation</AlertTitle>
        <AlertDescription>
          This page currently shows event teams, not mentor-specific assignments, because the backend does not yet expose mentor-to-team mapping.
        </AlertDescription>
      </Alert>

      {teamsQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading teams</AlertTitle>
          <AlertDescription>Reading teams for the selected event.</AlertDescription>
        </Alert>
      ) : teams.length === 0 ? (
        <Alert>
          <AlertTitle>No teams found</AlertTitle>
          <AlertDescription>No teams are available for the selected event yet.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{team.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{team.track?.name || team.event?.title}</p>
                  </div>
                  <Badge variant={team.status === 'ACTIVE' || team.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                    {team.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                      {initials(team.leader?.fullName || team.leader?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{team.leader?.fullName || team.leader?.email || 'Unknown leader'}</p>
                    <p className="text-xs text-muted-foreground">Team Leader</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{team.members.length} confirmed member(s)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Github className="w-4 h-4" />
                  <span>{team.projectName || 'No project name yet'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
