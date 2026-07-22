import { ExternalLink, FileText, Github, Loader2, Plus } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { getSubmissionErrorMessage } from '../model/submission-form';
import {
  getRoundSubmissionGateMessage,
  isRoundAcceptingSubmissions,
  useParticipantSubmissionsView,
} from '../model/useParticipantSubmissionsView';
import { SubmissionDialog } from './SubmissionDialog';

export function ParticipantSubmissions() {
  const view = useParticipantSubmissionsView();

  return (
    <div className="p-6 space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-semibold mb-1">Submissions</h1>
          <p className="text-sm text-muted-foreground">Manage team deliverables for each round and submit them before the deadline.</p>
        </div>
      </div>

      {view.eventsQuery.error && (
        <Alert>
          <AlertTitle>Could not load competitions</AlertTitle>
          <AlertDescription>{getSubmissionErrorMessage(view.eventsQuery.error)}</AlertDescription>
        </Alert>
      )}

      {view.teamQuery.isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading team</AlertTitle>
          <AlertDescription>Checking your active team for this competition.</AlertDescription>
        </Alert>
      )}

      {!view.teamQuery.isLoading && !view.team && view.selectedCompetition && (
        <Alert>
          <AlertTitle>No team found</AlertTitle>
          <AlertDescription>Create or join a team in this competition before submitting round artifacts.</AlertDescription>
        </Alert>
      )}

      {view.team && (
        <Card>
          <CardHeader>
            <CardTitle>{view.team.name}</CardTitle>
            <CardDescription>{view.selectedCompetition?.title}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
            <div>Leader: {view.user?.fullName || view.user?.email}</div>
            <div>Members: {view.team.members.length}</div>
            <div>Status: {view.team.status}</div>
          </CardContent>
        </Card>
      )}

      {view.team && view.roundsQuery.error && (
        <Alert>
          <AlertTitle>Could not load rounds</AlertTitle>
          <AlertDescription>{getSubmissionErrorMessage(view.roundsQuery.error)}</AlertDescription>
        </Alert>
      )}

      {view.team && !view.roundsQuery.isLoading && view.rounds.length === 0 && (
        <Alert>
          <AlertTitle>No rounds assigned</AlertTitle>
          <AlertDescription>Your confirmed team has not been assigned to a competition round yet.</AlertDescription>
        </Alert>
      )}

      {view.team && view.rounds.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {view.rounds.map((round) => {
            const submission = view.submissionMap.get(round.id) || null;
            const locked = submission?.status === 'SUBMITTED' || submission?.status === 'ACCEPTED' || submission?.status === 'REJECTED';
            const accepting = isRoundAcceptingSubmissions(round);
            const gateMessage = getRoundSubmissionGateMessage(round);
            const canEdit = Boolean(!locked && accepting);
            return (
              <Card key={round.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{round.name}</CardTitle>
                      <CardDescription>
                        {round.roundType} - Deadline {round.submissionDeadline ? new Date(round.submissionDeadline).toLocaleString() : 'not set'}
                      </CardDescription>
                    </div>
                    <Badge variant={locked ? 'default' : submission ? 'secondary' : 'outline'}>
                      {submission?.status || 'NOT STARTED'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {submission?.demoUrl && (
                      <a href={submission.demoUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          Demo
                        </Button>
                      </a>
                    )}
                    {submission?.reportUrl && (
                      <a href={submission.reportUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm">
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          Report
                        </Button>
                      </a>
                    )}
                    {submission?.presentationUrl && (
                      <a href={submission.presentationUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm">
                          <Github className="mr-1 h-3.5 w-3.5" />
                          Slides
                        </Button>
                      </a>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {submission?.submittedAt
                      ? `Submitted at ${new Date(submission.submittedAt).toLocaleString()}`
                      : gateMessage || 'No submitted artifacts yet.'}
                  </div>
                  <Button variant={submission ? 'outline' : 'default'} onClick={() => view.openSubmissionDialog(round)}>
                    {submission ? (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        {canEdit ? 'Edit draft' : 'View submission'}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {accepting ? 'Start submission' : 'View round'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <SubmissionDialog
        open={view.formOpen}
        onOpenChange={view.setFormOpen}
        submitConfirmOpen={view.submitConfirmOpen}
        onSubmitConfirmOpenChange={view.setSubmitConfirmOpen}
        selectedRound={view.selectedRound}
        currentSubmission={view.selectedRound ? view.submissionMap.get(view.selectedRound.id) || null : null}
        gateMessage={getRoundSubmissionGateMessage(view.selectedRound)}
        form={view.form}
        setForm={view.setForm}
        saveDraftPending={view.saveDraftMutation.isPending}
        submitPending={view.submitMutation.isPending}
        onSaveDraft={() =>
          view.selectedRound &&
          view.saveDraftMutation.mutate({
            round: view.selectedRound,
            currentSubmission: view.submissionMap.get(view.selectedRound.id) || null,
          })
        }
        onSubmit={() =>
          view.selectedRound &&
          view.submitMutation.mutate({
            round: view.selectedRound,
            currentSubmission: view.submissionMap.get(view.selectedRound.id) || null,
          })
        }
      />
    </div>
  );
}
