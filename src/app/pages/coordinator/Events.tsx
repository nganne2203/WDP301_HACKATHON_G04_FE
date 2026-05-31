import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, Calendar, MoreVertical, Loader2, AlertCircle, Mail } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { StatusBadge } from '../../components/shared/StatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { eventsApi } from '../../../lib/api/events';
import { ApiError } from '../../../lib/api/client';
import type { Event, EventStatus, CreateEventRequest } from '../../../lib/api/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN_REGISTRATION', label: 'Open Registration' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'SCORING', label: 'Scoring' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const createEventSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  semester: z.string().max(50).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

const editEventSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  semester: z.string().max(50).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});

type EditEventForm = z.infer<typeof editEventSchema>;

export function Events() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Fetch events
  const { data: eventsResponse, isLoading, error: fetchError } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list({ page: 1, limit: 100 }),
  });

  const events = eventsResponse?.data || [];

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateEventRequest) => eventsApi.create(data),
    onSuccess: (response) => {
      toast.success('Event Created', { description: `${response.data.title} has been created.` });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setCreateOpen(false);
      createForm.reset();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error('Failed to create event', { description: error.firstError });
      } else {
        toast.error('Failed to create event');
      }
    },
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEventRequest> }) =>
      eventsApi.update(id, data),
    onSuccess: (response) => {
      toast.success('Event Updated', { description: `${response.data.title} has been updated.` });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setEditOpen(false);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error('Failed to update event', { description: error.firstError });
      } else {
        toast.error('Failed to update event');
      }
    },
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      toast.success('Event Deleted', { description: 'The event has been deleted.' });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDeleteOpen(false);
      setSelectedEvent(null);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error('Failed to delete event', { description: error.firstError });
      } else {
        toast.error('Failed to delete event');
      }
    },
  });

  // Send event invitation emails
  const inviteMutation = useMutation({
    mutationFn: ({ id, emails, message }: { id: string; emails: string[]; message?: string }) =>
      eventsApi.sendInvitations(id, { emails, message }),
    onSuccess: (response) => {
      const { total, sent, skipped, failed } = response.data;
      if (failed > 0 || skipped > 0) {
        toast.warning('Invitations processed with delivery issues', {
          description: `${sent}/${total} sent, ${skipped} skipped, ${failed} failed.`,
        });
      } else {
        toast.success('Invitations sent', {
          description: `${sent}/${total} invitation email(s) sent.`,
        });
      }
      setInviteOpen(false);
      setInviteEmails('');
      setInviteMessage('');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error('Failed to send invitations', { description: error.firstError });
      } else {
        toast.error('Failed to send invitations');
      }
    },
  });

  // Create form
  const createForm = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { status: 'DRAFT' },
  });

  // Edit form
  const editForm = useForm<EditEventForm>({
    resolver: zodResolver(editEventSchema),
  });

  const handleCreate = (data: CreateEventForm) => {
    createMutation.mutate({
      title: data.title,
      description: data.description || undefined,
      semester: data.semester || undefined,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      status: (data.status as EventStatus) || 'DRAFT',
    });
  };

  const handleEdit = (data: EditEventForm) => {
    if (!selectedEvent) return;
    updateMutation.mutate({
      id: selectedEvent.id,
      data: {
        title: data.title,
        description: data.description || undefined,
        semester: data.semester || undefined,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        status: (data.status as EventStatus) || undefined,
      },
    });
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setDetailsOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    editForm.reset({
      title: event.title,
      description: event.description || '',
      semester: event.semester || '',
      startDate: event.startDate ? event.startDate.split('T')[0] : '',
      endDate: event.endDate ? event.endDate.split('T')[0] : '',
      status: event.status,
    });
    setEditOpen(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setSelectedEvent(event);
    setDeleteOpen(true);
  };

  const handleInviteEvent = (event: Event) => {
    setSelectedEvent(event);
    setInviteEmails('');
    setInviteMessage('');
    setInviteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEvent) {
      deleteMutation.mutate(selectedEvent.id);
    }
  };

  const parseInviteEmails = (value: string) =>
    value
      .split(/[\s,;]+/)
      .map((email) => email.trim())
      .filter(Boolean);

  const handleSendInvitations = () => {
    if (!selectedEvent) return;

    const emails = parseInviteEmails(inviteEmails);
    if (emails.length === 0) {
      toast.error('No email addresses entered');
      return;
    }

    inviteMutation.mutate({
      id: selectedEvent.id,
      emails,
      message: inviteMessage || undefined,
    });
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  };

  /** Map backend status to StatusBadge's expected lowercase format */
  const mapStatus = (status: EventStatus): string => {
    return status.toLowerCase();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Event Management</h1>
          <p className="text-sm text-muted-foreground">Create and manage hackathon events</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new hackathon event.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-title">Event Title</Label>
                  <Input id="create-title" placeholder="SEAL Hackathon 2026" {...createForm.register('title')} />
                  {createForm.formState.errors.title && (
                    <p className="text-sm text-red-600">{createForm.formState.errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-semester">Semester</Label>
                  <Input id="create-semester" placeholder="2026A" {...createForm.register('semester')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  placeholder="Enter event description..."
                  rows={3}
                  {...createForm.register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-startDate">Start Date</Label>
                  <Input id="create-startDate" type="date" {...createForm.register('startDate')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-endDate">End Date</Label>
                  <Input id="create-endDate" type="date" {...createForm.register('endDate')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-status">Status</Label>
                <Select
                  defaultValue="DRAFT"
                  onValueChange={(v) => createForm.setValue('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    'Create Event'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-muted-foreground">Loading events...</span>
        </div>
      )}

      {/* Error state */}
      {fetchError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">
            {fetchError instanceof ApiError ? fetchError.firstError : 'Failed to load events'}
          </p>
        </div>
      )}

      {/* Events table */}
      {!isLoading && !fetchError && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No events found. Create your first event to get started.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{event.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{event.semester || '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={mapStatus(event.status) as any} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(event.startDate)} - {formatDate(event.endDate)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(event)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                            Edit Event
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleInviteEvent(event)}>
                            Send Invitations
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteEvent(event)}
                          >
                            Delete Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* View Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Detailed information about the event.
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Event Title</Label>
                  <p className="font-medium mt-1">{selectedEvent.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Semester</Label>
                  <p className="font-medium mt-1">{selectedEvent.semester || '—'}</p>
                </div>
              </div>
              {selectedEvent.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1 text-sm">{selectedEvent.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="font-medium mt-1">{formatDate(selectedEvent.startDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p className="font-medium mt-1">{formatDate(selectedEvent.endDate)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={mapStatus(selectedEvent.status) as any} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created By</Label>
                  <p className="font-medium mt-1">{selectedEvent.createdBy?.fullName || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Team Size</Label>
                  <p className="font-medium mt-1">
                    {selectedEvent.minTeamMembers || '?'} - {selectedEvent.maxTeamMembers || '?'} members
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the event information below.
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Event Title</Label>
                  <Input id="edit-title" {...editForm.register('title')} />
                  {editForm.formState.errors.title && (
                    <p className="text-sm text-red-600">{editForm.formState.errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-semester">Semester</Label>
                  <Input id="edit-semester" {...editForm.register('semester')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" rows={3} {...editForm.register('description')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input id="edit-startDate" type="date" {...editForm.register('startDate')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input id="edit-endDate" type="date" {...editForm.register('endDate')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  defaultValue={selectedEvent.status}
                  onValueChange={(v) => editForm.setValue('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Invitations Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Send Event Invitations
            </DialogTitle>
            <DialogDescription>
              Send registration invitation emails for {selectedEvent?.title || 'this event'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-emails">Recipient emails</Label>
              <Textarea
                id="invite-emails"
                rows={5}
                placeholder="participant1@example.com, participant2@example.com"
                value={inviteEmails}
                onChange={(event) => setInviteEmails(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-message">Message</Label>
              <Textarea
                id="invite-message"
                rows={3}
                placeholder="Optional invitation message"
                value={inviteMessage}
                onChange={(event) => setInviteMessage(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendInvitations} disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  'Send Invitations'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
