import { GitBranch, Loader2, MoreVertical, Plus } from 'lucide-react';

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
  createEmptyTrackForm,
  formatTrackType,
} from '../model/track-form';
import { useTracksView } from '../model/useTracksView';
import { TrackForm, TrackInlineError, TrackMetricCard } from './TrackForm';

export function Tracks() {
  const view = useTracksView();

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
              if (!open) view.setCreateForm(createEmptyTrackForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!view.activeEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Create Track
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create Track</DialogTitle>
                <DialogDescription>
                  Add a new track for {view.activeEvent?.title || 'the selected event'}.
                </DialogDescription>
              </DialogHeader>
              <TrackForm form={view.createForm} onChange={view.setCreateForm} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => view.setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={view.handleCreate} disabled={view.createMutation.isPending}>
                  {view.createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Track'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TrackMetricCard label="Total Tracks" value={String(view.tracks.length)} helper="Tracks in selected event" />
        <TrackMetricCard label="Open or Completed" value={String(view.confirmedTracks)} helper="Operational tracks" />
        <TrackMetricCard
          label="Total Capacity"
          value={String(view.tracks.reduce((sum, track) => sum + (track.maxTeams || 0), 0))}
          helper="Configured max teams"
        />
      </div>

      {view.eventsQuery.error && (
        <TrackInlineError message={view.eventsQuery.error instanceof ApiError ? view.eventsQuery.error.firstError : 'Failed to load events'} />
      )}

      {!view.activeEvent && !view.eventsQuery.isLoading && (
        <TrackInlineError message="No event available. Create an event first before managing tracks." />
      )}

      {view.tracksQuery.error && (
        <TrackInlineError message={view.tracksQuery.error instanceof ApiError ? view.tracksQuery.error.firstError : 'Failed to load tracks'} />
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
            {(view.eventsQuery.isLoading || view.tracksQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading tracks...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!view.eventsQuery.isLoading && !view.tracksQuery.isLoading && view.tracks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No tracks found for this event.
                </TableCell>
              </TableRow>
            )}

            {view.tracks.map((track) => (
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
                      <DropdownMenuItem onClick={() => view.openEditDialog(track)}>
                        Edit track
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => view.openDeleteDialog(track)}>
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

      <Dialog open={view.editOpen} onOpenChange={view.setEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
            <DialogDescription>Update track metadata to match the current backend rules.</DialogDescription>
          </DialogHeader>
          <TrackForm form={view.editForm} onChange={view.setEditForm} />
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
            <AlertDialogTitle>Delete track</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{view.selectedTrack?.name}" from this event? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => view.selectedTrack && view.deleteMutation.mutate(view.selectedTrack.id)}
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
