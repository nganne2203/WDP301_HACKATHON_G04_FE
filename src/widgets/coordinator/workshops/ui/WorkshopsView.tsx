import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MoreVertical, Plus, Presentation } from 'lucide-react';

import { eventsApi, timelinesApi, workshopsApi } from '@/shared/api';
import { ApiError } from '@/shared/api/client';
import type { Workshop } from '@/shared/api/types';
import type { CreateWorkshopRequest, UpdateWorkshopRequest } from '@/shared/api/workshops';
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
  buildWorkshopPayload,
  buildWorkshopUpdatePayload,
  createEmptyWorkshopForm,
  formatDateTime,
  mapWorkshopToForm,
  workshopPresenterLabel,
  type WorkshopFormState,
} from '../model/workshop-form';
import { WorkshopForm, WorkshopInlineError, WorkshopMetricCard } from './WorkshopForm';

export function Workshops() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [createForm, setCreateForm] = useState<WorkshopFormState>(createEmptyWorkshopForm());
  const [editForm, setEditForm] = useState<WorkshopFormState>(createEmptyWorkshopForm());

  const eventsQuery = useQuery({
    queryKey: ['coordinator-workshop-events'],
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

  const workshopsQuery = useQuery({
    queryKey: ['coordinator-workshops', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => {
      const response = await workshopsApi.list({ eventId: activeEvent?.id, page: 1, limit: 100 });
      return response.data;
    },
  });

  const workshopTimelinesQuery = useQuery({
    queryKey: ['coordinator-workshop-timelines', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => {
      const response = await timelinesApi.list({
        eventId: activeEvent?.id,
        eventType: 'WORKSHOP',
        page: 1,
        limit: 100,
      });
      return response.data;
    },
  });

  const workshops = workshopsQuery.data || [];
  const workshopTimelines = workshopTimelinesQuery.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateWorkshopRequest) => workshopsApi.create(payload),
    onSuccess: (response) => {
      toast.success('Workshop created', { description: `${response.data.title} has been scheduled.` });
      queryClient.invalidateQueries({ queryKey: ['coordinator-workshops'] });
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
      queryClient.invalidateQueries({ queryKey: ['coordinator-workshops'] });
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
      queryClient.invalidateQueries({ queryKey: ['coordinator-workshops'] });
      setDeleteOpen(false);
      setSelectedWorkshop(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete workshop', {
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

  const liveCount = workshops.filter((workshop) => workshop.status === 'LIVE').length;
  const completedCount = workshops.filter((workshop) => workshop.status === 'COMPLETED').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Workshop Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage seminars, speakers, questionnaire prompts, and workshop links from the FE.
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
              if (!open) setCreateForm(createEmptyWorkshopForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!activeEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Create Workshop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create Workshop</DialogTitle>
                <DialogDescription>Schedule a workshop for {activeEvent?.title || 'the selected event'}.</DialogDescription>
              </DialogHeader>
              <WorkshopForm form={createForm} onChange={setCreateForm} timelines={workshopTimelines} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Workshop'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <WorkshopMetricCard label="Total Workshops" value={String(workshops.length)} helper="Scheduled in selected event" />
        <WorkshopMetricCard label="Live Now" value={String(liveCount)} helper="Sessions currently active" />
        <WorkshopMetricCard label="Completed" value={String(completedCount)} helper="Finished workshops" />
      </div>

      {eventsQuery.error && (
        <WorkshopInlineError message={eventsQuery.error instanceof ApiError ? eventsQuery.error.firstError : 'Failed to load events'} />
      )}

      {workshopsQuery.error && (
        <WorkshopInlineError message={workshopsQuery.error instanceof ApiError ? workshopsQuery.error.firstError : 'Failed to load workshops'} />
      )}

      {workshopTimelinesQuery.error && (
        <WorkshopInlineError message={workshopTimelinesQuery.error instanceof ApiError ? workshopTimelinesQuery.error.firstError : 'Failed to load workshop timelines'} />
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workshop</TableHead>
              <TableHead>Presenter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(eventsQuery.isLoading || workshopsQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading workshops...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!eventsQuery.isLoading && !workshopsQuery.isLoading && workshops.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No workshops found for this event.
                </TableCell>
              </TableRow>
            )}

            {workshops.map((workshop) => (
              <TableRow key={workshop.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-100 text-violet-700">
                      <Presentation className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{workshop.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {workshop.meetLink || workshop.description || 'No meeting link or description yet'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{workshopPresenterLabel(workshop)}</TableCell>
                <TableCell>{workshop.status}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{formatDateTime(workshop.startTime)}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(workshop.endTime)}</p>
                  </div>
                </TableCell>
                <TableCell>{workshop.questionnaire?.length || 0}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(workshop)}>
                        Edit workshop
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedWorkshop(workshop);
                          setDeleteOpen(true);
                        }}
                      >
                        Delete workshop
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
            <DialogTitle>Edit Workshop</DialogTitle>
            <DialogDescription>Update workshop speaker info and scheduling fields to match the backend.</DialogDescription>
          </DialogHeader>
          <WorkshopForm form={editForm} onChange={setEditForm} timelines={workshopTimelines} />
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
            <AlertDialogTitle>Delete workshop</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{selectedWorkshop?.title}" and its related workshop interactions?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedWorkshop && deleteMutation.mutate(selectedWorkshop.id)}
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
