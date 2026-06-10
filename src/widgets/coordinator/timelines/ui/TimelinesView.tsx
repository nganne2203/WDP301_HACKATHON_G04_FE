import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock3, Loader2, MoreVertical, Plus } from 'lucide-react';

import { eventsApi, timelinesApi } from '@/shared/api';
import { ApiError } from '@/shared/api/client';
import type { CreateTimelineRequest, TimelineEvent, UpdateTimelineRequest } from '@/shared/api/types';
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
import { toast } from 'sonner';
import {
  buildTimelinePayload,
  buildTimelineUpdatePayload,
  createEmptyTimelineForm,
  formatDateTime,
  formatTimelineType,
  mapTimelineToForm,
  type TimelineFormState,
} from '../model/timeline-form';
import { TimelineForm, TimelineInlineError, TimelineMetricCard } from './TimelineForm';

export function Timelines() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineEvent | null>(null);
  const [createForm, setCreateForm] = useState<TimelineFormState>(createEmptyTimelineForm());
  const [editForm, setEditForm] = useState<TimelineFormState>(createEmptyTimelineForm());

  const eventsQuery = useQuery({
    queryKey: ['coordinator-timeline-events'],
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

  const timelinesQuery = useQuery({
    queryKey: ['coordinator-timelines', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => {
      const response = await timelinesApi.list({ eventId: activeEvent?.id, page: 1, limit: 100 });
      return response.data;
    },
  });

  const timelines = timelinesQuery.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateTimelineRequest) => timelinesApi.create(payload),
    onSuccess: (response) => {
      toast.success('Timeline created', { description: `${response.data.title} has been scheduled.` });
      queryClient.invalidateQueries({ queryKey: ['coordinator-timelines'] });
      setCreateOpen(false);
      setCreateForm(createEmptyTimelineForm());
    },
    onError: (error: unknown) => {
      toast.error('Failed to create timeline', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTimelineRequest }) => timelinesApi.update(id, payload),
    onSuccess: (response) => {
      toast.success('Timeline updated', { description: `${response.data.title} has been updated.` });
      queryClient.invalidateQueries({ queryKey: ['coordinator-timelines'] });
      setEditOpen(false);
      setSelectedTimeline(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update timeline', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => timelinesApi.delete(id),
    onSuccess: () => {
      toast.success('Timeline deleted');
      queryClient.invalidateQueries({ queryKey: ['coordinator-timelines'] });
      setDeleteOpen(false);
      setSelectedTimeline(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete timeline', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  const handleCreate = () => {
    if (!activeEvent?.id) return;
    if (!createForm.title.trim()) {
      toast.error('Timeline title is required');
      return;
    }
    createMutation.mutate(buildTimelinePayload(createForm, activeEvent.id));
  };

  const handleUpdate = () => {
    if (!selectedTimeline) return;
    if (!editForm.title.trim()) {
      toast.error('Timeline title is required');
      return;
    }
    updateMutation.mutate({
      id: selectedTimeline.id,
      payload: buildTimelineUpdatePayload(editForm),
    });
  };

  const openEditDialog = (timeline: TimelineEvent) => {
    setSelectedTimeline(timeline);
    setEditForm(mapTimelineToForm(timeline));
    setEditOpen(true);
  };

  const completedCount = timelines.filter((timeline) => timeline.status === 'COMPLETED').length;
  const activeCount = timelines.filter((timeline) => timeline.status === 'ONGOING').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Timeline Management</h1>
          <p className="text-sm text-muted-foreground">
            Schedule check-in, workshops, judging rounds, and milestone publishing in one place.
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
              if (!open) setCreateForm(createEmptyTimelineForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!activeEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Add Timeline Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Timeline Item</DialogTitle>
                <DialogDescription>Schedule a new milestone for {activeEvent?.title || 'the selected event'}.</DialogDescription>
              </DialogHeader>
              <TimelineForm form={createForm} onChange={setCreateForm} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Timeline'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TimelineMetricCard label="Total Items" value={String(timelines.length)} helper="Milestones in selected event" />
        <TimelineMetricCard label="In Progress" value={String(activeCount)} helper="Items currently ongoing" />
        <TimelineMetricCard label="Completed" value={String(completedCount)} helper="Finished milestones" />
      </div>

      {eventsQuery.error && (
        <TimelineInlineError message={eventsQuery.error instanceof ApiError ? eventsQuery.error.firstError : 'Failed to load events'} />
      )}

      {timelinesQuery.error && (
        <TimelineInlineError message={timelinesQuery.error instanceof ApiError ? timelinesQuery.error.firstError : 'Failed to load timelines'} />
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timeline Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(eventsQuery.isLoading || timelinesQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading timelines...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!eventsQuery.isLoading && !timelinesQuery.isLoading && timelines.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No timeline items found for this event.
                </TableCell>
              </TableRow>
            )}

            {timelines.map((timeline) => (
              <TableRow key={timeline.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                      <Clock3 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{timeline.title}</p>
                      <p className="text-xs text-muted-foreground">{timeline.description || 'No description'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatTimelineType(timeline.eventType)}</TableCell>
                <TableCell>{timeline.status}</TableCell>
                <TableCell>{formatDateTime(timeline.startTime)}</TableCell>
                <TableCell>{formatDateTime(timeline.endTime)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(timeline)}>
                        Edit item
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedTimeline(timeline);
                          setDeleteOpen(true);
                        }}
                      >
                        Delete item
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
            <DialogTitle>Edit Timeline Item</DialogTitle>
            <DialogDescription>Keep the website schedule consistent with backend data.</DialogDescription>
          </DialogHeader>
          <TimelineForm form={editForm} onChange={setEditForm} />
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
            <AlertDialogTitle>Delete timeline item</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{selectedTimeline?.title}" from this event schedule?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTimeline && deleteMutation.mutate(selectedTimeline.id)}
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
