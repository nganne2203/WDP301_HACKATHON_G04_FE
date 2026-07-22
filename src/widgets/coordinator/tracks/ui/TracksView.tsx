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
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Track Management</h1>
          <p className="text-sm text-muted-foreground">
            Create tracks and manage team capacity for this competition.
          </p>
        </div>
        <div className="flex shrink-0">
          <Dialog
            open={view.createOpen}
            onOpenChange={(open) => {
              view.setCreateOpen(open);
              if (!open) view.setCreateForm(createEmptyTrackForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!view.activeCompetition}>
                <Plus className="mr-2 h-4 w-4" />
                Create Track
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0">
              <div className="flex-shrink-0 px-6 pt-6">
              <DialogHeader>
                <DialogTitle>Create Track</DialogTitle>
                <DialogDescription>
                  Add a new track for {view.activeCompetition?.title || 'the selected competition'}.
                </DialogDescription>
              </DialogHeader>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6">
              <TrackForm form={view.createForm} onChange={view.setCreateForm} />
              </div>
              <div className="flex flex-shrink-0 justify-end gap-2 border-t bg-background px-6 py-4">
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
        <TrackMetricCard label="Total Tracks" value={String(view.tracks.length)} helper="Tracks in selected competition" />
        <TrackMetricCard label="Open or Completed" value={String(view.confirmedTracks)} helper="Operational tracks" />
        <TrackMetricCard
          label="Total Capacity"
          value={String(view.tracks.reduce((sum, track) => sum + (track.maxTeams || 0), 0))}
          helper="Configured max teams"
        />
      </div>

      {view.eventsQuery.error && (
        <TrackInlineError message={view.eventsQuery.error instanceof ApiError ? view.eventsQuery.error.firstError : 'Failed to load competitions'} />
      )}

      {!view.activeCompetition && !view.eventsQuery.isLoading && (
        <TrackInlineError message="No competition available. Create an competition first before managing tracks." />
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
                  No tracks found for this competition.
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
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0">
          <div className="flex-shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
            <DialogDescription>Update the track details and team capacity.</DialogDescription>
          </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <TrackForm form={view.editForm} onChange={view.setEditForm} />
          </div>
          <div className="flex flex-shrink-0 justify-end gap-2 border-t bg-background px-6 py-4">
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
              Delete "{view.selectedTrack?.name}" from this competition? This cannot be undone.
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
