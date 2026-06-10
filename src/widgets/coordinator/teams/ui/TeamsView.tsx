import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Loader2, Mail, Users } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { eventsApi } from '@/entities/event/api';
import { teamsApi } from '@/entities/team/api';
import type { Team } from '@/shared/api/types';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

function getInitials(value?: string) {
  return (value || '?')
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function statusBadgeVariant(status: string): BadgeVariant {
  if (status === 'CONFIRMED' || status === 'ACTIVE') return 'default';
  if (status === 'REJECTED' || status === 'DISQUALIFIED') return 'destructive';
  return 'secondary';
}

function TeamDetail({ team }: { team: Team }) {
  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 border rounded-md">
          <p className="text-xs text-muted-foreground">Confirmed members</p>
          <p className="text-lg font-semibold">{team.members.length}</p>
        </div>
        <div className="p-3 border rounded-md">
          <p className="text-xs text-muted-foreground">Pending invites</p>
          <p className="text-lg font-semibold">
            {team.invitations.filter((invitation) => invitation.status === 'PENDING').length}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Members</h3>
        <div className="space-y-2">
          {team.participants.map((participant) => (
            <div key={participant.id} className="flex items-center gap-3 p-3 border rounded-md">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                  {getInitials(participant.user?.fullName || participant.user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{participant.user?.fullName || participant.user?.email}</p>
                <p className="text-xs text-muted-foreground truncate">{participant.user?.email}</p>
              </div>
              {participant.teamRole === 'LEADER' && <Crown className="w-4 h-4 text-yellow-500" />}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Invitations</h3>
        <div className="space-y-2">
          {team.invitations.length === 0 && (
            <p className="text-sm text-muted-foreground">No invitations recorded.</p>
          )}
          {team.invitations.map((invitation) => (
            <div key={invitation.id} className="flex items-center justify-between gap-3 p-3 border rounded-md">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{invitation.invitedEmail}</p>
                <p className="text-xs text-muted-foreground">Expires {new Date(invitation.expiresAt).toLocaleString()}</p>
              </div>
              <Badge variant={statusBadgeVariant(invitation.status)}>{invitation.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Teams() {
  const [selectedEventId, setSelectedEventId] = useState('');

  const eventsQuery = useQuery({
    queryKey: ['coordinator-team-events'],
    queryFn: async () => {
      const response = await eventsApi.list({ page: 1, limit: 100 });
      return response.data;
    },
  });

  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  const teamsQuery = useQuery({
    queryKey: ['coordinator-teams', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => {
      const response = await teamsApi.list({ eventId: activeEvent?.id, page: 1, limit: 100 });
      return response.data;
    },
  });

  const teams = teamsQuery.data || [];
  const confirmedTeams = teams.filter((team) => team.status === 'CONFIRMED' || team.status === 'ACTIVE').length;
  const maxTeams = activeEvent?.maxTeams || 30;
  const capacityPercent = maxTeams > 0 ? Math.min(Math.round((confirmedTeams / maxTeams) * 100), 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Team Management</h1>
          <p className="text-sm text-muted-foreground">Monitor team confirmation, members, and invitations</p>
        </div>
        <div className="w-full md:w-80">
          <Select value={activeEvent?.id || ''} onValueChange={setSelectedEventId} disabled={eventsQuery.isLoading}>
            <SelectTrigger>
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

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Confirmed Team Capacity</span>
            <span className="text-sm text-muted-foreground">{confirmedTeams} / {maxTeams} teams</span>
          </div>
          <Progress value={capacityPercent} />
        </CardContent>
      </Card>

      {teamsQuery.isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading teams</AlertTitle>
          <AlertDescription>Reading team registrations for the selected event.</AlertDescription>
        </Alert>
      )}

      {!teamsQuery.isLoading && teams.length === 0 && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>No teams yet</AlertTitle>
          <AlertDescription>No team registration has been created for this event.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Sheet key={team.id}>
            <SheetTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-lg truncate">{team.name}</CardTitle>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {team.projectName || team.event?.title}
                      </p>
                    </div>
                    <Badge variant={statusBadgeVariant(team.status)}>{team.status.replaceAll('_', ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{team.members.length} confirmed member(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{team.invitations.filter((invitation) => invitation.status === 'PENDING').length} pending invite(s)</span>
                  </div>
                  <div className="pt-2">
                    <Progress value={Math.min((team.members.length / (team.event?.minTeamMembers || 3)) * 100, 100)} />
                  </div>
                </CardContent>
              </Card>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{team.name}</SheetTitle>
              </SheetHeader>
              <TeamDetail team={team} />
            </SheetContent>
          </Sheet>
        ))}
      </div>
    </div>
  );
}
