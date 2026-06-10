import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/event/api';
import { roundsApi } from '@/entities/round/api';
import { rubricsApi } from '@/entities/rubric/api';
import { useStore } from '@/entities/session/model/store';
import type {
  CreateCriterionRequest,
  CreateRubricRequest,
  Criterion,
  Rubric,
  UpdateCriterionRequest,
  UpdateRubricRequest,
} from '@/shared/api/types';

import {
  buildCriterionPayload,
  buildCriterionUpdatePayload,
  buildRubricPayload,
  buildRubricUpdatePayload,
  createCriterionForm,
  createRubricForm,
  type CriterionFormState,
  getRubricErrorMessage,
  mapRubricToForm,
  type RubricFormState,
} from './rubric-form';

export function useRubricsView() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRoundFilter, setSelectedRoundFilter] = useState('all');
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createForm, setCreateForm] = useState<RubricFormState>(createRubricForm());
  const [editForm, setEditForm] = useState<RubricFormState>(createRubricForm());
  const [criterionForm, setCriterionForm] = useState<CriterionFormState>(createCriterionForm());

  const eventsQuery = useQuery({
    queryKey: ['coordinator-rubric-events'],
    queryFn: async () => (await eventsApi.list({ page: 1, limit: 100 })).data,
  });

  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return (
      events.find((event) => event.id === selectedEventId) ||
      events.find((event) => event.id === selectedEvent?.id) ||
      events[0]
    );
  }, [events, selectedEventId, selectedEvent?.id]);

  const roundsQuery = useQuery({
    queryKey: ['coordinator-rubric-rounds', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => (await roundsApi.list({ eventId: activeEvent?.id, limit: 100 })).data,
  });

  const rubricsQuery = useQuery({
    queryKey: ['coordinator-rubrics', activeEvent?.id, selectedRoundFilter],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () =>
      (await rubricsApi.list({
        eventId: activeEvent?.id,
        roundId: selectedRoundFilter === 'all' ? undefined : selectedRoundFilter,
        limit: 100,
      })).data,
  });

  const rounds = roundsQuery.data || [];
  const rubrics = rubricsQuery.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateRubricRequest) => rubricsApi.create(payload),
    onSuccess: async (response) => {
      toast.success('Rubric created', { description: `${response.data.title} has been created.` });
      setCreateOpen(false);
      setCreateForm(createRubricForm());
      await queryClient.invalidateQueries({ queryKey: ['coordinator-rubrics'] });
    },
    onError: (error: unknown) => toast.error('Failed to create rubric', { description: getRubricErrorMessage(error) }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRubricRequest }) => rubricsApi.update(id, payload),
    onSuccess: async (response) => {
      toast.success('Rubric updated', { description: `${response.data.title} has been updated.` });
      if (selectedRubric?.id === response.data.id) {
        setSelectedRubric(response.data);
      }
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['coordinator-rubrics'] });
    },
    onError: (error: unknown) => toast.error('Failed to update rubric', { description: getRubricErrorMessage(error) }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rubricsApi.delete(id),
    onSuccess: async () => {
      toast.success('Rubric deleted');
      setDeleteOpen(false);
      setSelectedRubric(null);
      await queryClient.invalidateQueries({ queryKey: ['coordinator-rubrics'] });
    },
    onError: (error: unknown) => toast.error('Failed to delete rubric', { description: getRubricErrorMessage(error) }),
  });

  const createCriterionMutation = useMutation({
    mutationFn: ({ rubricId, payload }: { rubricId: string; payload: CreateCriterionRequest }) =>
      rubricsApi.createCriterion(rubricId, payload),
    onSuccess: async (response) => {
      toast.success('Criterion added');
      setSelectedRubric(response.data.rubric);
      setCriterionForm(createCriterionForm());
      await queryClient.invalidateQueries({ queryKey: ['coordinator-rubrics'] });
    },
    onError: (error: unknown) => toast.error('Failed to add criterion', { description: getRubricErrorMessage(error) }),
  });

  const updateCriterionMutation = useMutation({
    mutationFn: ({ rubricId, criterionId, payload }: { rubricId: string; criterionId: string; payload: UpdateCriterionRequest }) =>
      rubricsApi.updateCriterion(rubricId, criterionId, payload),
    onSuccess: async (response) => {
      toast.success('Criterion updated');
      setSelectedRubric(response.data.rubric);
      setEditingCriterion(null);
      setCriterionForm(createCriterionForm());
      await queryClient.invalidateQueries({ queryKey: ['coordinator-rubrics'] });
    },
    onError: (error: unknown) => toast.error('Failed to update criterion', { description: getRubricErrorMessage(error) }),
  });

  const deleteCriterionMutation = useMutation({
    mutationFn: ({ rubricId, criterionId }: { rubricId: string; criterionId: string }) =>
      rubricsApi.deleteCriterion(rubricId, criterionId),
    onSuccess: async (response) => {
      toast.success('Criterion deleted');
      setSelectedRubric(response.data.rubric);
      setEditingCriterion(null);
      setCriterionForm(createCriterionForm());
      await queryClient.invalidateQueries({ queryKey: ['coordinator-rubrics'] });
    },
    onError: (error: unknown) => toast.error('Failed to delete criterion', { description: getRubricErrorMessage(error) }),
  });

  const openCreateDialog = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setCreateForm(createRubricForm());
    }
  };

  const openCriteriaDialog = (rubric: Rubric) => {
    setSelectedRubric(rubric);
    setCriteriaOpen(true);
    setEditingCriterion(null);
    setCriterionForm(createCriterionForm());
  };

  const openEditDialog = (rubric: Rubric) => {
    setSelectedRubric(rubric);
    setEditForm(mapRubricToForm(rubric));
    setEditOpen(true);
  };

  const openDeleteDialog = (rubric: Rubric) => {
    setSelectedRubric(rubric);
    setDeleteOpen(true);
  };

  const submitCreate = () => {
    if (!activeEvent) return;
    createMutation.mutate(buildRubricPayload(createForm, activeEvent.id));
  };

  const submitEdit = () => {
    if (!selectedRubric) return;
    updateMutation.mutate({
      id: selectedRubric.id,
      payload: buildRubricUpdatePayload(editForm),
    });
  };

  const submitDelete = () => {
    if (!selectedRubric) return;
    deleteMutation.mutate(selectedRubric.id);
  };

  const submitCreateCriterion = (rubricId: string, form: CriterionFormState) => {
    createCriterionMutation.mutate({
      rubricId,
      payload: buildCriterionPayload(form),
    });
  };

  const submitUpdateCriterion = (rubricId: string, criterionId: string, form: CriterionFormState) => {
    updateCriterionMutation.mutate({
      rubricId,
      criterionId,
      payload: buildCriterionUpdatePayload(form),
    });
  };

  const submitDeleteCriterion = (rubricId: string, criterionId: string) => {
    deleteCriterionMutation.mutate({ rubricId, criterionId });
  };

  return {
    selectedEventId,
    setSelectedEventId,
    selectedRoundFilter,
    setSelectedRoundFilter,
    selectedRubric,
    editingCriterion,
    setEditingCriterion,
    createOpen,
    editOpen,
    setEditOpen,
    criteriaOpen,
    setCriteriaOpen,
    deleteOpen,
    setDeleteOpen,
    createForm,
    setCreateForm,
    editForm,
    setEditForm,
    criterionForm,
    setCriterionForm,
    eventsQuery,
    roundsQuery,
    rubricsQuery,
    events,
    rounds,
    rubrics,
    activeEvent,
    createMutation,
    updateMutation,
    deleteMutation,
    createCriterionMutation,
    updateCriterionMutation,
    deleteCriterionMutation,
    openCreateDialog,
    openCriteriaDialog,
    openEditDialog,
    openDeleteDialog,
    submitCreate,
    submitEdit,
    submitDelete,
    submitCreateCriterion,
    submitUpdateCriterion,
    submitDeleteCriterion,
    getRubricErrorMessage,
  };
}
