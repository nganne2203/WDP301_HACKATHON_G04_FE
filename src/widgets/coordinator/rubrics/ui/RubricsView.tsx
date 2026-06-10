import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/event/api';
import { roundsApi } from '@/entities/round/api';
import { rubricsApi } from '@/entities/rubric/api';
import { useStore } from '@/entities/session/model/store';
import { ApiError } from '@/shared/api/client';
import type {
  CreateCriterionRequest,
  CreateRubricRequest,
  Criterion,
  Round,
  Rubric,
  RubricStatus,
  UpdateCriterionRequest,
  UpdateRubricRequest,
} from '@/shared/api/types';
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
import { Card } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Textarea } from '@/shared/ui/textarea';

const rubricStatusOptions: RubricStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];

interface RubricFormState {
  title: string;
  description: string;
  roundId: string;
  version: string;
  status: RubricStatus;
}

interface CriterionFormState {
  name: string;
  description: string;
  maxScore: string;
  weight: string;
  order: string;
  judgeOnly: boolean;
  aiSupportForAudit: boolean;
  aiInstruction: string;
}

function createRubricForm(): RubricFormState {
  return {
    title: '',
    description: '',
    roundId: 'none',
    version: '1',
    status: 'DRAFT',
  };
}

function createCriterionForm(): CriterionFormState {
  return {
    name: '',
    description: '',
    maxScore: '',
    weight: '1',
    order: '',
    judgeOnly: false,
    aiSupportForAudit: true,
    aiInstruction: '',
  };
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Please try again.';
}

function mapRubricToForm(rubric: Rubric): RubricFormState {
  return {
    title: rubric.title,
    description: rubric.description || '',
    roundId: rubric.roundId || 'none',
    version: String(rubric.version || 1),
    status: rubric.status || 'DRAFT',
  };
}

function mapCriterionToForm(criterion: Criterion): CriterionFormState {
  return {
    name: criterion.name,
    description: criterion.description || '',
    maxScore: String(criterion.maxScore),
    weight: String(criterion.weight),
    order: criterion.order ? String(criterion.order) : '',
    judgeOnly: Boolean(criterion.judgeOnly),
    aiSupportForAudit: criterion.aiSupportForAudit !== false,
    aiInstruction: criterion.aiInstruction || '',
  };
}

function buildRubricPayload(form: RubricFormState, eventId: string): CreateRubricRequest {
  return {
    eventId,
    title: form.title.trim(),
    description: normalizeText(form.description),
    roundId: form.roundId === 'none' ? null : form.roundId,
    version: Number(form.version || 1),
    status: form.status,
  };
}

function buildRubricUpdatePayload(form: RubricFormState): UpdateRubricRequest {
  return {
    title: form.title.trim(),
    description: normalizeText(form.description),
    version: Number(form.version || 1),
    status: form.status,
  };
}

function buildCriterionPayload(form: CriterionFormState): CreateCriterionRequest {
  return {
    name: form.name.trim(),
    description: normalizeText(form.description),
    maxScore: Number(form.maxScore),
    weight: Number(form.weight || 1),
    order: form.order ? Number(form.order) : undefined,
    judgeOnly: form.judgeOnly,
    aiSupportForAudit: form.aiSupportForAudit,
    aiInstruction: normalizeText(form.aiInstruction),
  };
}

function buildCriterionUpdatePayload(form: CriterionFormState): UpdateCriterionRequest {
  return buildCriterionPayload(form);
}

