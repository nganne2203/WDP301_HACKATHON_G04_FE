import { Clock, Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { TeamStatusAlert } from '@/features/team/member-invites/ui/TeamStatusAlert';
import { useParticipantTeamView } from '@/widgets/participant/team/model/useParticipantTeamView';
import { CreateTeamCard } from '@/widgets/participant/team/ui/CreateTeamCard';
import { TeamInvitationsCard } from '@/widgets/participant/team/ui/TeamInvitationsCard';
import { TeamOverviewCard } from '@/widgets/participant/team/ui/TeamOverviewCard';

export function ParticipantTeam() {
  const {
    activeEventId,
    canChangeInvitations,
    cancelMutation,
    createValidationPending,
    createTeamMutation,
    events,
    eventsQuery,
    handleCreateTeam,
    handleInvite,
    inviteMutation,
    invitedMembers,
    newInvitedMembers,
    registrationOpen,
    replacementEmails,
    replaceMutation,
    selectedEvent,
    setInvitedMembers,
    setNewInvitedMembers,
    setReplacementEmails,
    setSelectedEventId,
    setTeamName,
    team,
    teamNameChecking,
    teamNameValidationMessage,
    teamName,
    teamQuery,
  } = useParticipantTeamView();

  return (
    <div className="p-6 space-y-6">
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
        <CreateTeamCard
          activeEventId={activeEventId}
          createPending={createTeamMutation.isPending || createValidationPending}
          invitedMembers={invitedMembers}
          onCreateTeam={handleCreateTeam}
          registrationOpen={registrationOpen}
          setInvitedMembers={setInvitedMembers}
          setTeamName={setTeamName}
          teamNameChecking={teamNameChecking}
          teamNameValidationMessage={teamNameValidationMessage}
          teamName={teamName}
        />
      )}

      {team && (
        <>
          <TeamStatusAlert team={team} />

          <TeamOverviewCard
            team={team}
            eventTitle={selectedEvent?.title}
            minTeamMembers={selectedEvent?.minTeamMembers}
          />

          <TeamInvitationsCard
            canChangeInvitations={canChangeInvitations}
            cancelPending={cancelMutation.isPending}
            invitePending={inviteMutation.isPending}
            newInvitedMembers={newInvitedMembers}
            onCancelInvitation={(invitationId) => cancelMutation.mutate({ teamId: team.id, invitationId })}
            onInviteMembers={() => handleInvite(team.id)}
            onReplaceInvitation={(invitation) => replaceMutation.mutate({ teamId: team.id, invitation })}
            replacementEmails={replacementEmails}
            replacePending={replaceMutation.isPending}
            setNewInvitedMembers={setNewInvitedMembers}
            setReplacementEmail={(invitationId, value) =>
              setReplacementEmails((current) => ({ ...current, [invitationId]: value }))
            }
            team={team}
          />
        </>
      )}
    </div>
  );
}
