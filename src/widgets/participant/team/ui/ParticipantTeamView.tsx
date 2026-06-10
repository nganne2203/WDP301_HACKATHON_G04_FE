import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Loader2, Mail, Plus, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { ApiError } from '@/shared/api/client';
import { eventsApi } from '@/entities/event/api';
import { teamsApi } from '@/entities/team/api';
import type { TeamInvitation } from '@/shared/api/types';
import { useStore } from '@/entities/session/model/store';
import {
  createMemberRow,
  getApiErrorMessage,
  getInitials,
  isRegistrationOpen,
  normalizeMemberRows,
  statusBadgeVariant,
  type MemberInviteRow,
} from '@/features/team/member-invites/model/helpers';
import { MemberInviteFields } from '@/features/team/member-invites/ui/MemberInviteFields';
import { TeamStatusAlert } from '@/features/team/member-invites/ui/TeamStatusAlert';

export function ParticipantTeam() {
  const queryClient = useQueryClient();
  const { user } = useStore();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [invitedMembers, setInvitedMembers] = useState<MemberInviteRow[]>([createMemberRow()]);
  const [newInvitedMembers, setNewInvitedMembers] = useState<MemberInviteRow[]>([createMemberRow()]);
  const [replacementEmails, setReplacementEmails] = useState<Record<string, string>>({});

  const eventsQuery = useQuery({
    queryKey: ['participant-team-events'],
    queryFn: async () => {
      const response = await eventsApi.list({ page: 1, limit: 100 });
      return response.data;
    },
  });

  const events = eventsQuery.data || [];
  const selectedEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events.find(isRegistrationOpen) || events[0];
  }, [events, selectedEventId]);

  const activeEventId = selectedEvent?.id || '';

  const teamQuery = useQuery({
    queryKey: ['my-team', activeEventId],
    enabled: Boolean(activeEventId),
    retry: false,
    queryFn: async () => {
      try {
        const response = await teamsApi.getMyTeam(activeEventId);
        return response.data;
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404) return null;
        throw error;
      }
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      const members = normalizeMemberRows(invitedMembers, user?.email);
      const response = await teamsApi.create({
        eventId: activeEventId,
        name: teamName.trim(),
        projectName: projectName.trim(),
        invitedMembers: members,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Team created and invitations sent');
      setTeamName('');
      setProjectName('');
      setInvitedMembers([createMemberRow()]);
      await queryClient.invalidateQueries({ queryKey: ['my-team', activeEventId] });
    },
    onError: (error) => toast.error('Could not create team', { description: getApiErrorMessage(error) }),
  });

  const inviteMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const members = normalizeMemberRows(newInvitedMembers, user?.email);
      if (members.length === 0) throw new Error('Enter at least one invited member.');
      const response = await teamsApi.inviteMembers(teamId, { members });
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Invitation emails queued');
      setNewInvitedMembers([createMemberRow()]);
      await queryClient.invalidateQueries({ queryKey: ['my-team', activeEventId] });
    },
    onError: (error) => toast.error('Could not send invitations', { description: getApiErrorMessage(error) }),
  });

  const replaceMutation = useMutation({
    mutationFn: async ({ teamId, invitation }: { teamId: string; invitation: TeamInvitation }) => {
      const email = replacementEmails[invitation.id]?.trim().toLowerCase();
      if (!email) throw new Error('Enter a replacement email.');
      const response = await teamsApi.replaceInvitation(teamId, invitation.id, { email });
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Replacement invitation sent');
      await queryClient.invalidateQueries({ queryKey: ['my-team', activeEventId] });
    },
    onError: (error) => toast.error('Could not replace invitation', { description: getApiErrorMessage(error) }),
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ teamId, invitationId }: { teamId: string; invitationId: string }) => {
      const response = await teamsApi.cancelInvitation(teamId, invitationId);
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Invitation cancelled');
      await queryClient.invalidateQueries({ queryKey: ['my-team', activeEventId] });
    },
    onError: (error) => toast.error('Could not cancel invitation', { description: getApiErrorMessage(error) }),
  });

  const team = teamQuery.data;
  const registrationOpen = isRegistrationOpen(selectedEvent);
  const isLeader = Boolean(team && user && team.leaderId === user.id);
  const canChangeInvitations = Boolean(isLeader && registrationOpen && team?.status !== 'REJECTED');

  function handleCreateTeam() {
    if (!teamName.trim()) {
      toast.error('Team name is required.');
      return;
    }
    createTeamMutation.mutate();
  }

  function handleInvite(teamId: string) {
    inviteMutation.mutate(teamId);
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">My Team</h1>
          <p className="text-sm text-muted-foreground">Create a team, invite members, and track confirmation status.</p>
        </div>
        <div className="w-full md:w-80">
          <Label>Event</Label>
          <Select value={activeEventId} onValueChange={setSelectedEventId} disabled={eventsQuery.isLoading}>
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

      {eventsQuery.isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading events</AlertTitle>
          <AlertDescription>Please wait while available events are loaded.</AlertDescription>
        </Alert>
      )}

      {selectedEvent && !registrationOpen && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Registration is not open</AlertTitle>
          <AlertDescription>Team creation and invitations are only available during event registration.</AlertDescription>
        </Alert>
      )}

      {teamQuery.isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading team</AlertTitle>
          <AlertDescription>Checking your team for this event.</AlertDescription>
        </Alert>
      )}

      {!teamQuery.isLoading && !team && (
        <Card>
          <CardHeader>
            <CardTitle>Create team</CardTitle>
            <CardDescription>
              You will become the team leader. Invited members receive secure confirmation links by email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <MemberInviteFields
                rows={invitedMembers}
                setRows={setInvitedMembers}
                disabled={!registrationOpen}
              />
            </div>
            <Button onClick={handleCreateTeam} disabled={!registrationOpen || createTeamMutation.isPending}>
              {createTeamMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create team and send invites
            </Button>
          </CardContent>
        </Card>
      )}

      {team && (
        <>
          <TeamStatusAlert team={team} />

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>{team.projectName || selectedEvent?.title}</CardDescription>
                </div>
                <Badge variant={statusBadgeVariant(team.status)}>{team.status.replaceAll('_', ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{team.members.length} confirmed member(s)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{team.invitations.filter((invitation) => invitation.status === 'PENDING').length} pending invite(s)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Required: {team.event?.minTeamMembers || selectedEvent?.minTeamMembers || 3} members</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Confirmed members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                  <Badge variant="outline" className="text-xs">{participant.teamRole}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

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
                <div key={invitation.id} className="p-3 border rounded-md space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium">{invitation.invitedEmail}</p>
                      <p className="text-xs text-muted-foreground">Expires {new Date(invitation.expiresAt).toLocaleString()}</p>
                    </div>
                    <Badge variant={statusBadgeVariant(invitation.status)}>{invitation.status}</Badge>
                  </div>

                  {canChangeInvitations && invitation.status === 'PENDING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelMutation.mutate({ teamId: team.id, invitationId: invitation.id })}
                      disabled={cancelMutation.isPending}
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
                        onChange={(event) => setReplacementEmails((current) => ({
                          ...current,
                          [invitation.id]: event.target.value,
                        }))}
                      />
                      <Button
                        onClick={() => replaceMutation.mutate({ teamId: team.id, invitation })}
                        disabled={replaceMutation.isPending}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
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
                  rows={newInvitedMembers}
                  setRows={setNewInvitedMembers}
                />
                <Button onClick={() => handleInvite(team.id)} disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send invitations
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
