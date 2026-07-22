import { Clock, LogOut, Mail, Trash2, Users } from 'lucide-react';

import { getInitials, statusBadgeVariant } from '@/features/team/member-invites/model/helpers';
import type { Team } from '@/shared/api/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface TeamOverviewCardProps {
  canLeaveTeam?: boolean;
  eventTitle?: string;
  isLeader?: boolean;
  leavePending?: boolean;
  minTeamMembers?: number;
  onLeaveTeam?: () => void;
  team: Team;
}

function getConfirmedMemberCount(team: Team) {
  const activeParticipants = team.participants
    ? team.participants.filter((participant) => participant.status === 'JOINED')
    : [];
  return activeParticipants.length || (team.members?.length || 0);
}

function getTotalMemberCount(team: Team) {
  const joinedCount = getConfirmedMemberCount(team);
  const pendingInviteCount = (team.invitations || []).filter((invitation) => invitation.status === 'PENDING').length;
  return joinedCount + pendingInviteCount;
}

export function TeamOverviewCard({
  canLeaveTeam = false,
  eventTitle,
  isLeader = false,
  leavePending = false,
  minTeamMembers,
  onLeaveTeam,
  team,
}: TeamOverviewCardProps) {
  const leaveLabel = isLeader ? 'Cancel team' : 'Leave team';
  const LeaveIcon = isLeader ? Trash2 : LogOut;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{team.name}</CardTitle>
              <CardDescription>{eventTitle}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusBadgeVariant(team.status)}>{team.status.replaceAll('_', ' ')}</Badge>
              {canLeaveTeam && onLeaveTeam && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={leavePending}>
                      <LeaveIcon className="mr-2 h-4 w-4" />
                      {leaveLabel}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{isLeader ? 'Cancel team?' : 'Leave team?'}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {isLeader
                          ? 'This cancels the current team, withdraws all active members, cancels pending invitations, and releases any occupied slot. This can only be done while registration is open.'
                          : 'You will be withdrawn from this team. If the team falls below the minimum member count, it will return to waiting for member confirmations and release its slot.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={onLeaveTeam}
                      >
                        {leaveLabel}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
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
            <span>Required: {team.competition?.minTeamMembers || minTeamMembers || 3} members</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Confirmed members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {team.participants.filter((participant) => participant.status === 'JOINED' && participant.user).map((participant) => (
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
