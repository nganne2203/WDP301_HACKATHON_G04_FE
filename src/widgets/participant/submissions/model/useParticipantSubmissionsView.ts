import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/event/api';
import { roundsApi } from '@/entities/round/api';
import { submissionsApi } from '@/entities/submission/api';
import { teamsApi } from '@/entities/team/api';
import { useStore } from '@/entities/session/model/store';
import type { Round, Submission } from '@/shared/api/types';

import {
  createSubmissionForm,
  getSubmissionErrorMessage,
  mapSubmissionToForm,
  normalizeUrl,
  type SubmissionFormState,
} from './submission-form';

export function useParticipantSubmissionsView() {
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
        if (getSubmissionErrorMessage(error) && (error as any)?.statusCode === 404) return null;
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
    onSuccess: async () => {
      toast.success('Submission draft saved');
      setFormOpen(false);
      setSelectedRound(null);
      await queryClient.invalidateQueries({ queryKey: ['participant-submissions'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to save submission', { description: getSubmissionErrorMessage(error) });
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
    onSuccess: async () => {
      toast.success('Submission sent successfully');
      setSubmitConfirmOpen(false);
      setFormOpen(false);
      setSelectedRound(null);
      await queryClient.invalidateQueries({ queryKey: ['participant-submissions'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to submit artifacts', { description: getSubmissionErrorMessage(error) });
    },
  });

  const openSubmissionDialog = (round: Round) => {
    setSelectedRound(round);
    const currentSubmission = submissionMap.get(round.id) || null;
    setForm(currentSubmission ? mapSubmissionToForm(currentSubmission) : createSubmissionForm());
    setFormOpen(true);
  };

  return {
    user,
    selectedEventId,
    setSelectedEventId,
    selectedRound,
    formOpen,
    setFormOpen,
    submitConfirmOpen,
    setSubmitConfirmOpen,
    form,
    setForm,
    eventsQuery,
    events,
    selectedEvent,
    teamQuery,
    team,
    roundsQuery,
    rounds,
    submissionsQuery,
    submissionMap,
    saveDraftMutation,
    submitMutation,
    openSubmissionDialog,
  };
}