export function Rubrics() {
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
    onSuccess: (response) => {
      toast.success('Rubric created', { description: `${response.data.title} has been created.` });
      queryClient.invalidateQueries({ queryKey: ['coordinator-rubrics'] });
      setCreateOpen(false);
      setCreateForm(createRubricForm());
    },
    onError: (error: unknown) => toast.error('Failed to create rubric', { description: getErrorMessage(error) }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRubricRequest }) => rubricsApi.update(id, payload),
    onSuccess: (response) => {
      toast.success('Rubric updated', { description: `${response.data.title} has been updated.` });
      queryClient.invalidateQueries({ queryKey: ['coordinator-rubrics'] });
      if (selectedRubric?.id === response.data.id) setSelectedRubric(response.data);
      setEditOpen(false);
    },
    onError: (error: unknown) => toast.error('Failed to update rubric', { description: getErrorMessage(error) }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rubricsApi.delete(id),
    onSuccess: () => {
      toast.success('Rubric deleted');
      queryClient.invalidateQueries({ queryKey: ['coordinator-rubrics'] });
      setDeleteOpen(false);
      setSelectedRubric(null);
    },
    onError: (error: unknown) => toast.error('Failed to delete rubric', { description: getErrorMessage(error) }),
  });

  const createCriterionMutation = useMutation({
    mutationFn: ({ rubricId, payload }: { rubricId: string; payload: CreateCriterionRequest }) =>
      rubricsApi.createCriterion(rubricId, payload),
    onSuccess: (response) => {
      toast.success('Criterion added');
      queryClient.invalidateQueries({ queryKey: ['coordinator-rubrics'] });
      setSelectedRubric(response.data.rubric);
      setCriterionForm(createCriterionForm());
    },
    onError: (error: unknown) => toast.error('Failed to add criterion', { description: getErrorMessage(error) }),
  });

  const updateCriterionMutation = useMutation({
    mutationFn: ({ rubricId, criterionId, payload }: { rubricId: string; criterionId: string; payload: UpdateCriterionRequest }) =>
      rubricsApi.updateCriterion(rubricId, criterionId, payload),
    onSuccess: (response) => {
      toast.success('Criterion updated');
      queryClient.invalidateQueries({ queryKey: ['coordinator-rubrics'] });
      setSelectedRubric(response.data.rubric);
      setEditingCriterion(null);
      setCriterionForm(createCriterionForm());
    },
    onError: (error: unknown) => toast.error('Failed to update criterion', { description: getErrorMessage(error) }),
  });

  const deleteCriterionMutation = useMutation({
    mutationFn: ({ rubricId, criterionId }: { rubricId: string; criterionId: string }) =>
      rubricsApi.deleteCriterion(rubricId, criterionId),
    onSuccess: (response) => {
      toast.success('Criterion deleted');
      queryClient.invalidateQueries({ queryKey: ['coordinator-rubrics'] });
      setSelectedRubric(response.data.rubric);
      setEditingCriterion(null);
      setCriterionForm(createCriterionForm());
    },
    onError: (error: unknown) => toast.error('Failed to delete criterion', { description: getErrorMessage(error) }),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Rubrics Management</h1>
          <p className="text-sm text-muted-foreground">
            Create scoring rubrics, attach them to rounds, and manage weighted criteria.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="w-full sm:w-72">
            <Select value={activeEvent?.id || ''} onValueChange={setSelectedEventId} disabled={eventsQuery.isLoading}>
              <SelectTrigger>
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
          <div className="w-full sm:w-72">
            <Select value={selectedRoundFilter} onValueChange={setSelectedRoundFilter} disabled={!activeEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rounds</SelectItem>
                {rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    {round.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) setCreateForm(createRubricForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!activeEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Create Rubric
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Rubric</DialogTitle>
                <DialogDescription>Create a reusable rubric for {activeEvent?.title || 'the selected event'}.</DialogDescription>
              </DialogHeader>
              <RubricForm form={createForm} onChange={setCreateForm} rounds={rounds} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => activeEvent && createMutation.mutate(buildRubricPayload(createForm, activeEvent.id))}
                  disabled={createMutation.isPending || !createForm.title.trim()}
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Rubric'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(eventsQuery.error || roundsQuery.error || rubricsQuery.error) && (
        <Alert>
          <AlertTitle>Could not load rubric data</AlertTitle>
          <AlertDescription>{getErrorMessage(eventsQuery.error || roundsQuery.error || rubricsQuery.error)}</AlertDescription>
        </Alert>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rubric</TableHead>
              <TableHead>Round</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criteria</TableHead>
              <TableHead>Total Score</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(eventsQuery.isLoading || rubricsQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading rubrics...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!eventsQuery.isLoading && !rubricsQuery.isLoading && rubrics.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No rubrics found for this filter.
                </TableCell>
              </TableRow>
            )}

            {rubrics.map((rubric) => (
              <TableRow key={rubric.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{rubric.title}</p>
                      <p className="text-xs text-muted-foreground">v{rubric.version || 1}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{rubric.round?.name || 'Reusable'}</TableCell>
                <TableCell>
                  <Badge variant={rubric.status === 'ACTIVE' ? 'default' : rubric.status === 'ARCHIVED' ? 'secondary' : 'outline'}>
                    {rubric.status || 'DRAFT'}
                  </Badge>
                </TableCell>
                <TableCell>{rubric.criteria.length}</TableCell>
                <TableCell>{rubric.totalScore ?? 0}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedRubric(rubric);
                          setCriteriaOpen(true);
                          setEditingCriterion(null);
                          setCriterionForm(createCriterionForm());
                        }}
                      >
                        Manage criteria
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedRubric(rubric);
                          setEditForm(mapRubricToForm(rubric));
                          setEditOpen(true);
                        }}
                      >
                        Edit rubric
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedRubric(rubric);
                          setDeleteOpen(true);
                        }}
                      >
                        Delete rubric
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Rubric</DialogTitle>
            <DialogDescription>Update rubric metadata. Criteria are managed separately.</DialogDescription>
          </DialogHeader>
          <RubricForm form={editForm} onChange={setEditForm} rounds={rounds} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedRubric && updateMutation.mutate({ id: selectedRubric.id, payload: buildRubricUpdatePayload(editForm) })}
              disabled={updateMutation.isPending || !editForm.title.trim()}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={criteriaOpen} onOpenChange={setCriteriaOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRubric?.title || 'Rubric Criteria'}</DialogTitle>
            <DialogDescription>Maintain detailed scoring criteria for judges.</DialogDescription>
          </DialogHeader>
          {selectedRubric && (
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-3">
                {selectedRubric.criteria.length === 0 && (
                  <p className="text-sm text-muted-foreground">No criteria yet. Add one from the form on the right.</p>
                )}
                {selectedRubric.criteria.map((criterion) => (
                  <div key={criterion.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{criterion.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Max {criterion.maxScore} · Weight {criterion.weight} · Order {criterion.order || '-'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingCriterion(criterion);
                            setCriterionForm(mapCriterionToForm(criterion));
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteCriterionMutation.isPending}
                          onClick={() => deleteCriterionMutation.mutate({ rubricId: selectedRubric.id, criterionId: criterion.id })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {criterion.description && <p className="text-sm text-muted-foreground">{criterion.description}</p>}
                    {criterion.aiInstruction && (
                      <div className="rounded-md bg-slate-50 p-3 text-xs text-muted-foreground">
                        {criterion.aiInstruction}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={criterion.judgeOnly ? 'secondary' : 'outline'}>
                        {criterion.judgeOnly ? 'Judge only' : 'Visible'}
                      </Badge>
                      <Badge variant={criterion.aiSupportForAudit ? 'default' : 'outline'}>
                        {criterion.aiSupportForAudit ? 'AI audit enabled' : 'AI audit off'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div>
                  <h3 className="font-medium">{editingCriterion ? 'Edit Criterion' : 'Add Criterion'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {editingCriterion ? 'Update the selected criterion.' : 'Create a new criterion for this rubric.'}
                  </p>
                </div>
                <CriterionForm form={criterionForm} onChange={setCriterionForm} />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      if (!selectedRubric) return;
                      if (editingCriterion) {
                        updateCriterionMutation.mutate({
                          rubricId: selectedRubric.id,
                          criterionId: editingCriterion.id,
                          payload: buildCriterionUpdatePayload(criterionForm),
                        });
                        return;
                      }

                      createCriterionMutation.mutate({
                        rubricId: selectedRubric.id,
                        payload: buildCriterionPayload(criterionForm),
                      });
                    }}
                    disabled={
                      createCriterionMutation.isPending ||
                      updateCriterionMutation.isPending ||
                      !criterionForm.name.trim() ||
                      !criterionForm.maxScore
                    }
                  >
                    {(createCriterionMutation.isPending || updateCriterionMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingCriterion ? 'Save Criterion' : 'Add Criterion'}
                  </Button>
                  {editingCriterion && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingCriterion(null);
                        setCriterionForm(createCriterionForm());
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rubric</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{selectedRubric?.title}"? This removes it from future FE selections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => selectedRubric && deleteMutation.mutate(selectedRubric.id)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RubricForm({
  form,
  onChange,
  rounds,
}: {
  form: RubricFormState;
  onChange: Dispatch<SetStateAction<RubricFormState>>;
  rounds: Round[];
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="rubric-title">Title</Label>
        <Input
          id="rubric-title"
          value={form.title}
          onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
          placeholder="Final Presentation Rubric"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rubric-description">Description</Label>
        <Textarea
          id="rubric-description"
          rows={4}
          value={form.description}
          onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Round</Label>
          <Select value={form.roundId} onValueChange={(value) => onChange((current) => ({ ...current, roundId: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Reusable across rounds</SelectItem>
              {rounds.map((round) => (
                <SelectItem key={round.id} value={round.id}>
                  {round.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rubric-version">Version</Label>
          <Input
            id="rubric-version"
            type="number"
            min="1"
            value={form.version}
            onChange={(event) => onChange((current) => ({ ...current, version: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(value: RubricStatus) => onChange((current) => ({ ...current, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rubricStatusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function CriterionForm({
  form,
  onChange,
}: {
  form: CriterionFormState;
  onChange: Dispatch<SetStateAction<CriterionFormState>>;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="criterion-name">Name</Label>
        <Input
          id="criterion-name"
          value={form.name}
          onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
          placeholder="Technical quality"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="criterion-description">Description</Label>
        <Textarea
          id="criterion-description"
          rows={3}
          value={form.description}
          onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="criterion-max-score">Max Score</Label>
          <Input
            id="criterion-max-score"
            type="number"
            min="0"
            value={form.maxScore}
            onChange={(event) => onChange((current) => ({ ...current, maxScore: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="criterion-weight">Weight</Label>
          <Input
            id="criterion-weight"
            type="number"
            min="0"
            value={form.weight}
            onChange={(event) => onChange((current) => ({ ...current, weight: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="criterion-order">Order</Label>
          <Input
            id="criterion-order"
            type="number"
            min="1"
            value={form.order}
            onChange={(event) => onChange((current) => ({ ...current, order: event.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="criterion-ai-instruction">AI Instruction</Label>
        <Textarea
          id="criterion-ai-instruction"
          rows={3}
          value={form.aiInstruction}
          onChange={(event) => onChange((current) => ({ ...current, aiInstruction: event.target.value }))}
        />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <Checkbox checked={form.judgeOnly} onCheckedChange={(checked) => onChange((current) => ({ ...current, judgeOnly: checked === true }))} />
        Judge-only criterion
      </label>
      <label className="flex items-center gap-3 text-sm">
        <Checkbox checked={form.aiSupportForAudit} onCheckedChange={(checked) => onChange((current) => ({ ...current, aiSupportForAudit: checked === true }))} />
        Enable AI audit support
      </label>
    </div>
  );
}
