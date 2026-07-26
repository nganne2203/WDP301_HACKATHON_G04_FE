import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rubricsApi } from '@/entities/rubric/api';
import { useStore } from '@/entities/session/model/store';
import { useCompetitionsQuery, useRoundsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type {
  Competition,
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

const readOnlyCompetitionStatuses = new Set(['COMPLETED', 'ARCHIVED']);

function isCompletedCompetition(competition?: Pick<Competition, 'status'> | { status?: string | null } | null) {
  return readOnlyCompetitionStatuses.has(String(competition?.status || '').toUpperCase());
}

export function useRubricsView() {
  const queryClient = useQueryClient();
  const selectedCompetition = useStore((state) => state.selectedCompetition);
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

  const eventsQuery = useCompetitionsQuery();

  const competitions = eventsQuery.data || [];
  const activeCompetition = useMemo(() => {
    if (!competitions.length) return null;
    return competitions.find((competition) => competition.id === selectedCompetition?.id) || competitions[0];
  }, [competitions, selectedCompetition?.id]);

  const roundsQuery = useRoundsQuery({ competitionId: activeCompetition?.id, limit: 10 }, { enabled: Boolean(activeCompetition?.id) });

  const rubricsQuery = useQuery({
    queryKey: queryKeys.rubrics.list({
      competitionId: activeCompetition?.id,
      roundId: selectedRoundFilter === 'all' ? undefined : selectedRoundFilter,
      limit: 10,
    }),
    enabled: Boolean(activeCompetition?.id),
    queryFn: async () =>
      (await rubricsApi.list({
        competitionId: activeCompetition?.id,
        roundId: selectedRoundFilter === 'all' ? undefined : selectedRoundFilter,
        limit: 10,
      })).data,
  });

  const rounds = roundsQuery.data || [];
  const rubrics = rubricsQuery.data || [];
  const rubricsReadOnly = isCompletedCompetition(activeCompetition);

  const isRubricReadOnly = (rubric?: Rubric | null) =>
    isCompletedCompetition(rubric?.competition) || rubricsReadOnly;

  const notifyReadOnly = () => {
    toast.info('Rubrics are read-only', {
      description: 'This competition has been completed, so rubrics can only be viewed.',
    });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateRubricRequest) => rubricsApi.create(payload),
    onSuccess: async (response) => {
      toast.success('Rubric created', { description: `${response.data.title} has been created.` });
      setCreateOpen(false);
      setCreateForm(createRubricForm());
      await queryClient.invalidateQueries({ queryKey: queryKeys.rubrics.lists() });
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.rubrics.lists() });
    },
    onError: (error: unknown) => toast.error('Failed to update rubric', { description: getRubricErrorMessage(error) }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rubricsApi.delete(id),
    onSuccess: async () => {
      toast.success('Rubric deleted');
      setDeleteOpen(false);
      setSelectedRubric(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.rubrics.lists() });
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.rubrics.lists() });
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.rubrics.lists() });
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.rubrics.lists() });
    },
    onError: (error: unknown) => toast.error('Failed to delete criterion', { description: getRubricErrorMessage(error) }),
  });

  const openCreateDialog = (open: boolean) => {
    if (open && rubricsReadOnly) {
      notifyReadOnly();
      return;
    }
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
    if (isRubricReadOnly(rubric)) {
      notifyReadOnly();
      return;
    }
    setSelectedRubric(rubric);
    setEditForm(mapRubricToForm(rubric));
    setEditOpen(true);
  };

  const openDeleteDialog = (rubric: Rubric) => {
    if (isRubricReadOnly(rubric)) {
      notifyReadOnly();
      return;
    }
    setSelectedRubric(rubric);
    setDeleteOpen(true);
  };

  const submitCreate = () => {
    if (!activeCompetition) return;
    if (rubricsReadOnly) {
      notifyReadOnly();
      return;
    }
    createMutation.mutate(buildRubricPayload(createForm, activeCompetition.id));
  };

  const submitEdit = () => {
    if (!selectedRubric) return;
    if (isRubricReadOnly(selectedRubric)) {
      notifyReadOnly();
      return;
    }
    updateMutation.mutate({
      id: selectedRubric.id,
      payload: buildRubricUpdatePayload(editForm),
    });
  };

  const submitDelete = () => {
    if (!selectedRubric) return;
    if (isRubricReadOnly(selectedRubric)) {
      notifyReadOnly();
      return;
    }
    deleteMutation.mutate(selectedRubric.id);
  };

  const submitCreateCriterion = (rubricId: string, form: CriterionFormState) => {
    if (isRubricReadOnly(selectedRubric)) {
      notifyReadOnly();
      return;
    }
    createCriterionMutation.mutate({
      rubricId,
      payload: buildCriterionPayload(form),
    });
  };

  const submitUpdateCriterion = (rubricId: string, criterionId: string, form: CriterionFormState) => {
    if (isRubricReadOnly(selectedRubric)) {
      notifyReadOnly();
      return;
    }
    updateCriterionMutation.mutate({
      rubricId,
      criterionId,
      payload: buildCriterionUpdatePayload(form),
    });
  };

  const submitDeleteCriterion = (rubricId: string, criterionId: string) => {
    if (isRubricReadOnly(selectedRubric)) {
      notifyReadOnly();
      return;
    }
    deleteCriterionMutation.mutate({ rubricId, criterionId });
  };

  return {
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
    competitions,
    rounds,
    rubrics,
    activeCompetition,
    rubricsReadOnly,
    isRubricReadOnly,
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
