import { Loader2, MoreVertical, Plus, Presentation } from 'lucide-react';

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
import {
  createEmptyWorkshopForm,
  formatDateTime,
  workshopPresenterLabel,
} from '../model/workshop-form';
import { useWorkshopsView } from '../model/useWorkshopsView';
import { WorkshopForm, WorkshopInlineError, WorkshopMetricCard } from './WorkshopForm';

export function Workshops() {
  const view = useWorkshopsView();

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
            <Select value={view.activeEvent?.id || ''} onValueChange={view.setSelectedEventId} disabled={view.eventsQuery.isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {view.events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog
            open={view.createOpen}
            onOpenChange={(open) => {
              view.setCreateOpen(open);
              if (!open) view.setCreateForm(createEmptyWorkshopForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!view.activeEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Create Workshop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create Workshop</DialogTitle>
                <DialogDescription>Schedule a workshop for {view.activeEvent?.title || 'the selected event'}.</DialogDescription>
              </DialogHeader>
              <WorkshopForm form={view.createForm} onChange={view.setCreateForm} timelines={view.workshopTimelines} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => view.setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={view.handleCreate} disabled={view.createMutation.isPending}>
                  {view.createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Workshop'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <WorkshopMetricCard label="Total Workshops" value={String(view.workshops.length)} helper="Scheduled in selected event" />
        <WorkshopMetricCard label="Live Now" value={String(view.liveCount)} helper="Sessions currently active" />
        <WorkshopMetricCard label="Completed" value={String(view.completedCount)} helper="Finished workshops" />
      </div>

      {view.eventsQuery.error && (
        <WorkshopInlineError message={view.eventsQuery.error instanceof ApiError ? view.eventsQuery.error.firstError : 'Failed to load events'} />
      )}

      {view.workshopsQuery.error && (
        <WorkshopInlineError message={view.workshopsQuery.error instanceof ApiError ? view.workshopsQuery.error.firstError : 'Failed to load workshops'} />
      )}

      {view.workshopTimelinesQuery.error && (
        <WorkshopInlineError message={view.workshopTimelinesQuery.error instanceof ApiError ? view.workshopTimelinesQuery.error.firstError : 'Failed to load workshop timelines'} />
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
            {(view.eventsQuery.isLoading || view.workshopsQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading workshops...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!view.eventsQuery.isLoading && !view.workshopsQuery.isLoading && view.workshops.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No workshops found for this event.
                </TableCell>
              </TableRow>
            )}

            {view.workshops.map((workshop) => (
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
                <TableCell>
                  {workshop.questionnaire && workshop.questionnaire.length > 0 ? (
                    <ul className="space-y-1">
                      {workshop.questionnaire.map((q, i) => (
                        <li key={i} className="text-sm text-muted-foreground leading-snug">
                          {i + 1}. {q}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No questions</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => view.openEditDialog(workshop)}>
                        Edit workshop
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          view.setSelectedWorkshop(workshop);
                          view.setDeleteOpen(true);
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

      <Dialog open={view.editOpen} onOpenChange={view.setEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Workshop</DialogTitle>
            <DialogDescription>Update workshop speaker info and scheduling fields to match the backend.</DialogDescription>
          </DialogHeader>
          <WorkshopForm form={view.editForm} onChange={view.setEditForm} timelines={view.workshopTimelines} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => view.setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={view.handleUpdate} disabled={view.updateMutation.isPending}>
              {view.updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={view.deleteOpen} onOpenChange={view.setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workshop</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{view.selectedWorkshop?.title}" and its related workshop interactions?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => view.selectedWorkshop && view.deleteMutation.mutate(view.selectedWorkshop.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {view.deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
