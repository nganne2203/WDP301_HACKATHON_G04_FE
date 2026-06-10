import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, GitBranch, Loader2, MoreVertical, Plus } from 'lucide-react';

import { eventsApi, tracksApi } from '@/shared/api';
import { ApiError } from '@/shared/api/client';
import type { CreateTrackRequest, Event, Track, TrackStatus, TrackType, UpdateTrackRequest } from '@/shared/api/types';
import { useStore } from '@/entities/session/model/store';
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
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
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
import { toast } from 'sonner';

const trackTypeOptions: TrackType[] = ['PRELIMINARY_GROUP', 'FINAL_POOL', 'GENERAL'];
const trackStatusOptions: TrackStatus[] = ['DRAFT', 'OPEN', 'LOCKED', 'COMPLETED'];

interface TrackFormState {
  code: string;
  name: string;
  description: string;
  topic: string;
  problemStatement: string;
  type: TrackType;
  maxTeams: string;
  status: TrackStatus;
}

function createEmptyTrackForm(): TrackFormState {
  return {
    code: '',
    name: '',
    description: '',
    topic: '',
    problemStatement: '',
    type: 'PRELIMINARY_GROUP',
    maxTeams: '',
    status: 'DRAFT',
  };
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildTrackPayload(form: TrackFormState, eventId: string): CreateTrackRequest {
  return {
    eventId,
    code: normalizeOptionalText(form.code)?.toUpperCase() || undefined,
    name: form.name.trim(),
    description: normalizeOptionalText(form.description),
    topic: normalizeOptionalText(form.topic),
    problemStatement: normalizeOptionalText(form.problemStatement),
    type: form.type,
    maxTeams: form.maxTeams ? Number(form.maxTeams) : undefined,
    status: form.status,
  };
}

function buildTrackUpdatePayload(form: TrackFormState): UpdateTrackRequest {
  return {
    code: normalizeOptionalText(form.code)?.toUpperCase() || null || undefined,
    name: form.name.trim(),
    description: normalizeOptionalText(form.description),
    topic: normalizeOptionalText(form.topic),
    problemStatement: normalizeOptionalText(form.problemStatement),
    type: form.type,
    maxTeams: form.maxTeams ? Number(form.maxTeams) : null,
    status: form.status,
  };
}

function mapTrackToForm(track: Track): TrackFormState {
  return {
    code: track.code || '',
    name: track.name,
    description: track.description || '',
    topic: track.topic || '',
    problemStatement: track.problemStatement || '',
    type: track.type || 'PRELIMINARY_GROUP',
    maxTeams: track.maxTeams ? String(track.maxTeams) : '',
    status: track.status || 'DRAFT',
  };
}

function formatTrackType(type?: TrackType) {
  return (type || 'GENERAL').replaceAll('_', ' ');
}

export function Tracks() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [createForm, setCreateForm] = useState<TrackFormState>(createEmptyTrackForm());
  const [editForm, setEditForm] = useState<TrackFormState>(createEmptyTrackForm());

  const eventsQuery = useQuery({
    queryKey: ['coordinator-track-events'],
    queryFn: async () => {
      const response = await eventsApi.list({ page: 1, limit: 100 });
      return response.data;
    },
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

  const tracksQuery = useQuery({
    queryKey: ['coordinator-tracks', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => {
      const response = await tracksApi.list({ eventId: activeEvent?.id, page: 1, limit: 100 });
      return response.data;
    },
  });

  const tracks = tracksQuery.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateTrackRequest) => tracksApi.create(payload),
    onSuccess: (response) => {
      toast.success('Track created', { description: `${response.data.name} is ready.` });
      queryClient.invalidateQueries({ queryKey: ['coordinator-tracks'] });
      setCreateOpen(false);
      setCreateForm(createEmptyTrackForm());
    },
    onError: (error: unknown) => {
      toast.error('Failed to create track', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTrackRequest }) => tracksApi.update(id, payload),
    onSuccess: (response) => {
      toast.success('Track updated', { description: `${response.data.name} has been updated.` });
      queryClient.invalidateQueries({ queryKey: ['coordinator-tracks'] });
      setEditOpen(false);
      setSelectedTrack(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update track', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tracksApi.delete(id),
    onSuccess: () => {
      toast.success('Track deleted');
      queryClient.invalidateQueries({ queryKey: ['coordinator-tracks'] });
      setDeleteOpen(false);
      setSelectedTrack(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete track', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const openEditDialog = (track: Track) => {
    setSelectedTrack(track);
    setEditForm(mapTrackToForm(track));
    setEditOpen(true);
  };

  const openDeleteDialog = (track: Track) => {
    setSelectedTrack(track);
    setDeleteOpen(true);
  };

  const handleCreate = () => {
    if (!activeEvent?.id) return;
    if (!createForm.name.trim()) {
      toast.error('Track name is required');
      return;
    }

    createMutation.mutate(buildTrackPayload(createForm, activeEvent.id));
  };

  const handleUpdate = () => {
    if (!selectedTrack) return;
    if (!editForm.name.trim()) {
      toast.error('Track name is required');
      return;
    }

    updateMutation.mutate({
      id: selectedTrack.id,
      payload: buildTrackUpdatePayload(editForm),
    });
  };

  const confirmedTracks = tracks.filter((track) => track.status === 'OPEN' || track.status === 'COMPLETED').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Track Management</h1>
          <p className="text-sm text-muted-foreground">
            Organize event problem tracks and keep the FE aligned with backend constraints.
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
              if (!open) setCreateForm(createEmptyTrackForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!activeEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Create Track
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create Track</DialogTitle>
                <DialogDescription>
                  Add a new track for {activeEvent?.title || 'the selected event'}.
                </DialogDescription>
              </DialogHeader>
              <TrackForm form={createForm} onChange={setCreateForm} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Track'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Total Tracks" value={String(tracks.length)} helper="Tracks in selected event" />
        <MetricCard label="Open or Completed" value={String(confirmedTracks)} helper="Operational tracks" />
        <MetricCard
          label="Total Capacity"
          value={String(tracks.reduce((sum, track) => sum + (track.maxTeams || 0), 0))}
          helper="Configured max teams"
        />
      </div>

      {eventsQuery.error && (
        <InlineError message={eventsQuery.error instanceof ApiError ? eventsQuery.error.firstError : 'Failed to load events'} />
      )}

      {!activeEvent && !eventsQuery.isLoading && (
        <InlineError message="No event available. Create an event first before managing tracks." />
      )}

      {tracksQuery.error && (
        <InlineError message={tracksQuery.error instanceof ApiError ? tracksQuery.error.firstError : 'Failed to load tracks'} />
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Track</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(eventsQuery.isLoading || tracksQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading tracks...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!eventsQuery.isLoading && !tracksQuery.isLoading && tracks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No tracks found for this event.
                </TableCell>
              </TableRow>
            )}

            {tracks.map((track) => (
              <TableRow key={track.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{track.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {track.code || 'No code'}{track.description ? ` · ${track.description}` : ''}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatTrackType(track.type)}</TableCell>
                <TableCell>{track.status || 'DRAFT'}</TableCell>
                <TableCell className="max-w-xs truncate">{track.topic || '-'}</TableCell>
                <TableCell>{track.maxTeams || '-'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(track)}>
                        Edit track
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(track)}>
                        Delete track
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
            <DialogDescription>Update track metadata to match the current backend rules.</DialogDescription>
          </DialogHeader>
          <TrackForm form={editForm} onChange={setEditForm} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete track</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{selectedTrack?.name}" from this event? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTrack && deleteMutation.mutate(selectedTrack.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TrackForm({
  form,
  onChange,
}: {
  form: TrackFormState;
  onChange: React.Dispatch<React.SetStateAction<TrackFormState>>;
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="track-code">Code</Label>
          <Input
            id="track-code"
            value={form.code}
            onChange={(event) => onChange((current) => ({ ...current, code: event.target.value }))}
            placeholder="AI-01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="track-name">Name</Label>
          <Input
            id="track-name"
            value={form.name}
            onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
            placeholder="AI for Education"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(value: TrackType) => onChange((current) => ({ ...current, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {trackTypeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatTrackType(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(value: TrackStatus) => onChange((current) => ({ ...current, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {trackStatusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="track-capacity">Max Teams</Label>
          <Input
            id="track-capacity"
            type="number"
            min="1"
            value={form.maxTeams}
            onChange={(event) => onChange((current) => ({ ...current, maxTeams: event.target.value }))}
            placeholder="12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="track-description">Description</Label>
        <Textarea
          id="track-description"
          rows={3}
          value={form.description}
          onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
          placeholder="Short summary for coordinators and participants."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="track-topic">Topic</Label>
        <Input
          id="track-topic"
          value={form.topic}
          onChange={(event) => onChange((current) => ({ ...current, topic: event.target.value }))}
          placeholder="Smart Campus, AI Tutor, Sustainability..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="track-problem-statement">Problem Statement</Label>
        <Textarea
          id="track-problem-statement"
          rows={5}
          value={form.problemStatement}
          onChange={(event) => onChange((current) => ({ ...current, problemStatement: event.target.value }))}
          placeholder="Describe the challenge and expected solution scope."
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </Card>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
