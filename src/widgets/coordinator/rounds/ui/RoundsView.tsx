import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Loader2, MoreVertical, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/event/api';
import { roundsApi } from '@/entities/round/api';
import { rubricsApi } from '@/entities/rubric/api';
import { teamsApi } from '@/entities/team/api';
import { tracksApi } from '@/entities/track/api';
import { usersApi } from '@/entities/user/api';
import { useStore } from '@/entities/session/model/store';
import { ApiError } from '@/shared/api/client';
import type {
  CreateRoundRequest,
  Round,
  RoundStatus,
  RoundType,
  Rubric,
  Team,
  Track,
  UpdateRoundRequest,
  User,
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

const roundTypeOptions: RoundType[] = ['PRELIMINARY', 'FINAL'];
const roundStatusOptions: RoundStatus[] = ['DRAFT', 'OPEN', 'CLOSED', 'SCORING', 'COMPLETED'];

interface RoundFormState {
  name: string;
  roundType: RoundType;
  trackId: string;
  rubricId: string;
  assignedTeamIds: string[];
  assignedJudgeIds: string[];
  startTime: string;
  endTime: string;
  submissionDeadline: string;
  publishTime: string;
  maxPromotedTeams: string;
  promotionRule: string;
  tieBreakRule: string;
  tieBreakDurationMinutes: string;
  status: RoundStatus;
}

function createEmptyForm(): RoundFormState {
  return {
    name: '',
    roundType: 'PRELIMINARY',
    trackId: 'none',
    rubricId: 'none',
    assignedTeamIds: [],
    assignedJudgeIds: [],
    startTime: '',
    endTime: '',
    submissionDeadline: '',
    publishTime: '',
    maxPromotedTeams: '',
    promotionRule: '',
    tieBreakRule: '',
    tieBreakDurationMinutes: '',
    status: 'DRAFT',
  };
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatDateTimeInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function formatDateTimeDisplay(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function mapRoundToForm(round: Round): RoundFormState {
  return {
    name: round.name,
    roundType: round.roundType,
    trackId: round.trackId || 'none',
    rubricId: round.rubricId || 'none',
    assignedTeamIds: round.assignedTeamIds || [],
    assignedJudgeIds: round.assignedJudgeIds || [],
    startTime: formatDateTimeInput(round.startTime),
    endTime: formatDateTimeInput(round.endTime),
    submissionDeadline: formatDateTimeInput(round.submissionDeadline),
    publishTime: formatDateTimeInput(round.publishTime),
    maxPromotedTeams: round.maxPromotedTeams ? String(round.maxPromotedTeams) : '',
    promotionRule: round.promotionRule || '',
    tieBreakRule: round.tieBreakRule || '',
    tieBreakDurationMinutes: round.tieBreakDurationMinutes ? String(round.tieBreakDurationMinutes) : '',
    status: round.status,
  };
}

function buildCreatePayload(form: RoundFormState, eventId: string): CreateRoundRequest {
  return {
    eventId,
    name: form.name.trim(),
    roundType: form.roundType,
    trackId: form.trackId === 'none' ? null : form.trackId,
    assignedTeamIds: form.assignedTeamIds,
    assignedJudgeIds: form.assignedJudgeIds,
    rubricId: form.rubricId === 'none' ? null : form.rubricId,
    startTime: form.startTime || null,
    endTime: form.endTime || null,
    submissionDeadline: form.submissionDeadline || null,
    publishTime: form.publishTime || null,
    maxPromotedTeams: form.maxPromotedTeams ? Number(form.maxPromotedTeams) : null,
    promotionRule: normalizeText(form.promotionRule),
    tieBreakRule: normalizeText(form.tieBreakRule),
    tieBreakDurationMinutes: form.tieBreakDurationMinutes ? Number(form.tieBreakDurationMinutes) : null,
    status: form.status,
  };
}

function buildUpdatePayload(form: RoundFormState): UpdateRoundRequest {
  return {
    name: form.name.trim(),
    roundType: form.roundType,
    trackId: form.trackId === 'none' ? null : form.trackId,
    assignedTeamIds: form.assignedTeamIds,
    assignedJudgeIds: form.assignedJudgeIds,
    rubricId: form.rubricId === 'none' ? null : form.rubricId,
    startTime: form.startTime || null,
    endTime: form.endTime || null,
    submissionDeadline: form.submissionDeadline || null,
    publishTime: form.publishTime || null,
    maxPromotedTeams: form.maxPromotedTeams ? Number(form.maxPromotedTeams) : null,
    promotionRule: normalizeText(form.promotionRule),
    tieBreakRule: normalizeText(form.tieBreakRule),
    tieBreakDurationMinutes: form.tieBreakDurationMinutes ? Number(form.tieBreakDurationMinutes) : null,
    status: form.status,
  };
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

function isJudgeUser(user: User) {
  const roleNames = user.roles.map((role) => role.name?.toUpperCase());
  return roleNames.includes('JUDGE') || roleNames.includes('ADMIN');
}

function filterTeamsByTrack(teams: Team[], trackId: string) {
  if (trackId === 'none') return teams;
  return teams.filter((team) => team.trackId === trackId);
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Please try again.';
}

export function Rounds() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [createForm, setCreateForm] = useState<RoundFormState>(createEmptyForm());
  const [editForm, setEditForm] = useState<RoundFormState>(createEmptyForm());

  const eventsQuery = useQuery({
    queryKey: ['coordinator-round-events'],
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
    queryKey: ['coordinator-rounds', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => (await roundsApi.list({ eventId: activeEvent?.id, limit: 100 })).data,
  });

  const tracksQuery = useQuery({
    queryKey: ['coordinator-round-tracks', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => (await tracksApi.list({ eventId: activeEvent?.id, limit: 100 })).data,
  });

  const rubricsQuery = useQuery({
    queryKey: ['coordinator-round-rubrics', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => (await rubricsApi.list({ eventId: activeEvent?.id, limit: 100 })).data,
  });

  const teamsQuery = useQuery({
    queryKey: ['coordinator-round-teams', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => (await teamsApi.list({ eventId: activeEvent?.id, limit: 100 })).data,
  });

  const judgesQuery = useQuery({
    queryKey: ['coordinator-round-judges'],
    queryFn: async () => (await usersApi.list({ page: 1, limit: 100 })).data,
  });

  const rounds = roundsQuery.data || [];
  const tracks = tracksQuery.data || [];
  const rubrics = rubricsQuery.data || [];
  const teams = teamsQuery.data || [];
  const judges = (judgesQuery.data || []).filter(isJudgeUser);

  const createMutation = useMutation({
    mutationFn: (payload: CreateRoundRequest) => roundsApi.create(payload),
    onSuccess: (response) => {
      toast.success('Round created', { description: `${response.data.name} has been added.` });
      queryClient.invalidateQueries({ queryKey: ['coordinator-rounds'] });
      setCreateOpen(false);
      setCreateForm(createEmptyForm());
    },
    onError: (error: unknown) => {
      toast.error('Failed to create round', { description: getErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoundRequest }) => roundsApi.update(id, payload),
    onSuccess: (response) => {
      toast.success('Round updated', { description: `${response.data.name} has been updated.` });
      queryClient.invalidateQueries({ queryKey: ['coordinator-rounds'] });
      setEditOpen(false);
      setSelectedRound(response.data);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update round', { description: getErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roundsApi.delete(id),
    onSuccess: () => {
      toast.success('Round deleted');
      queryClient.invalidateQueries({ queryKey: ['coordinator-rounds'] });
      setDeleteOpen(false);
      setSelectedRound(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete round', { description: getErrorMessage(error) });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Rounds Management</h1>
          <p className="text-sm text-muted-foreground">
            Configure competition rounds, scoring windows, assigned teams, and assigned judges.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="w-full sm:w-80">
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
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) setCreateForm(createEmptyForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!activeEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Create Round
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Round</DialogTitle>
                <DialogDescription>Set up a new round for {activeEvent?.title || 'the selected event'}.</DialogDescription>
              </DialogHeader>
              <RoundForm
                form={createForm}
                onChange={setCreateForm}
                tracks={tracks}
                rubrics={rubrics}
                teams={filterTeamsByTrack(teams, createForm.trackId)}
                judges={judges}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => activeEvent && createMutation.mutate(buildCreatePayload(createForm, activeEvent.id))}
                  disabled={createMutation.isPending || !createForm.name.trim()}
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Round'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(eventsQuery.error || roundsQuery.error || tracksQuery.error || rubricsQuery.error || teamsQuery.error || judgesQuery.error) && (
        <Alert>
          <AlertTitle>Unable to load round configuration data</AlertTitle>
          <AlertDescription>
            {getErrorMessage(
              eventsQuery.error ||
              roundsQuery.error ||
              tracksQuery.error ||
              rubricsQuery.error ||
              teamsQuery.error ||
              judgesQuery.error
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Round</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Teams</TableHead>
              <TableHead>Judges</TableHead>
              <TableHead>Window</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(eventsQuery.isLoading || roundsQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading rounds...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!eventsQuery.isLoading && !roundsQuery.isLoading && rounds.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No rounds found for this event.
                </TableCell>
              </TableRow>
            )}

            {rounds.map((round) => (
              <TableRow key={round.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{round.name}</p>
                      <p className="text-xs text-muted-foreground">{round.roundType}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{round.track?.name || 'All tracks'}</TableCell>
                <TableCell>
                  <Badge variant={round.status === 'COMPLETED' ? 'default' : round.status === 'CLOSED' ? 'secondary' : 'outline'}>
                    {round.status}
                  </Badge>
                </TableCell>
                <TableCell>{round.assignedTeamIds.length}</TableCell>
                <TableCell>{round.assignedJudgeIds?.length || 0}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTimeDisplay(round.startTime)}
                  <br />
                  {formatDateTimeDisplay(round.endTime)}
                </TableCell>
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
                          setSelectedRound(round);
                          setEditForm(mapRoundToForm(round));
                          setEditOpen(true);
                        }}
                      >
                        Edit round
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedRound(round);
                          setDeleteOpen(true);
                        }}
                      >
                        Delete round
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
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Round</DialogTitle>
            <DialogDescription>Update round metadata, assigned teams, and assigned judges.</DialogDescription>
          </DialogHeader>
          <RoundForm
            form={editForm}
            onChange={setEditForm}
            tracks={tracks}
            rubrics={rubrics}
            teams={filterTeamsByTrack(teams, editForm.trackId)}
            judges={judges}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedRound && updateMutation.mutate({ id: selectedRound.id, payload: buildUpdatePayload(editForm) })}
              disabled={updateMutation.isPending || !editForm.name.trim()}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete round</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{selectedRound?.name}"? Existing FE flows that reference this round will stop using it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => selectedRound && deleteMutation.mutate(selectedRound.id)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoundForm({
  form,
  onChange,
  tracks,
  rubrics,
  teams,
  judges,
}: {
  form: RoundFormState;
  onChange: Dispatch<SetStateAction<RoundFormState>>;
  tracks: Track[];
  rubrics: Rubric[];
  teams: Team[];
  judges: User[];
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="round-name">Round Name</Label>
          <Input
            id="round-name"
            value={form.name}
            onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
            placeholder="Preliminary Round"
          />
        </div>
        <div className="space-y-2">
          <Label>Round Type</Label>
          <Select value={form.roundType} onValueChange={(value: RoundType) => onChange((current) => ({ ...current, roundType: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roundTypeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Track</Label>
          <Select
            value={form.trackId}
            onValueChange={(value) =>
              onChange((current) => ({
                ...current,
                trackId: value,
                assignedTeamIds: current.trackId === value ? current.assignedTeamIds : [],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All tracks</SelectItem>
              {tracks.map((track) => (
                <SelectItem key={track.id} value={track.id}>
                  {track.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Rubric</Label>
          <Select value={form.rubricId} onValueChange={(value) => onChange((current) => ({ ...current, rubricId: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No rubric yet</SelectItem>
              {rubrics.map((rubric) => (
                <SelectItem key={rubric.id} value={rubric.id}>
                  {rubric.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(value: RoundStatus) => onChange((current) => ({ ...current, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roundStatusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DateTimeField id="round-start" label="Start Time" value={form.startTime} onChange={(value) => onChange((current) => ({ ...current, startTime: value }))} />
        <DateTimeField id="round-end" label="End Time" value={form.endTime} onChange={(value) => onChange((current) => ({ ...current, endTime: value }))} />
        <DateTimeField id="round-deadline" label="Submission Deadline" value={form.submissionDeadline} onChange={(value) => onChange((current) => ({ ...current, submissionDeadline: value }))} />
        <DateTimeField id="round-publish" label="Publish Time" value={form.publishTime} onChange={(value) => onChange((current) => ({ ...current, publishTime: value }))} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="round-max-promoted">Max Promoted Teams</Label>
          <Input
            id="round-max-promoted"
            type="number"
            min="1"
            value={form.maxPromotedTeams}
            onChange={(event) => onChange((current) => ({ ...current, maxPromotedTeams: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="round-tie-duration">Tie-break Duration (minutes)</Label>
          <Input
            id="round-tie-duration"
            type="number"
            min="1"
            value={form.tieBreakDurationMinutes}
            onChange={(event) => onChange((current) => ({ ...current, tieBreakDurationMinutes: event.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="round-promotion-rule">Promotion Rule</Label>
          <Textarea
            id="round-promotion-rule"
            rows={3}
            value={form.promotionRule}
            onChange={(event) => onChange((current) => ({ ...current, promotionRule: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="round-tie-break-rule">Tie-break Rule</Label>
          <Textarea
            id="round-tie-break-rule"
            rows={3}
            value={form.tieBreakRule}
            onChange={(event) => onChange((current) => ({ ...current, tieBreakRule: event.target.value }))}
          />
        </div>
      </div>

      <SelectionList
        label={`Assigned Teams (${form.assignedTeamIds.length})`}
        items={teams.map((team) => ({ id: team.id, primary: team.name, secondary: team.projectName || team.status }))}
        selectedIds={form.assignedTeamIds}
        onToggle={(id) => onChange((current) => ({ ...current, assignedTeamIds: toggleId(current.assignedTeamIds, id) }))}
        emptyMessage="No teams available for the current track."
      />

      <SelectionList
        label={`Assigned Judges (${form.assignedJudgeIds.length})`}
        items={judges.map((judge) => ({ id: judge.id, primary: judge.fullName, secondary: judge.email }))}
        selectedIds={form.assignedJudgeIds}
        onToggle={(id) => onChange((current) => ({ ...current, assignedJudgeIds: toggleId(current.assignedJudgeIds, id) }))}
        emptyMessage="No judge accounts found."
      />
    </div>
  );
}

function DateTimeField({
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
      <Input id={id} type="datetime-local" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SelectionList({
  label,
  items,
  selectedIds,
  onToggle,
  emptyMessage,
}: {
  label: string;
  items: Array<{ id: string; primary?: string; secondary?: string | null }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
  emptyMessage: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <Label>{label}</Label>
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border p-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">{emptyMessage}</p>}
        {items.map((item) => (
          <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
            <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => onToggle(item.id)} />
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.primary || item.id}</p>
              <p className="text-xs text-muted-foreground">{item.secondary || item.id}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
