import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { submissionsApi } from '@/entities/submission/api';
import { useStore } from '@/entities/session/model/store';
import type { Round, Submission } from '@/shared/api/types';
import { useCompetitionsQuery, useMyTeamQuery, useRoundsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';

import {
  createSubmissionForm,
  getSubmissionErrorMessage,
  mapSubmissionToForm,
  normalizeUrl,
  type SubmissionFormState,
} from './submission-form';

export function isRoundAcceptingSubmissions(round?: Round | null) {
  if (!round || round.status !== 'OPEN') return false;
  if (!round.submissionDeadline) return true;
  const deadline = new Date(round.submissionDeadline).getTime();
  return Number.isNaN(deadline) || deadline >= Date.now();
}

export function getRoundSubmissionGateMessage(round?: Round | null) {
  if (!round) return 'Choose a round before editing submission artifacts.';
  if (round.status !== 'OPEN') return 'This round is not open for participant submissions.';
  if (round.submissionDeadline && new Date(round.submissionDeadline).getTime() < Date.now()) {
    return 'The submission deadline for this round has passed.';
  }
  return '';
}

export function useParticipantSubmissionsView() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useStore((state) => state.user);
  const storeSelectedCompetition = useStore((state) => state.selectedCompetition);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [form, setForm] = useState<SubmissionFormState>(createSubmissionForm());

  const eventsQuery = useCompetitionsQuery();

  const competitions = eventsQuery.data || [];
  const selectedCompetition = useMemo(() => {
    if (!competitions.length) return null;
    return competitions.find((competition) => competition.id === storeSelectedCompetition?.id) || competitions[0];
  }, [competitions, storeSelectedCompetition?.id]);

  const teamQuery = useMyTeamQuery(selectedCompetition?.id);

  const team = teamQuery.data;

  const roundsQuery = useRoundsQuery(
    { competitionId: selectedCompetition?.id, limit: 10 },
    { enabled: Boolean(selectedCompetition?.id) }
  );

  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions.list({ competitionId: selectedCompetition?.id, teamId: team?.id, limit: 10 }),
    enabled: Boolean(selectedCompetition?.id && team?.id),
    queryFn: async () =>
      (await submissionsApi.list({
        competitionId: selectedCompetition?.id,
        teamId: team?.id,
        limit: 10,
      })).data,
  });

  const rounds = roundsQuery.data || [];
  const submissions = submissionsQuery.data || [];
  const submissionMap = useMemo(() => {
    const map = new Map<string, Submission>();
    submissions.forEach((submission) => map.set(submission.roundId, submission));
    return map;
  }, [submissions]);

  // The Round page can deep-link here so the participant lands directly in
  // the submission form for the selected round.
  useEffect(() => {
    const requestedRoundId = searchParams.get('roundId');
    if (!requestedRoundId || formOpen) return;

    const requestedRound = rounds.find((round) => round.id === requestedRoundId);
    if (!requestedRound) return;

    const currentSubmission = submissionMap.get(requestedRound.id) || null;
    setSelectedRound(requestedRound);
    setForm(currentSubmission ? mapSubmissionToForm(currentSubmission) : createSubmissionForm());
    setFormOpen(true);
    setSearchParams((current) => {
      current.delete('roundId');
      return current;
    }, { replace: true });
  }, [formOpen, rounds, searchParams, setSearchParams, submissionMap]);

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
          competitionId: selectedCompetition!.id,
          roundId: round.id,
          teamId: team!.id,
          ...payload,
          status: 'DRAFT',
        })
      ).data;
    },
    onSuccess: async () => {
      toast.success('Submission changes saved');
      setFormOpen(false);
      setSelectedRound(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.submissions.lists() });
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
          competitionId: selectedCompetition!.id,
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.submissions.lists() });
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
    selectedRound,
    formOpen,
    setFormOpen,
    submitConfirmOpen,
    setSubmitConfirmOpen,
    form,
    setForm,
    eventsQuery,
    competitions,
    selectedCompetition,
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
