import type { ReactNode } from 'react';
import { Github, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import type { Team } from '@/shared/api/types';

interface TeamCardProps {
  team: Team;
  isSpeaker: boolean;
  footer?: ReactNode;
}

function initials(value?: string) {
  if (!value) return 'TM';
  return value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function getConfirmedMemberCount(team: Team) {
  const activeParticipants = team.participants
    ? team.participants.filter((participant) => participant.status === 'ACTIVE')
    : [];
  return activeParticipants.length || (team.members?.length || 0);
}

export function TeamCard({ team, isSpeaker, footer }: TeamCardProps) {
  const confirmedCount = getConfirmedMemberCount(team);

  return (
    <Card className="relative flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="line-clamp-2">{team.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {team.track?.name || team.event?.title}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={team.status === 'ACTIVE' || team.status === 'CONFIRMED' ? 'default' : 'secondary'}>
              {team.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-3">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
              {initials(team.leader?.fullName || team.leader?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {team.leader?.fullName || team.leader?.email || 'Unknown leader'}
            </p>
            <p className="text-xs text-muted-foreground">Team Leader</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4 shrink-0" />
          <span className="truncate">{confirmedCount} confirmed member(s)</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Github className="w-4 h-4 shrink-0" />
          <span className="truncate">{team.projectName || 'No project name yet'}</span>
        </div>
        {!isSpeaker && team.assignedMentors && team.assignedMentors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {team.assignedMentors.map((mentor) => (
              <Badge key={mentor.id} variant="outline" className="text-[10px] py-0 px-1.5">
                {mentor.fullName || mentor.email}
              </Badge>
            ))}
          </div>
        )}
        {footer ? <div className="mt-auto pt-4">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
