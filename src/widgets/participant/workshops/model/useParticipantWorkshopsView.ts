import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { workshopsApi } from '@/shared/api';
import { selectDefaultEvent, useEventsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import type { Workshop } from '@/shared/api/types';

export function useParticipantWorkshopsView() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const setSelectedEvent = useStore((state) => state.setSelectedEvent);
  const appRole = useStore((state) => state.appRole);
  const userPermissions = useStore((state) => state.user?.permissions || []);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [questionContent, setQuestionContent] = useState('');
  const [ratingValue, setRatingValue] = useState(5);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];

  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId)
      || events.find((event) => event.id === selectedEvent?.id)
      || selectDefaultEvent(events)
      || events[0];
  }, [events, selectedEventId, selectedEvent?.id]);

  useEffect(() => {
    if (!activeEvent) return;

    if (
      selectedEvent?.id === activeEvent.id &&
      selectedEvent.title === activeEvent.title &&
      selectedEvent.semester === (activeEvent.semester || '') &&
      selectedEvent.status === activeEvent.status
    ) {
      return;
    }

    setSelectedEvent({
      id: activeEvent.id,
      title: activeEvent.title,
      semester: activeEvent.semester || '',
      status: activeEvent.status,
    });
  }, [activeEvent, selectedEvent, setSelectedEvent]);

  const workshopsQuery = useQuery({
    queryKey: queryKeys.workshops.list({ eventId: activeEvent?.id }),
    enabled: Boolean(activeEvent?.id),
    queryFn: () => workshopsApi.list({ eventId: activeEvent?.id }),
  });

  const workshops = workshopsQuery.data?.data || workshopsQuery.data || [];

  const workshopQuestionsQuery = useQuery({
    queryKey: queryKeys.workshops.questions(selectedWorkshop?.id, { page: 1, limit: 50 }),
    enabled: (isDetailOpen || isQuestionsOpen) && Boolean(selectedWorkshop?.id),
    queryFn: () => workshopsApi.listQuestions(selectedWorkshop!.id, { page: 1, limit: 50 }),
  });

  const workshopQuestions = workshopQuestionsQuery.data?.data || workshopQuestionsQuery.data || [];
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
    activeEvent,
    events,
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
    voteQuestionMutation,
    canVoteQuestion,
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
    setSelectedEventId,
  };
}
