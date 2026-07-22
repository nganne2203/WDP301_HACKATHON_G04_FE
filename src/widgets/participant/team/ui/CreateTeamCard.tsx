import { Loader2 } from 'lucide-react';

import { MemberInviteFields } from '@/features/team/member-invites/ui/MemberInviteFields';
import type { MemberInviteRow } from '@/features/team/member-invites/model/helpers';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface CreateTeamCardProps {
  activeCompetitionId: string;
  createPending: boolean;
  invitedMembers: MemberInviteRow[];
  onCreateTeam: () => void;
  registrationOpen: boolean;
  setInvitedMembers: React.Dispatch<React.SetStateAction<MemberInviteRow[]>>;
  setTeamName: (value: string) => void;
  teamNameChecking: boolean;
  teamNameValidationMessage: string;
  teamName: string;
}

export function CreateTeamCard({
  activeCompetitionId,
  createPending,
  invitedMembers,
  onCreateTeam,
  registrationOpen,
  setInvitedMembers,
  setTeamName,
  teamNameChecking,
  teamNameValidationMessage,
  teamName,
}: CreateTeamCardProps) {
  const hasTeamNameError = Boolean(teamNameValidationMessage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create team</CardTitle>
        <CardDescription>
          You will become the team leader. Invited members receive secure confirmation links by email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="teamName">Team name</Label>
          <Input
            id="teamName"
            value={teamName}
            onChange={(competition) => setTeamName(competition.target.value)}
            placeholder="Enter team name"
            disabled={!registrationOpen}
            aria-invalid={hasTeamNameError}
            aria-describedby={hasTeamNameError ? 'teamName-error' : undefined}
          />
          {teamNameChecking && !hasTeamNameError && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Checking team name...
            </p>
          )}
          {hasTeamNameError && (
            <p id="teamName-error" className="text-xs text-destructive">
              {teamNameValidationMessage}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Team members</Label>
          <MemberInviteFields
            activeCompetitionId={activeCompetitionId}
            rows={invitedMembers}
            setRows={setInvitedMembers}
            disabled={!registrationOpen}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={onCreateTeam} disabled={!registrationOpen || createPending || teamNameChecking || hasTeamNameError}>
            {createPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create team and send invites
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
