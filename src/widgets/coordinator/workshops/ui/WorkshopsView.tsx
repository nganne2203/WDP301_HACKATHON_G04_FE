import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2, MoreVertical, Plus, Presentation } from 'lucide-react';

import { eventsApi, timelinesApi, workshopsApi } from '@/shared/api';
import { ApiError } from '@/shared/api/client';
import type { TimelineEvent, Workshop, WorkshopStatus } from '@/shared/api/types';
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

const workshopStatusOptions: WorkshopStatus[] = ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'];

interface WorkshopFormState {
  timelineEventId: string;
  title: string;
  description: string;
  presenterId: string;
  speakerName: string;
  speakerTitle: string;
  speakerEmail: string;
  speakerBio: string;
  meetLink: string;
  startTime: string;
  endTime: string;
  questionnaire: string;
  status: WorkshopStatus;
}

function createEmptyWorkshopForm(): WorkshopFormState {
  return {
    timelineEventId: 'none',
    title: '',
    description: '',
    presenterId: '',
    speakerName: '',
    speakerTitle: '',
    speakerEmail: '',
    speakerBio: '',
    meetLink: '',
    startTime: '',
    endTime: '',
    questionnaire: '',
    status: 'SCHEDULED',
  };
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toDateTimeInputValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function parseQuestionnaire(value: string) {
  const items = value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(items));
}

function mapWorkshopToForm(workshop: Workshop): WorkshopFormState {
  return {
    timelineEventId: workshop.timelineEventId || 'none',
    title: workshop.title,
    description: workshop.description || '',
    presenterId: workshop.presenterId || '',
    speakerName: workshop.speakerInfo?.name || '',
    speakerTitle: workshop.speakerInfo?.title || '',
    speakerEmail: workshop.speakerInfo?.email || '',
    speakerBio: workshop.speakerInfo?.bio || '',
    meetLink: workshop.meetLink || '',
    startTime: toDateTimeInputValue(workshop.startTime),
    endTime: toDateTimeInputValue(workshop.endTime),
    questionnaire: (workshop.questionnaire || []).join('\n'),
    status: workshop.status,
  };
}

function buildWorkshopPayload(form: WorkshopFormState, eventId: string): CreateWorkshopRequest {
  return {
    eventId,
    timelineEventId: form.timelineEventId === 'none' ? undefined : form.timelineEventId,
    title: form.title.trim(),
    description: normalizeOptionalText(form.description) || undefined,
    presenterId: normalizeOptionalText(form.presenterId) || undefined,
    speakerInfo: {
      name: normalizeOptionalText(form.speakerName) || undefined,
      title: normalizeOptionalText(form.speakerTitle) || undefined,
      email: normalizeOptionalText(form.speakerEmail) || undefined,
      bio: normalizeOptionalText(form.speakerBio) || undefined,
    },
    meetLink: normalizeOptionalText(form.meetLink) || undefined,
    startTime: form.startTime,
    endTime: form.endTime,
    questionnaire: parseQuestionnaire(form.questionnaire),
    status: form.status,
  };
}

function buildWorkshopUpdatePayload(form: WorkshopFormState): UpdateWorkshopRequest {
  return {
    timelineEventId: form.timelineEventId === 'none' ? undefined : form.timelineEventId,
    title: form.title.trim(),
    description: normalizeOptionalText(form.description) || undefined,
    presenterId: normalizeOptionalText(form.presenterId) || undefined,
    speakerInfo: {
      name: normalizeOptionalText(form.speakerName) || undefined,
      title: normalizeOptionalText(form.speakerTitle) || undefined,
      email: normalizeOptionalText(form.speakerEmail) || undefined,
      bio: normalizeOptionalText(form.speakerBio) || undefined,
    },
    meetLink: normalizeOptionalText(form.meetLink) || undefined,
    startTime: form.startTime || undefined,
    endTime: form.endTime || undefined,
    questionnaire: parseQuestionnaire(form.questionnaire),
    status: form.status,
  };
}

