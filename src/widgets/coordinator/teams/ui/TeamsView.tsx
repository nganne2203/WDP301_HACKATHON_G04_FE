import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Mail, UserRound, Users } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { ListPagination } from '@/shared/ui/list-pagination';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { TeamDetail, teamsApi } from '@/entities/team';
import { useStore } from '@/entities/session/model/store';
import { useCompetitionsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { Team } from '@/shared/api/types';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

function statusBadgeVariant(status: string): BadgeVariant {
  if (status === 'CONFIRMED') return 'default';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'destructive';
  return 'secondary';
}

function getConfirmedMemberCount(team: Team) {
  const activeParticipants = team.participants
    ? team.participants.filter((participant) => participant.status === 'JOINED')
    : [];
  return activeParticipants.length || (team.members?.length || 0);
}

function getTotalMemberCount(team: Team) {
  const participantEmails = new Set(
    (team.participants || [])
      .map((participant) => participant.user?.email?.trim().toLowerCase())
      .filter(Boolean)
  );
  const participantIds = new Set(
    (team.participants || [])
      .map((participant) => participant.user?.id)
      .filter(Boolean)
  );

  let total = (team.participants || []).length;

  for (const invitation of team.invitations || []) {
    const invitedEmail = invitation.invitedEmail?.trim().toLowerCase();
    const invitedUserId = invitation.invitedUserId;
    const invitedUserEmail = invitation.invitedUser?.email?.trim().toLowerCase();

    const matchesParticipant =
      (invitedUserId && participantIds.has(invitedUserId)) ||
      (invitedUserEmail && participantEmails.has(invitedUserEmail)) ||
      (invitedEmail && participantEmails.has(invitedEmail));

    if (!matchesParticipant) {
      total += 1;
    }
  }

  return total || (team.members?.length || 0);
}

export function Teams() {
  const selectedCompetition = useStore((state) => state.selectedCompetition);
  const [page, setPage] = useState(1);

  const eventsQuery = useCompetitionsQuery();

  const competitions = eventsQuery.data || [];
  const activeCompetition = useMemo(() => {
    if (!competitions.length) return null;
    return competitions.find((competition) => competition.id === selectedCompetition?.id) || competitions[0];
  }, [competitions, selectedCompetition?.id]);

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams.list({ competitionId: activeCompetition?.id, page, limit: 12 }),
    enabled: Boolean(activeCompetition?.id),
    queryFn: () => teamsApi.list({ competitionId: activeCompetition?.id, page, limit: 12 }),
  });

  const confirmedTeamsQuery = useQuery({
    queryKey: queryKeys.teams.list({ competitionId: activeCompetition?.id, status: 'CONFIRMED', page: 1, limit: 1 }),
    enabled: Boolean(activeCompetition?.id),
    queryFn: () => teamsApi.list({ competitionId: activeCompetition?.id, status: 'CONFIRMED', page: 1, limit: 1 }),
  });

  const teams = teamsQuery.data?.data || [];
  const pagination = teamsQuery.data?.pagination;
  const confirmedTeams = confirmedTeamsQuery.data?.pagination?.totalItems || 0;
  const maxTeams = activeCompetition?.maxTeams || 30;
  const capacityPercent = maxTeams > 0 ? Math.min(Math.round((confirmedTeams / maxTeams) * 100), 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-semibold mb-1">Team Management</h1>
          <p className="text-sm text-muted-foreground">Monitor team confirmation, members, and invitations</p>
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
          <AlertDescription>Loading team registrations for this competition.</AlertDescription>
        </Alert>
      )}

      {!teamsQuery.isLoading && teams.length === 0 && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>No teams yet</AlertTitle>
          <AlertDescription>No team registration has been created for this competition.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {teams.map((team) => (
          <Sheet key={team.id}>
            <SheetTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="space-y-3">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg break-words">{team.name}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground break-words">
                        {team.competition?.title}
                      </p>
                    </div>
                    <Badge className="w-fit shrink-0 self-start" variant={statusBadgeVariant(team.status)}>
                      {team.status.replaceAll('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{getConfirmedMemberCount(team)} confirmed of {getTotalMemberCount(team)} member(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{team.invitations.filter((invitation) => invitation.status === 'PENDING').length} pending invite(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <UserRound className="w-4 h-4 text-muted-foreground" />
                    <span>{team.assignedMentors?.length || 0} mentor(s) assigned</span>
                  </div>
                  <div className="pt-2">
                    <Progress value={Math.min((getConfirmedMemberCount(team) / (team.competition?.minTeamMembers || 3)) * 100, 100)} />
                  </div>
                </CardContent>
              </Card>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto px-6 sm:max-w-xl">
              <SheetHeader className="pr-8">
                <SheetTitle>{team.name}</SheetTitle>
                <SheetDescription>
                  Review confirmed members, pending invitations, and team capacity for this team.
                </SheetDescription>
              </SheetHeader>
              <TeamDetail team={team} />
            </SheetContent>
          </Sheet>
        ))}
      </div>
      <ListPagination page={page} pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
