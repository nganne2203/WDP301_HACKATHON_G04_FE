import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FileText, Github, Loader2, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/event/api';
import { roundsApi } from '@/entities/round/api';
import { submissionsApi } from '@/entities/submission/api';
import { teamsApi } from '@/entities/team/api';
import { useStore } from '@/entities/session/model/store';
import { ApiError } from '@/shared/api/client';
import type { Round, Submission } from '@/shared/api/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

interface SubmissionFormState {
  demoUrl: string;
  reportUrl: string;
  presentationUrl: string;
}

function createSubmissionForm(): SubmissionFormState {
  return {
    demoUrl: '',
    reportUrl: '',
    presentationUrl: '',
  };
}

function mapSubmissionToForm(submission: Submission): SubmissionFormState {
  return {
    demoUrl: submission.demoUrl || '',
    reportUrl: submission.reportUrl || '',
    presentationUrl: submission.presentationUrl || '',
  };
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Please try again.';
}

export function ParticipantSubmissions() {
  const queryClient = useQueryClient();
  const { user } = useStore();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [form, setForm] = useState<SubmissionFormState>(createSubmissionForm());

  const eventsQuery = useQuery({
    queryKey: ['participant-submission-events'],
    queryFn: async () => (await eventsApi.list({ page: 1, limit: 100 })).data,
  });

  const events = eventsQuery.data || [];
  const selectedEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  const teamQuery = useQuery({
    queryKey: ['participant-submission-team', selectedEvent?.id],
    enabled: Boolean(selectedEvent?.id),
    retry: false,
    queryFn: async () => {
      try {
        return (await teamsApi.getMyTeam(selectedEvent!.id)).data;
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404) return null;
        throw error;
      }
    },
  });

  const team = teamQuery.data;

  const roundsQuery = useQuery({
    queryKey: ['participant-submission-rounds', selectedEvent?.id],
    enabled: Boolean(selectedEvent?.id),
    queryFn: async () => (await roundsApi.list({ eventId: selectedEvent?.id, limit: 100 })).data,
  });

  const submissionsQuery = useQuery({
    queryKey: ['participant-submissions', selectedEvent?.id, team?.id],
    enabled: Boolean(selectedEvent?.id && team?.id),
    queryFn: async () =>
      (await submissionsApi.list({
        eventId: selectedEvent?.id,
        teamId: team?.id,
        limit: 100,
      })).data,
  });

  const rounds = roundsQuery.data || [];
  const submissions = submissionsQuery.data || [];
  const submissionMap = useMemo(() => {
    const map = new Map<string, Submission>();
    submissions.forEach((submission) => map.set(submission.roundId, submission));
    return map;
  }, [submissions]);

  const saveDraftMutation = useMutation({
    mutationFn: async ({ round, currentSubmission }: { round: Round; currentSubmission: Submission | null }) => {
      const payload = {
        repositoryId: null,
        demoUrl: normalizeUrl(form.demoUrl),
        reportUrl: normalizeUrl(form.reportUrl),
        presentationUrl: normalizeUrl(form.presentationUrl),
      };

      if (currentSubmission) {
        return (await submissionsApi.update(currentSubmission.id, payload)).data;
      }

      return (
        await submissionsApi.create({
          eventId: selectedEvent!.id,
          roundId: round.id,
          teamId: team!.id,
          ...payload,
          status: 'DRAFT',
        })
      ).data;
    },
    onSuccess: () => {
      toast.success('Submission draft saved');
      queryClient.invalidateQueries({ queryKey: ['participant-submissions'] });
      setFormOpen(false);
      setSelectedRound(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to save submission', { description: getErrorMessage(error) });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ round, currentSubmission }: { round: Round; currentSubmission: Submission | null }) => {
      const payload = {
        repositoryId: null,
        demoUrl: normalizeUrl(form.demoUrl),
        reportUrl: normalizeUrl(form.reportUrl),
        presentationUrl: normalizeUrl(form.presentationUrl),
      };

      if (currentSubmission) {
        const updated = (await submissionsApi.update(currentSubmission.id, payload)).data;
        return (await submissionsApi.submit(updated.id)).data;
      }

      const created = (
        await submissionsApi.create({
          eventId: selectedEvent!.id,
          roundId: round.id,
          teamId: team!.id,
          ...payload,
          status: 'DRAFT',
        })
      ).data;

      return (await submissionsApi.submit(created.id)).data;
    },
    onSuccess: () => {
      toast.success('Submission sent successfully');
      queryClient.invalidateQueries({ queryKey: ['participant-submissions'] });
      setSubmitConfirmOpen(false);
      setFormOpen(false);
      setSelectedRound(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to submit artifacts', { description: getErrorMessage(error) });
    },
  });

  const openSubmissionDialog = (round: Round) => {
    setSelectedRound(round);
    const currentSubmission = submissionMap.get(round.id) || null;
    setForm(currentSubmission ? mapSubmissionToForm(currentSubmission) : createSubmissionForm());
    setFormOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Submissions</h1>
          <p className="text-sm text-muted-foreground">Manage team deliverables for each round and submit them before the deadline.</p>
        </div>
        <div className="w-full md:w-80">
          <Label>Event</Label>
          <Select value={selectedEvent?.id || ''} onValueChange={setSelectedEventId} disabled={eventsQuery.isLoading}>
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

      {eventsQuery.error && (
        <Alert>
          <AlertTitle>Could not load events</AlertTitle>
          <AlertDescription>{getErrorMessage(eventsQuery.error)}</AlertDescription>
        </Alert>
      )}

      {teamQuery.isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading team</AlertTitle>
          <AlertDescription>Checking your active team for this event.</AlertDescription>
        </Alert>
      )}

      {!teamQuery.isLoading && !team && selectedEvent && (
        <Alert>
          <AlertTitle>No team found</AlertTitle>
          <AlertDescription>Create or join a team in this event before submitting round artifacts.</AlertDescription>
        </Alert>
      )}

      {team && (
        <Card>
          <CardHeader>
            <CardTitle>{team.name}</CardTitle>
            <CardDescription>{team.projectName || selectedEvent?.title}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
            <div>Leader: {user?.fullName || user?.email}</div>
            <div>Members: {team.members.length}</div>
            <div>Status: {team.status}</div>
          </CardContent>
        </Card>
      )}

      {team && roundsQuery.error && (
        <Alert>
          <AlertTitle>Could not load rounds</AlertTitle>
          <AlertDescription>{getErrorMessage(roundsQuery.error)}</AlertDescription>
        </Alert>
      )}

      {team && !roundsQuery.isLoading && rounds.length === 0 && (
        <Alert>
          <AlertTitle>No rounds available</AlertTitle>
          <AlertDescription>The coordinator has not opened any rounds for this event yet.</AlertDescription>
        </Alert>
      )}

      {team && rounds.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rounds.map((round) => {
            const submission = submissionMap.get(round.id) || null;
            const locked = submission?.status === 'SUBMITTED' || submission?.status === 'ACCEPTED' || submission?.status === 'REJECTED';
            return (
              <Card key={round.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{round.name}</CardTitle>
                      <CardDescription>
                        {round.roundType} · Deadline {round.submissionDeadline ? new Date(round.submissionDeadline).toLocaleString() : 'not set'}
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
                      : 'No submitted artifacts yet.'}
                  </div>
                  <Button variant={submission ? 'outline' : 'default'} onClick={() => openSubmissionDialog(round)}>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRound?.name || 'Submission'}</DialogTitle>
            <DialogDescription>Attach the links your team wants judges to review for this round.</DialogDescription>
          </DialogHeader>
          {selectedRound && (
            <div className="space-y-4 py-2">
              <SubmissionInput id="submission-demo" label="Demo URL" value={form.demoUrl} onChange={(value) => setForm((current) => ({ ...current, demoUrl: value }))} />
              <SubmissionInput id="submission-report" label="Report URL" value={form.reportUrl} onChange={(value) => setForm((current) => ({ ...current, reportUrl: value }))} />
              <SubmissionInput id="submission-presentation" label="Presentation URL" value={form.presentationUrl} onChange={(value) => setForm((current) => ({ ...current, presentationUrl: value }))} />

              {(submissionMap.get(selectedRound.id)?.status === 'SUBMITTED' ||
                submissionMap.get(selectedRound.id)?.status === 'ACCEPTED' ||
                submissionMap.get(selectedRound.id)?.status === 'REJECTED') ? (
                <Alert>
                  <AlertTitle>Submission locked</AlertTitle>
                  <AlertDescription>This submission is no longer editable from the participant side.</AlertDescription>
                </Alert>
              ) : (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => saveDraftMutation.mutate({ round: selectedRound, currentSubmission: submissionMap.get(selectedRound.id) || null })}
                    disabled={saveDraftMutation.isPending}
                  >
                    {saveDraftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Draft'}
                  </Button>
                  <Button
                    onClick={() => setSubmitConfirmOpen(true)}
                    disabled={
                      submitMutation.isPending ||
                      (!normalizeUrl(form.demoUrl) &&
                        !normalizeUrl(form.reportUrl) &&
                        !normalizeUrl(form.presentationUrl))
                    }
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit artifacts</AlertDialogTitle>
            <AlertDialogDescription>
              Submit the artifacts for <strong>{selectedRound?.name}</strong>? After submission, the participant flow may no longer allow edits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                selectedRound &&
                submitMutation.mutate({
                  round: selectedRound,
                  currentSubmission: submissionMap.get(selectedRound.id) || null,
                })
              }
            >
              {submitMutation.isPending ? 'Submitting...' : 'Confirm Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SubmissionInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder="https://..." />
    </div>
  );
}
