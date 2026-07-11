import { Loader2, Mail, RefreshCw } from 'lucide-react';

import { MemberInviteFields } from '@/features/team/member-invites/ui/MemberInviteFields';
import { statusBadgeVariant, type MemberInviteRow } from '@/features/team/member-invites/model/helpers';
import type { Team, TeamInvitation } from '@/shared/api/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

interface TeamInvitationsCardProps {
  canChangeInvitations: boolean;
  cancelPending: boolean;
  invitePending: boolean;
  newInvitedMembers: MemberInviteRow[];
  onCancelInvitation: (invitationId: string) => void;
  onInviteMembers: () => void;
  onReplaceInvitation: (invitation: TeamInvitation) => void;
  replacementEmails: Record<string, string>;
  replacePending: boolean;
  setNewInvitedMembers: React.Dispatch<React.SetStateAction<MemberInviteRow[]>>;
  setReplacementEmail: (invitationId: string, value: string) => void;
  team: Team;
}

export function TeamInvitationsCard({
  canChangeInvitations,
  cancelPending,
  invitePending,
  newInvitedMembers,
  onCancelInvitation,
  onInviteMembers,
  onReplaceInvitation,
  replacementEmails,
  replacePending,
  setNewInvitedMembers,
  setReplacementEmail,
  team,
}: TeamInvitationsCardProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invitations</CardTitle>
          <CardDescription>Pending, accepted, declined, expired, and cancelled member invites.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {team.invitations.length === 0 && (
            <p className="text-sm text-muted-foreground">No invitations have been sent yet.</p>
          )}

          {team.invitations.map((invitation) => (
            <div key={invitation.id} className="space-y-3 rounded-md border p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium">{invitation.invitedEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(invitation.expiresAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant={statusBadgeVariant(invitation.status)}>{invitation.status}</Badge>
              </div>

              {canChangeInvitations && invitation.status === 'PENDING' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancelInvitation(invitation.id)}
                  disabled={cancelPending}
                >
                  Cancel invite
                </Button>
              )}

              {canChangeInvitations && invitation.status === 'DECLINED' && (
                <div className="flex flex-col gap-2 md:flex-row">
                  <Input
                    type="email"
                    placeholder="replacement@example.com"
                    value={replacementEmails[invitation.id] || ''}
                    onChange={(event) => setReplacementEmail(invitation.id, event.target.value)}
                  />
                  <Button onClick={() => onReplaceInvitation(invitation)} disabled={replacePending}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Replace
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {canChangeInvitations && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send more invitations</CardTitle>
            <CardDescription>New members must accept by email before they join the team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <MemberInviteFields
              activeEventId={team.eventId}
              rows={newInvitedMembers}
              setRows={setNewInvitedMembers}
            />
            <Button onClick={onInviteMembers} disabled={invitePending}>
              {invitePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send invitations
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
