import { Clock3, Loader2, MoreVertical, Plus } from 'lucide-react';

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
import { ListPagination } from '@/shared/ui/list-pagination';
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
  createEmptyTimelineForm,
  formatDateTime,
  formatTimelineType,
} from '../model/timeline-form';
import { useTimelinesView } from '../model/useTimelinesView';
import { TimelineForm, TimelineInlineError, TimelineMetricCard } from './TimelineForm';

export function Timelines() {
  const view = useTimelinesView();

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
              if (!open) view.setCreateForm(createEmptyTimelineForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!view.activeEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Add Timeline Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Timeline Item</DialogTitle>
                <DialogDescription>Schedule a new milestone for {view.activeEvent?.title || 'the selected event'}.</DialogDescription>
              </DialogHeader>
              <TimelineForm form={view.createForm} onChange={view.setCreateForm} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => view.setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={view.handleCreate} disabled={view.createMutation.isPending}>
                  {view.createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Timeline'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TimelineMetricCard label="Total Items" value={String(view.timelines.length)} helper="Milestones in selected event" />
        <TimelineMetricCard label="In Progress" value={String(view.activeCount)} helper="Items currently ongoing" />
        <TimelineMetricCard label="Completed" value={String(view.completedCount)} helper="Finished milestones" />
      </div>

      {view.eventsQuery.error && (
        <TimelineInlineError message={view.eventsQuery.error instanceof ApiError ? view.eventsQuery.error.firstError : 'Failed to load events'} />
      )}

      {view.timelinesQuery.error && (
        <TimelineInlineError message={view.timelinesQuery.error instanceof ApiError ? view.timelinesQuery.error.firstError : 'Failed to load timelines'} />
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
            {(view.eventsQuery.isLoading || view.timelinesQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading timelines...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!view.eventsQuery.isLoading && !view.timelinesQuery.isLoading && view.timelines.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No timeline items found for this event.
                </TableCell>
              </TableRow>
            )}

            {view.timelines.map((timeline) => (
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
                      <DropdownMenuItem onClick={() => view.openEditDialog(timeline)}>
                        Edit item
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          view.setSelectedTimeline(timeline);
                          view.setDeleteOpen(true);
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
        <ListPagination page={view.page} pagination={view.pagination} onPageChange={view.setPage} />
      </Card>

      <Dialog open={view.editOpen} onOpenChange={view.setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Timeline Item</DialogTitle>
            <DialogDescription>Keep the website schedule consistent with backend data.</DialogDescription>
          </DialogHeader>
          <TimelineForm form={view.editForm} onChange={view.setEditForm} />
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
            <AlertDialogTitle>Delete timeline item</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{view.selectedTimeline?.title}" from this event schedule?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => view.selectedTimeline && view.deleteMutation.mutate(view.selectedTimeline.id)}
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
