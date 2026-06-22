import { AlertCircle, Calendar, Loader2, MoreVertical, Plus } from 'lucide-react';

import { formatEventDate, mapEventStatus } from '@/features/event-management/model/event-form';
import { ApiError } from '@/shared/api/client';
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
import { StatusBadge } from '@/shared/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

import { useEventsView } from '../model/useEventsView';
import { EventDetailsDialog } from './EventDetailsDialog';
import { EventForm } from './EventForm';
import { EventInvitationsDialog } from './EventInvitationsDialog';

export function Events() {
  const view = useEventsView();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Event Management</h1>
          <p className="text-sm text-muted-foreground">Create and manage hackathon events</p>
        </div>
        <Dialog open={view.createOpen} onOpenChange={view.openCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>Fill in the details below to create a new hackathon event.</DialogDescription>
            </DialogHeader>
            <EventForm
              form={view.createForm}
              onSubmit={view.handleCreate}
              pending={view.createMutation.isPending}
              submitLabel="Create Event"
              pendingLabel="Creating..."
              onCancel={() => view.openCreateDialog(false)}
              prefix="create"
              allowPastDates={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {view.eventsQuery.isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-muted-foreground">Loading events...</span>
        </div>
      )}

      {view.eventsQuery.error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">
            {view.eventsQuery.error instanceof ApiError ? view.eventsQuery.error.firstError : 'Failed to load events'}
          </p>
        </div>
      )}

      {!view.eventsQuery.isLoading && !view.eventsQuery.error && (
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
              {view.events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No events found. Create your first event to get started.
                  </TableCell>
                </TableRow>
              ) : (
                view.events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{event.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{event.semester || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={mapEventStatus(event.status) as never} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatEventDate(event.startDate)} - {formatEventDate(event.endDate)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => view.openDetailsDialog(event)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => view.openEditDialog(event)}>
                            Edit Event
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => view.openInviteDialog(event)}>
                            Send Invitations
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => view.openDeleteDialog(event)}>
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

      <EventDetailsDialog
        open={view.detailsOpen}
        onOpenChange={view.setDetailsOpen}
        event={view.selectedEvent}
      />

      <Dialog open={view.editOpen} onOpenChange={view.setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update the event information below.</DialogDescription>
          </DialogHeader>
          {view.selectedEvent && (
            <EventForm
              form={view.editForm}
              onSubmit={view.handleEdit}
              pending={view.updateMutation.isPending}
              submitLabel="Save Changes"
              pendingLabel="Saving..."
              onCancel={() => view.setEditOpen(false)}
              prefix="edit"
              allowPastDates
            />
          )}
        </DialogContent>
      </Dialog>

      <EventInvitationsDialog
        open={view.inviteOpen}
        onOpenChange={view.setInviteOpen}
        eventTitle={view.selectedEvent?.title}
        inviteEmails={view.inviteEmails}
        setInviteEmails={view.setInviteEmails}
        inviteMessage={view.inviteMessage}
        setInviteMessage={view.setInviteMessage}
        pending={view.inviteMutation.isPending}
        onSend={view.sendInvitations}
      />

      <AlertDialog open={view.deleteOpen} onOpenChange={view.setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{view.selectedEvent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={view.confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={view.deleteMutation.isPending}
            >
              {view.deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
