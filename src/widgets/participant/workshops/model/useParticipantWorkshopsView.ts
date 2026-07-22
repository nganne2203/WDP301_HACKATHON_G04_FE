import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { workshopsApi } from '@/shared/api';
import { selectDefaultCompetition, useCompetitionsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import type { Workshop } from '@/shared/api/types';

function canSubmitQuestionForWorkshop(workshop: Workshop | null) {
  if (!workshop || !['SCHEDULED', 'LIVE'].includes(workshop.status)) return false;
  const endTime = new Date(workshop.endTime);
  return !Number.isNaN(endTime.getTime()) && new Date() <= endTime;
}

export function useParticipantWorkshopsView() {
  const queryClient = useQueryClient();
  const selectedCompetition = useStore((state) => state.selectedCompetition);
  const setSelectedCompetition = useStore((state) => state.setSelectedCompetition);
  const appRole = useStore((state) => state.appRole);
  const userPermissions = useStore((state) => state.user?.permissions || []);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [questionContent, setQuestionContent] = useState('');
  const [ratingValue, setRatingValue] = useState(5);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);

  const eventsQuery = useCompetitionsQuery();
  const competitions = eventsQuery.data || [];

  const activeCompetition = useMemo(() => {
    if (!competitions.length) return null;
    return competitions.find((competition) => competition.id === selectedCompetition?.id)
      || selectDefaultCompetition(competitions)
      || competitions[0];
  }, [competitions, selectedCompetition?.id]);

  useEffect(() => {
    if (!activeCompetition) return;

    if (
      selectedCompetition?.id === activeCompetition.id &&
      selectedCompetition.title === activeCompetition.title &&
      selectedCompetition.semester === (activeCompetition.semester || '') &&
      selectedCompetition.status === activeCompetition.status
    ) {
      return;
    }

    setSelectedCompetition({
      id: activeCompetition.id,
      title: activeCompetition.title,
      semester: activeCompetition.semester || '',
      status: activeCompetition.status,
    });
  }, [activeCompetition, selectedCompetition, setSelectedCompetition]);

  const workshopsQuery = useQuery({
    queryKey: queryKeys.workshops.list({ competitionId: activeCompetition?.id }),
    enabled: Boolean(activeCompetition?.id),
    queryFn: () => workshopsApi.list({ competitionId: activeCompetition?.id }),
  });

  const workshops = workshopsQuery.data?.data || [];

  const workshopQuestionsQuery = useQuery({
    queryKey: queryKeys.workshops.questions(selectedWorkshop?.id, { page: 1, limit: 50 }),
    enabled: (isDetailOpen || isQuestionsOpen) && Boolean(selectedWorkshop?.id),
    queryFn: () => workshopsApi.listQuestions(selectedWorkshop!.id, { page: 1, limit: 50 }),
  });

  const workshopQuestions = workshopQuestionsQuery.data?.data || [];
  const ownRatingQuery = useQuery({
    queryKey: queryKeys.workshops.ratings(selectedWorkshop?.id, { page: 1, limit: 1, mine: true }),
    enabled: isDetailOpen && Boolean(selectedWorkshop?.id),
    queryFn: () => workshopsApi.listRatings(selectedWorkshop!.id, { page: 1, limit: 1, mine: true }),
  });

  const ownFeedbackQuery = useQuery({
    queryKey: queryKeys.workshops.feedback(selectedWorkshop?.id, { page: 1, limit: 1, mine: true }),
    enabled: isDetailOpen && Boolean(selectedWorkshop?.id),
    queryFn: () => workshopsApi.listFeedback(selectedWorkshop!.id, { page: 1, limit: 1, mine: true }),
  });

  const ownRating = ownRatingQuery.data?.data?.ratings?.[0] || null;
  const ownFeedback = ownFeedbackQuery.data?.data?.[0] || null;
  const canSubmitQuestionForSelectedWorkshop = canSubmitQuestionForWorkshop(selectedWorkshop);
  const canCreateQuestion = userPermissions.includes('WORKSHOP_QUESTION_CREATE');
  const canVoteQuestion = userPermissions.includes('WORKSHOP_QUESTION_VOTE');
  const canCreateRating = userPermissions.includes('WORKSHOP_RATING_CREATE');
  const canCreateFeedback = userPermissions.includes('WORKSHOP_FEEDBACK_CREATE');

  const createQuestionMutation = useMutation({
    mutationFn: ({ workshopId, content }: { workshopId: string; content: string }) =>
      workshopsApi.createQuestion(workshopId, { content }),
    onSuccess: () => {
      toast.success('Question submitted successfully');
      setQuestionContent('');
      queryClient.invalidateQueries({
        queryKey: queryKeys.workshops.questions(selectedWorkshop!.id, { page: 1, limit: 50 }),
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to submit question', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const voteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => workshopsApi.voteQuestion(questionId),
    onSuccess: () => {
      toast.success('Upvote recorded');
      queryClient.invalidateQueries({
        queryKey: queryKeys.workshops.questions(selectedWorkshop!.id, { page: 1, limit: 50 }),
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to upvote question', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const createRatingMutation = useMutation({
    mutationFn: ({ workshopId, rating }: { workshopId: string; rating: number }) =>
      workshopsApi.createRating(workshopId, { rating }),
    onSuccess: () => {
      toast.success('Thank you for rating this workshop!');
      queryClient.invalidateQueries({
        queryKey: queryKeys.workshops.ratings(selectedWorkshop?.id, { page: 1, limit: 1, mine: true }),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.workshops.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to submit rating', {
        description: error instanceof ApiError ? error.firstError : 'You might have already rated this workshop',
      });
    },
  });

  const createFeedbackMutation = useMutation({
    mutationFn: ({ workshopId, comment }: { workshopId: string; comment: string }) =>
      workshopsApi.createFeedback(workshopId, { comment }),
    onSuccess: () => {
      toast.success('Feedback submitted successfully');
      setFeedbackContent('');
      queryClient.invalidateQueries({
        queryKey: queryKeys.workshops.feedback(selectedWorkshop?.id, { page: 1, limit: 1, mine: true }),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.workshops.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to submit feedback', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const handleCreateQuestion = () => {
    const content = questionContent.trim();
    if (!selectedWorkshop || content.length < 2) return;
    createQuestionMutation.mutate({
      workshopId: selectedWorkshop.id,
      content,
    });
  };

  const handleRateWorkshop = (rating: number) => {
    if (!selectedWorkshop) return;
    createRatingMutation.mutate({
      workshopId: selectedWorkshop.id,
      rating,
    });
  };

  const handleFeedbackSubmit = () => {
    const comment = feedbackContent.trim();
    if (!selectedWorkshop || !comment) return;
    createFeedbackMutation.mutate({
      workshopId: selectedWorkshop.id,
      comment,
    });
  };

  const openDetailSheet = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setRatingValue(5);
    setFeedbackContent('');
    setQuestionContent('');
    setIsDetailOpen(true);
  };

  const openQuestionsDialog = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setQuestionContent('');
    setIsQuestionsOpen(true);
  };

  const closeDetailSheet = () => {
    setIsDetailOpen(false);
    if (!isQuestionsOpen) {
      setSelectedWorkshop(null);
    }
  };

  const closeQuestionsDialog = () => {
    setIsQuestionsOpen(false);
    if (!isDetailOpen) {
      setSelectedWorkshop(null);
    }
  };

  return {
    activeCompetition,
    competitions,
    eventsQuery,
    workshops,
    workshopsQuery,
    selectedWorkshop,
    appRole,
    isDetailOpen,
    isQuestionsOpen,
    openDetailSheet,
    openQuestionsDialog,
    closeDetailSheet,
    closeQuestionsDialog,
    questionContent,
    setQuestionContent,
    handleCreateQuestion,
    createQuestionMutation,
    canCreateQuestion,
    workshopQuestions,
    workshopQuestionsQuery,
    ownRating,
    ownRatingQuery,
    ownFeedback,
    ownFeedbackQuery,
    voteQuestionMutation,
    canVoteQuestion,
    canSubmitQuestionForSelectedWorkshop,
    ratingValue,
    setRatingValue,
    handleRateWorkshop,
    createRatingMutation,
    canCreateRating,
    feedbackContent,
    setFeedbackContent,
    handleFeedbackSubmit,
    createFeedbackMutation,
    canCreateFeedback,
  };
}
