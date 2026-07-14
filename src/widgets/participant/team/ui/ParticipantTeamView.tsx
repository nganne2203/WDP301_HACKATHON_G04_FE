import { Clock, Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { TeamStatusAlert } from '@/features/team/member-invites/ui/TeamStatusAlert';
import { useParticipantTeamView } from '@/widgets/participant/team/model/useParticipantTeamView';
import { CreateTeamCard } from '@/widgets/participant/team/ui/CreateTeamCard';
import { TeamInvitationsCard } from '@/widgets/participant/team/ui/TeamInvitationsCard';
import { TeamOverviewCard } from '@/widgets/participant/team/ui/TeamOverviewCard';

export function ParticipantTeam() {
  const {
    activeEventId,
    canChangeInvitations,
    canLeaveTeam,
    cancelMutation,
    createValidationPending,
    createTeamMutation,
    eventsQuery,
    handleCreateTeam,
    handleInvite,
    inviteMutation,
    invitedMembers,
    isLeader,
    leaveTeamMutation,
    newInvitedMembers,
    registrationOpen,
    replacementEmails,
    replaceMutation,
    selectedEvent,
    setInvitedMembers,
    setNewInvitedMembers,
    setReplacementEmails,
    setTeamName,
    team,
    teamNameChecking,
    teamNameValidationMessage,
    teamName,
    teamQuery,
  } = useParticipantTeamView();

  return (
    <div className="p-6 space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-semibold mb-1">My Team</h1>
          <p className="text-sm text-muted-foreground">Create a team, invite members, and track confirmation status.</p>
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
            isLeader={isLeader}
            leavePending={leaveTeamMutation.isPending}
            minTeamMembers={selectedEvent?.minTeamMembers}
            onLeaveTeam={() => leaveTeamMutation.mutate(team.id)}
            canLeaveTeam={canLeaveTeam}
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
