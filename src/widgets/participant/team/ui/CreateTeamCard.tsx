import { Loader2, Plus } from 'lucide-react';

import { MemberInviteFields } from '@/features/team/member-invites/ui/MemberInviteFields';
import type { MemberInviteRow } from '@/features/team/member-invites/model/helpers';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface CreateTeamCardProps {
  createPending: boolean;
  invitedMembers: MemberInviteRow[];
  onCreateTeam: () => void;
  projectName: string;
  registrationOpen: boolean;
  setInvitedMembers: React.Dispatch<React.SetStateAction<MemberInviteRow[]>>;
  setProjectName: (value: string) => void;
  setTeamName: (value: string) => void;
  teamName: string;
}

export function CreateTeamCard({
  createPending,
  invitedMembers,
  onCreateTeam,
  projectName,
  registrationOpen,
  setInvitedMembers,
  setProjectName,
  setTeamName,
  teamName,
}: CreateTeamCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create team</CardTitle>
        <CardDescription>
          You will become the team leader. Invited members receive secure confirmation links by email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Enter team name"
              disabled={!registrationOpen}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectName">Project name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Optional"
              disabled={!registrationOpen}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Team members</Label>
          <MemberInviteFields rows={invitedMembers} setRows={setInvitedMembers} disabled={!registrationOpen} />
        </div>

        <Button onClick={onCreateTeam} disabled={!registrationOpen || createPending}>
          {createPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Create team and send invites
        </Button>
      </CardContent>
    </Card>
  );
}