function workshopPresenterLabel(workshop: Workshop) {
  return workshop.presenter?.fullName || workshop.speakerInfo?.name || workshop.presenter?.email || '-';
}

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
        <MetricCard label="Total Workshops" value={String(workshops.length)} helper="Scheduled in selected event" />
        <MetricCard label="Live Now" value={String(liveCount)} helper="Sessions currently active" />
        <MetricCard label="Completed" value={String(completedCount)} helper="Finished workshops" />
      </div>

      {eventsQuery.error && (
        <InlineError message={eventsQuery.error instanceof ApiError ? eventsQuery.error.firstError : 'Failed to load events'} />
      )}

      {workshopsQuery.error && (
        <InlineError message={workshopsQuery.error instanceof ApiError ? workshopsQuery.error.firstError : 'Failed to load workshops'} />
      )}

      {workshopTimelinesQuery.error && (
        <InlineError message={workshopTimelinesQuery.error instanceof ApiError ? workshopTimelinesQuery.error.firstError : 'Failed to load workshop timelines'} />
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

function WorkshopForm({
  form,
  onChange,
  timelines,
}: {
  form: WorkshopFormState;
  onChange: React.Dispatch<React.SetStateAction<WorkshopFormState>>;
  timelines: TimelineEvent[];
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="workshop-title">Title</Label>
          <Input
            id="workshop-title"
            value={form.title}
            onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
            placeholder="GitHub workflow clinic"
          />
        </div>
        <div className="space-y-2">
          <Label>Timeline Item</Label>
          <Select
            value={form.timelineEventId}
            onValueChange={(value) => onChange((current) => ({ ...current, timelineEventId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional timeline reference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No linked timeline item</SelectItem>
              {timelines.map((timeline) => (
                <SelectItem key={timeline.id} value={timeline.id}>
                  {timeline.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="workshop-start">Start Time</Label>
          <Input
            id="workshop-start"
            type="datetime-local"
            value={form.startTime}
            onChange={(event) => onChange((current) => ({ ...current, startTime: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workshop-end">End Time</Label>
          <Input
            id="workshop-end"
            type="datetime-local"
            value={form.endTime}
            onChange={(event) => onChange((current) => ({ ...current, endTime: event.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="workshop-presenter-id">Presenter Id</Label>
          <Input
            id="workshop-presenter-id"
            value={form.presenterId}
            onChange={(event) => onChange((current) => ({ ...current, presenterId: event.target.value }))}
            placeholder="Optional user id from backend"
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(value: WorkshopStatus) => onChange((current) => ({ ...current, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workshopStatusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="speaker-name">Speaker Name</Label>
          <Input
            id="speaker-name"
            value={form.speakerName}
            onChange={(event) => onChange((current) => ({ ...current, speakerName: event.target.value }))}
            placeholder="Internal or guest speaker name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="speaker-title">Speaker Title</Label>
          <Input
            id="speaker-title"
            value={form.speakerTitle}
            onChange={(event) => onChange((current) => ({ ...current, speakerTitle: event.target.value }))}
            placeholder="Mentor, Engineer, Lecturer..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="speaker-email">Speaker Email</Label>
          <Input
            id="speaker-email"
            type="email"
            value={form.speakerEmail}
            onChange={(event) => onChange((current) => ({ ...current, speakerEmail: event.target.value }))}
            placeholder="speaker@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workshop-link">Meet Link</Label>
          <Input
            id="workshop-link"
            value={form.meetLink}
            onChange={(event) => onChange((current) => ({ ...current, meetLink: event.target.value }))}
            placeholder="https://meet.google.com/..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="workshop-description">Description</Label>
        <Textarea
          id="workshop-description"
          rows={3}
          value={form.description}
          onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
          placeholder="Describe the workshop and expected attendee outcome."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="speaker-bio">Speaker Bio</Label>
        <Textarea
          id="speaker-bio"
          rows={3}
          value={form.speakerBio}
          onChange={(event) => onChange((current) => ({ ...current, speakerBio: event.target.value }))}
          placeholder="Short speaker biography for event staff."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="workshop-questionnaire">Questionnaire</Label>
        <Textarea
          id="workshop-questionnaire"
          rows={4}
          value={form.questionnaire}
          onChange={(event) => onChange((current) => ({ ...current, questionnaire: event.target.value }))}
          placeholder="One question per line. These will be sent as a string array."
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
