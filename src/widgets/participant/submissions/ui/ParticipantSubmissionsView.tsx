import { ExternalLink, FileText, Github, Loader2, Plus } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { getSubmissionErrorMessage } from '../model/submission-form';
import { useParticipantSubmissionsView } from '../model/useParticipantSubmissionsView';
import { SubmissionDialog } from './SubmissionDialog';

export function ParticipantSubmissions() {
  const view = useParticipantSubmissionsView();

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Submissions</h1>
          <p className="text-sm text-muted-foreground">Manage team deliverables for each round and submit them before the deadline.</p>
        </div>
        <div className="w-full md:w-80">
          <Label>Event</Label>
          <Select value={view.selectedEvent?.id || ''} onValueChange={view.setSelectedEventId} disabled={view.eventsQuery.isLoading}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {view.events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {view.eventsQuery.error && (
        <Alert>
          <AlertTitle>Could not load events</AlertTitle>
          <AlertDescription>{getSubmissionErrorMessage(view.eventsQuery.error)}</AlertDescription>
        </Alert>
      )}

      {view.teamQuery.isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading team</AlertTitle>
          <AlertDescription>Checking your active team for this event.</AlertDescription>
        </Alert>
      )}

      {!view.teamQuery.isLoading && !view.team && view.selectedEvent && (
        <Alert>
          <AlertTitle>No team found</AlertTitle>
          <AlertDescription>Create or join a team in this event before submitting round artifacts.</AlertDescription>
        </Alert>
      )}

      {view.team && (
        <Card>
          <CardHeader>
            <CardTitle>{view.team.name}</CardTitle>
            <CardDescription>{view.team.projectName || view.selectedEvent?.title}</CardDescription>
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
          <AlertTitle>No rounds available</AlertTitle>
          <AlertDescription>The coordinator has not opened any rounds for this event yet.</AlertDescription>
        </Alert>
      )}

      {view.team && view.rounds.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {view.rounds.map((round) => {
            const submission = view.submissionMap.get(round.id) || null;
            const locked = submission?.status === 'SUBMITTED' || submission?.status === 'ACCEPTED' || submission?.status === 'REJECTED';
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
                    {submission?.submittedAt ? `Submitted at ${new Date(submission.submittedAt).toLocaleString()}` : 'No submitted artifacts yet.'}
                  </div>
                  <Button variant={submission ? 'outline' : 'default'} onClick={() => view.openSubmissionDialog(round)}>
                    {submission ? (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        {locked ? 'View submission' : 'Edit draft'}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Start submission
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
