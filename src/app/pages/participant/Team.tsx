import { type Dispatch, type SetStateAction, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Loader2, Mail, Plus, RefreshCw, Users, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ApiError } from '../../../lib/api/client';
import { eventsApi } from '../../../lib/api/events';
import { teamsApi } from '../../../lib/api/teams';
import type { Event, Team, TeamInvitation, TeamInviteMember } from '../../../lib/api/types';
import { useStore } from '../../../store/useStore';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
type MemberInviteRow = TeamInviteMember & { id: string };

function createMemberRow(): MemberInviteRow {
  return {
    id: Math.random().toString(36).slice(2),
    fullName: '',
    email: '',
  };
}

function normalizeMemberRows(rows: MemberInviteRow[], leaderEmail?: string) {
  const members = rows
    .map((row) => ({
      fullName: row.fullName.trim(),
      email: row.email.trim().toLowerCase(),
    }))
    .filter((row) => row.fullName || row.email);

  const invalidRow = members.find((member) => !member.fullName || !member.email);
  if (invalidRow) {
    throw new Error('Each invited member must include both name and email.');
  }

  const normalizedLeaderEmail = leaderEmail?.trim().toLowerCase();
  if (normalizedLeaderEmail && members.some((member) => member.email === normalizedLeaderEmail)) {
    throw new Error('You cannot invite your own email as a team member.');
  }

  const seenEmails = new Set<string>();
  return members.filter((member) => {
    if (seenEmails.has(member.email)) return false;
    seenEmails.add(member.email);
    return true;
  });
}

function isRegistrationOpen(event?: Event | null) {
  if (!event || event.status !== 'OPEN_REGISTRATION') return false;
  const now = new Date();
  if (event.registrationStart && now < new Date(event.registrationStart)) return false;
  if (event.registrationEnd && now > new Date(event.registrationEnd)) return false;
  return true;
}

function getInitials(nameOrEmail?: string) {
  return (nameOrEmail || '?')
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof Error && !(error instanceof ApiError)) return error.message;
  return error instanceof ApiError ? error.firstError : 'Could not connect to server.';
}

function statusBadgeVariant(status: string): BadgeVariant {
  if (status === 'CONFIRMED' || status === 'ACTIVE' || status === 'ACCEPTED') return 'default';
  if (status === 'REJECTED' || status === 'DECLINED' || status === 'CANCELLED') return 'destructive';
  return 'secondary';
}

function TeamStatusAlert({ team }: { team: Team }) {
  if (team.status === 'CONFIRMED' || team.status === 'ACTIVE') {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle>Team confirmed</AlertTitle>
        <AlertDescription>Your team has enough confirmed members and has reserved an event slot.</AlertDescription>
      </Alert>
    );
  }

  if (team.status === 'REJECTED') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Team rejected</AlertTitle>
        <AlertDescription>
          {team.rejectionReason || 'The required number of confirmed teams has already been reached.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <Clock className="h-4 w-4" />
      <AlertTitle>Waiting for member confirmations</AlertTitle>
      <AlertDescription>
        Your team is created. Invited members must accept their email links before the team can be confirmed.
      </AlertDescription>
    </Alert>
  );
}

function updateMemberRow(
  setRows: Dispatch<SetStateAction<MemberInviteRow[]>>,
  id: string,
  field: 'fullName' | 'email',
  value: string
) {
  setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
}

function removeMemberRow(
  setRows: Dispatch<SetStateAction<MemberInviteRow[]>>,
  id: string
) {
  setRows((current) => {
    if (current.length === 1) return current;
    return current.filter((row) => row.id !== id);
  });
}

function MemberInviteFields({
  rows,
  setRows,
  disabled,
}: {
  rows: MemberInviteRow[];
  setRows: Dispatch<SetStateAction<MemberInviteRow[]>>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.id} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2 items-end">
          <div className="space-y-2">
            <Label htmlFor={`member-name-${row.id}`}>{index === 0 ? 'Member name' : 'Name'}</Label>
            <Input
              id={`member-name-${row.id}`}
              value={row.fullName}
              onChange={(event) => updateMemberRow(setRows, row.id, 'fullName', event.target.value)}
              placeholder="Nguyen Van A"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`member-email-${row.id}`}>{index === 0 ? 'Member email' : 'Email'}</Label>
            <Input
              id={`member-email-${row.id}`}
              type="email"
              value={row.email}
              onChange={(event) => updateMemberRow(setRows, row.id, 'email', event.target.value)}
              placeholder="member@example.com"
              disabled={disabled}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeMemberRow(setRows, row.id)}
            disabled={disabled || rows.length === 1}
            aria-label="Remove invited member"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRows((current) => [...current, createMemberRow()])}
        disabled={disabled}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add member
      </Button>
    </div>
  );
}

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
