import { useState } from 'react';
import { Clock3, Loader2, MoreVertical, Plus } from 'lucide-react';
import type { TimelineActivity } from '@/shared/api/types';

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
  const [detailsTimeline, setDetailsTimeline] = useState<TimelineActivity | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Timeline Management</h1>
          <p className="text-sm text-muted-foreground">
            Schedule check-in, workshops, judging rounds, and milestone publishing in one place.
          </p>
        </div>
        <div className="flex shrink-0">
          <Dialog
            open={view.createOpen}
            onOpenChange={(open) => {
              view.setCreateOpen(open);
              if (!open) view.setCreateForm(createEmptyTimelineForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!view.activeCompetition || view.timelinesReadOnly}>
                <Plus className="mr-2 h-4 w-4" />
                Add Timeline Item
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden p-0">
              <div className="flex-shrink-0 px-6 pt-6">
              <DialogHeader>
                <DialogTitle>Create Timeline Item</DialogTitle>
                <DialogDescription>Schedule a new milestone for {view.activeCompetition?.title || 'the selected competition'}.</DialogDescription>
              </DialogHeader>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6">
              <TimelineForm form={view.createForm} onChange={view.setCreateForm} />
              </div>
              <div className="flex flex-shrink-0 justify-end gap-2 border-t bg-background px-6 py-4">
                <Button variant="outline" onClick={() => view.setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={view.handleCreate} disabled={view.createMutation.isPending || view.timelinesReadOnly}>
                  {view.createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Timeline'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TimelineMetricCard label="Total Items" value={String(view.timelines.length)} helper="Milestones in selected competition" />
        <TimelineMetricCard label="In Progress" value={String(view.activeCount)} helper="Items currently ongoing" />
        <TimelineMetricCard label="Completed" value={String(view.completedCount)} helper="Finished milestones" />
      </div>

      {view.eventsQuery.error && (
        <TimelineInlineError message={view.eventsQuery.error instanceof ApiError ? view.eventsQuery.error.firstError : 'Failed to load competitions'} />
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
                  No timeline items found for this competition.
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
                <TableCell>{formatTimelineType(timeline.activityType)}</TableCell>
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
                      <DropdownMenuItem onClick={() => setDetailsTimeline(timeline)}>
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={view.timelinesReadOnly} onClick={() => view.openEditDialog(timeline)}>
                        Edit item
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={view.timelinesReadOnly}
                        className="text-destructive"
                        onClick={() => view.openDeleteDialog(timeline)}
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

      <Dialog open={Boolean(detailsTimeline)} onOpenChange={(open) => { if (!open) setDetailsTimeline(null); }}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailsTimeline?.title || 'Timeline item details'}</DialogTitle>
            <DialogDescription>Schedule and activity information for this timeline item.</DialogDescription>
          </DialogHeader>
          {detailsTimeline && (
            <div className="space-y-5 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Competition" value={detailsTimeline.competition?.title || view.activeCompetition?.title || '-'} />
                <DetailField label="Activity Type" value={formatTimelineType(detailsTimeline.activityType)} />
                <DetailField label="Status" value={detailsTimeline.status} />
                <DetailField label="Start Time" value={formatDateTime(detailsTimeline.startTime)} />
                <DetailField label="End Time" value={formatDateTime(detailsTimeline.endTime)} />
                <DetailField label="Created At" value={formatDateTime(detailsTimeline.createdAt)} />
                <DetailField label="Updated At" value={formatDateTime(detailsTimeline.updatedAt)} />
              </div>
              <DetailField label="Description" value={detailsTimeline.description || 'No description'} multiline />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={view.editOpen} onOpenChange={view.setEditOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden p-0">
          <div className="flex-shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Edit Timeline Item</DialogTitle>
            <DialogDescription>Update the competition schedule and visibility.</DialogDescription>
          </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <TimelineForm form={view.editForm} onChange={view.setEditForm} enforceFuture={false} />
          </div>
          <div className="flex flex-shrink-0 justify-end gap-2 border-t bg-background px-6 py-4">
            <Button variant="outline" onClick={() => view.setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={view.handleUpdate} disabled={view.updateMutation.isPending || view.timelinesReadOnly}>
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
              Delete "{view.selectedTimeline?.title}" from this competition schedule?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={view.deleteMutation.isPending || view.timelinesReadOnly}
              onClick={view.handleDelete}
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

function DetailField({ label, multiline, value }: { label: string; multiline?: boolean; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={multiline ? 'mt-1 whitespace-pre-wrap break-words' : 'mt-1 break-words font-medium'}>{value}</p>
    </div>
  );
}
