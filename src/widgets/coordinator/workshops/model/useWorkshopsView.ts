import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { workshopsApi } from '@/shared/api';
import { useEventsQuery, useTimelinesQuery, useUsersQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import type { Workshop } from '@/shared/api/types';
import type { CreateWorkshopRequest, UpdateWorkshopRequest } from '@/shared/api/workshops';

import {
  buildWorkshopPayload,
  buildWorkshopUpdatePayload,
  createEmptyWorkshopForm,
  isWorkshopPresenterCandidate,
  mapWorkshopToForm,
  type WorkshopFormState,
} from './workshop-form';

export function useWorkshopsView() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [selectedQuestionsWorkshop, setSelectedQuestionsWorkshop] = useState<Workshop | null>(null);
  const [selectedReviewsWorkshop, setSelectedReviewsWorkshop] = useState<Workshop | null>(null);
  const [questionContent, setQuestionContent] = useState('');
  const [createForm, setCreateForm] = useState<WorkshopFormState>(createEmptyWorkshopForm());
  const [editForm, setEditForm] = useState<WorkshopFormState>(createEmptyWorkshopForm());
  const canCreateWorkshopQuestions = useStore((state) => state.hasPermission('WORKSHOP_QUESTION_CREATE'));
  const canVoteWorkshopQuestions = useStore((state) => state.hasPermission('WORKSHOP_QUESTION_VOTE'));
  const canViewWorkshopRatings = useStore((state) => state.hasPermission('WORKSHOP_RATING_VIEW'));
  const canViewWorkshopFeedback = useStore((state) => state.hasPermission('WORKSHOP_FEEDBACK_VIEW'));

  const eventsQuery = useEventsQuery();

  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events.find((event) => event.id === selectedEvent?.id) || events[0];
  }, [events, selectedEventId, selectedEvent?.id]);

  const workshopsQuery = useQuery({
    queryKey: queryKeys.workshops.list({ eventId: activeEvent?.id, page, limit: 10 }),
    enabled: Boolean(activeEvent?.id),
    queryFn: () => workshopsApi.list({ eventId: activeEvent?.id, page, limit: 10 }),
  });


  const workshopTimelinesQuery = useTimelinesQuery(
    {
      eventId: activeEvent?.id,
      eventType: 'WORKSHOP',
      page: 1,
      limit: 10,
    },
    { enabled: Boolean(activeEvent?.id) }
  );

  const presenterUsersQuery = useUsersQuery({ page: 1, limit: 100 });

  const workshops = workshopsQuery.data?.data || [];
  const pagination = workshopsQuery.data?.pagination;
  const workshopTimelines = workshopTimelinesQuery.data || [];
  const presenterUsers = useMemo(() => {
    return (presenterUsersQuery.data?.data || [])
      .filter(isWorkshopPresenterCandidate)
      .sort((first, second) => (first.fullName || first.email).localeCompare(second.fullName || second.email));
  }, [presenterUsersQuery.data?.data]);
  const workshopQuestionsQuery = useQuery({
    queryKey: queryKeys.workshops.questions(selectedQuestionsWorkshop?.id, { page: 1, limit: 50 }),
    enabled: questionsOpen && Boolean(selectedQuestionsWorkshop?.id),
    queryFn: () => workshopsApi.listQuestions(selectedQuestionsWorkshop!.id, { page: 1, limit: 50 }),
  });

  const workshopRatingsQuery = useQuery({
    queryKey: queryKeys.workshops.ratings(selectedReviewsWorkshop?.id, { page: 1, limit: 100 }),
    enabled: reviewsOpen && Boolean(selectedReviewsWorkshop?.id) && canViewWorkshopRatings,
    queryFn: () => workshopsApi.listRatings(selectedReviewsWorkshop!.id, { page: 1, limit: 100 }),
  });

  const workshopFeedbackQuery = useQuery({
    queryKey: queryKeys.workshops.feedback(selectedReviewsWorkshop?.id, { page: 1, limit: 100 }),
    enabled: reviewsOpen && Boolean(selectedReviewsWorkshop?.id) && canViewWorkshopFeedback,
    queryFn: () => workshopsApi.listFeedback(selectedReviewsWorkshop!.id, { page: 1, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateWorkshopRequest) => workshopsApi.create(payload),
    onSuccess: (response) => {
      toast.success('Workshop created', { description: `${response.data.title} has been scheduled.` });
      queryClient.invalidateQueries({ queryKey: queryKeys.workshops.lists() });
      setCreateOpen(false);
      setCreateForm(createEmptyWorkshopForm());
    },
    onError: (error: unknown) => {
      toast.error('Failed to create workshop', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWorkshopRequest }) => workshopsApi.update(id, payload),
    onSuccess: (response) => {
      toast.success('Workshop updated', { description: `${response.data.title} has been updated.` });
      queryClient.invalidateQueries({ queryKey: queryKeys.workshops.lists() });
      setEditOpen(false);
      setSelectedWorkshop(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update workshop', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workshopsApi.delete(id),
    onSuccess: () => {
      toast.success('Workshop deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.workshops.lists() });
      setDeleteOpen(false);
      setSelectedWorkshop(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete workshop', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const voteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => workshopsApi.voteQuestion(questionId),
    onSuccess: () => {
      toast.success('Question vote recorded');
      if (selectedQuestionsWorkshop?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.workshops.questions(selectedQuestionsWorkshop.id, { page: 1, limit: 50 }),
        });
      }
    },
    onError: (error: unknown) => {
      toast.error('Failed to vote question', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: ({ workshopId, content }: { workshopId: string; content: string }) =>
      workshopsApi.createQuestion(workshopId, { content }),
    onSuccess: () => {
      toast.success('Question submitted');
      setQuestionContent('');
      if (selectedQuestionsWorkshop?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.workshops.questions(selectedQuestionsWorkshop.id, { page: 1, limit: 50 }),
        });
      }
    },
    onError: (error: unknown) => {
      toast.error('Failed to submit question', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const handleCreate = () => {
    if (!activeEvent?.id) return;
    if (!createForm.title.trim()) {
      toast.error('Workshop title is required');
      return;
    }
    if (!createForm.startTime || !createForm.endTime) {
      toast.error('Start time and end time are required');
      return;
    }
    createMutation.mutate(buildWorkshopPayload(createForm, activeEvent.id));
  };

  const handleUpdate = () => {
    if (!selectedWorkshop) return;
    if (!editForm.title.trim()) {
      toast.error('Workshop title is required');
      return;
    }
    if (!editForm.startTime || !editForm.endTime) {
      toast.error('Start time and end time are required');
      return;
    }
    updateMutation.mutate({
      id: selectedWorkshop.id,
      payload: buildWorkshopUpdatePayload(editForm),
    });
  };

  const openEditDialog = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setEditForm(mapWorkshopToForm(workshop));
    setEditOpen(true);
  };

  const openQuestionsDialog = (workshop: Workshop) => {
    setSelectedQuestionsWorkshop(workshop);
    setQuestionContent('');
    setQuestionsOpen(true);
  };

  const openReviewsDialog = (workshop: Workshop) => {
    setSelectedReviewsWorkshop(workshop);
    setReviewsOpen(true);
  };

  const canSubmitWorkshopQuestion = selectedQuestionsWorkshop ? canSubmitQuestionForWorkshop(selectedQuestionsWorkshop) : false;

  const handleCreateQuestion = () => {
    const content = questionContent.trim();
    if (!selectedQuestionsWorkshop || content.length < 2 || !canCreateWorkshopQuestions || !canSubmitWorkshopQuestion) return;

    createQuestionMutation.mutate({
      workshopId: selectedQuestionsWorkshop.id,
      content,
    });
  };

  const liveCount = workshops.filter((workshop) => workshop.status === 'LIVE').length;
  const completedCount = workshops.filter((workshop) => workshop.status === 'COMPLETED').length;

  return {
    activeEvent,
    completedCount,
    createForm,
    createMutation,
    createOpen,
    deleteMutation,
    deleteOpen,
    editForm,
    editOpen,
    events,
    eventsQuery,
    handleCreate,
    handleCreateQuestion,
    handleUpdate,
    liveCount,
    openEditDialog,
    openQuestionsDialog,
    openReviewsDialog,
    questionsOpen,
    reviewsOpen,
    selectedWorkshop,
    selectedQuestionsWorkshop,
    selectedReviewsWorkshop,
    canCreateWorkshopQuestions,
    canSubmitWorkshopQuestion,
    canVoteWorkshopQuestions,
    canViewWorkshopFeedback,
    canViewWorkshopRatings,
    createQuestionMutation,
    questionContent,
    setCreateForm,
    setCreateOpen,
    setDeleteOpen,
    setEditForm,
    setEditOpen,
    setQuestionContent,
    setQuestionsOpen: (open: boolean) => {
      setQuestionsOpen(open);
      if (!open) {
        setSelectedQuestionsWorkshop(null);
        setQuestionContent('');
      }
    },
    setReviewsOpen: (open: boolean) => {
      setReviewsOpen(open);
      if (!open) {
        setSelectedReviewsWorkshop(null);
      }
    },
    setSelectedEventId: (eventId: string) => {
      setSelectedEventId(eventId);
      setPage(1);
    },
    page,
    pagination,
    presenterUsers,
    presenterUsersQuery,
    setPage,
    setSelectedWorkshop,
    workshopTimelines,
    workshopTimelinesQuery,
    workshops,
    workshopQuestions: workshopQuestionsQuery.data?.data || [],
    workshopQuestionsQuery,
    workshopRatings: workshopRatingsQuery.data?.data?.ratings || [],
    workshopRatingStats: workshopRatingsQuery.data?.data?.stats || { averageRating: 0, totalRatings: 0 },
    workshopRatingsQuery,
    workshopFeedback: workshopFeedbackQuery.data?.data || [],
    workshopFeedbackQuery,
    workshopsQuery,
    updateMutation,
    voteQuestionMutation,
  };
}

function canSubmitQuestionForWorkshop(workshop: Workshop) {
  const endTime = new Date(workshop.endTime);
  return ['SCHEDULED', 'LIVE'].includes(workshop.status) && !Number.isNaN(endTime.getTime()) && new Date() <= endTime;
}
