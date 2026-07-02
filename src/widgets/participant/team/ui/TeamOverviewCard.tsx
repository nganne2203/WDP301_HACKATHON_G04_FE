import { Clock, Mail, Users } from 'lucide-react';

import { getInitials, statusBadgeVariant } from '@/features/team/member-invites/model/helpers';
import type { Team } from '@/shared/api/types';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface TeamOverviewCardProps {
  eventTitle?: string;
  minTeamMembers?: number;
  team: Team;
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

export function TeamOverviewCard({ eventTitle, minTeamMembers, team }: TeamOverviewCardProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{team.name}</CardTitle>
              <CardDescription>{team.projectName || eventTitle}</CardDescription>
            </div>
            <Badge variant={statusBadgeVariant(team.status)}>{team.status.replaceAll('_', ' ')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{getConfirmedMemberCount(team)} confirmed of {getTotalMemberCount(team)} member(s)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{team.invitations.filter((invitation) => invitation.status === 'PENDING').length} pending invite(s)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Required: {team.event?.minTeamMembers || minTeamMembers || 3} members</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Confirmed members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {team.participants.map((participant) => (
            <div key={participant.id} className="flex items-center gap-3 rounded-md border p-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-blue-100 text-sm text-blue-700">
                  {getInitials(participant.user?.fullName || participant.user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{participant.user?.fullName || participant.user?.email}</p>
                <p className="truncate text-xs text-muted-foreground">{participant.user?.email}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {participant.teamRole}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
