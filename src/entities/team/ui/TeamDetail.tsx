import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Crown } from 'lucide-react';
import type { Team } from '@/shared/api/types';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

function getInitials(value?: string) {
  if (!value) return 'TM';
  return value
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

function getConfirmedMemberCount(team: Team) {
  const activeParticipants = team.participants
    ? team.participants.filter((participant) => participant.status === 'ACTIVE')
    : [];
  return activeParticipants.length || (team.members?.length || 0);
}

function getTotalMemberCount(team: Team) {
  return (team.participants?.length) || (team.members?.length || 0);
}

interface TeamDetailProps {
  team: Team;
}

export function TeamDetail({ team }: TeamDetailProps) {
  const confirmedMemberCount = getConfirmedMemberCount(team);
  const totalMemberCount = getTotalMemberCount(team);
  const invitations = team.invitations || [];
  const participants = team.participants || [];

  return (
    <div className="mt-6 space-y-6 px-1 pb-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border p-4">
          <p className="text-xs text-muted-foreground">Confirmed members</p>
          <p className="text-lg font-semibold">{confirmedMemberCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">{totalMemberCount} total member(s)</p>
        </div>
        <div className="rounded-md border p-4">
          <p className="text-xs text-muted-foreground">Pending invites</p>
          <p className="text-lg font-semibold">
            {invitations.filter((invitation) => invitation.status === 'PENDING').length}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Members</h3>
        <div className="space-y-2">
          {participants.length === 0 && (
            <p className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">No members found.</p>
          )}
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center gap-3 rounded-md border px-4 py-3">
              <div className="relative">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                    {getInitials(participant.user?.fullName || participant.user?.email)}
                  </AvatarFallback>
                </Avatar>
                {participant.teamRole === 'LEADER' && (
                  <Crown className="w-4 h-4 text-yellow-500 fill-yellow-400 absolute -top-2 -left-1.5 transform -rotate-12 drop-shadow-sm z-10" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{participant.user?.fullName || participant.user?.email}</p>
                <p className="text-xs text-muted-foreground truncate">{participant.user?.email}</p>
              </div>
              <Badge variant={statusBadgeVariant(participant.status)}>{participant.status}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Invitations</h3>
        <div className="space-y-2">
          {invitations.length === 0 && (
            <p className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">No invitations recorded.</p>
          )}
          {invitations.map((invitation) => (
            <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-md border px-4 py-3">
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
