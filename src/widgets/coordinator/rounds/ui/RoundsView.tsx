import { Calendar, Loader2, MoreVertical, Plus, Users } from 'lucide-react';

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
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  createEmptyRoundForm,
  formatDateTimeDisplay,
} from '../model/round-form';
import { useRoundsView } from '../model/useRoundsView';
import { RoundForm } from './RoundForm';

export function Rounds() {
  const view = useRoundsView();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Rounds Management</h1>
          <p className="text-sm text-muted-foreground">
            Configure competition rounds, scoring windows, assigned teams, and assigned judges.
          </p>
        </div>
        <div className="flex shrink-0">
          <Dialog
            open={view.createOpen}
            onOpenChange={(open) => {
              view.setCreateOpen(open);
              if (!open) view.setCreateForm(createEmptyRoundForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!view.activeEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Create Round
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Round</DialogTitle>
                <DialogDescription>Set up a new round for {view.activeEvent?.title || 'the selected event'}.</DialogDescription>
              </DialogHeader>
              <RoundForm
                form={view.createForm}
                onChange={view.setCreateForm}
                tracks={view.tracks}
                rubrics={view.rubrics}
                teams={view.filterTeamsByTrack(view.teams, view.createForm.trackId)}
                judges={view.judges}
                event={view.activeEvent}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => view.setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={view.submitCreateRound}
                  disabled={view.createMutation.isPending || !view.createForm.name.trim()}
                >
                  {view.createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Round'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(view.eventsQuery.error || view.roundsQuery.error || view.tracksQuery.error || view.rubricsQuery.error || view.teamsQuery.error || view.judgesQuery.error) && (
        <Alert>
          <AlertTitle>Unable to load rounds</AlertTitle>
          <AlertDescription>
            {view.getRoundErrorMessage(
              view.eventsQuery.error ||
              view.roundsQuery.error ||
              view.tracksQuery.error ||
              view.rubricsQuery.error ||
              view.teamsQuery.error ||
              view.judgesQuery.error
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Round</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Teams</TableHead>
              <TableHead>Judges</TableHead>
              <TableHead>Window</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(view.eventsQuery.isLoading || view.roundsQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading rounds...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!view.eventsQuery.isLoading && !view.roundsQuery.isLoading && view.rounds.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No rounds found for this event.
                </TableCell>
              </TableRow>
            )}

            {view.rounds.map((round) => (
              <TableRow key={round.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{round.name}</p>
                      <p className="text-xs text-muted-foreground">{round.roundType}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{round.track?.name || 'All tracks'}</TableCell>
                <TableCell>
                  <Badge variant={round.status === 'COMPLETED' ? 'default' : round.status === 'CLOSED' ? 'secondary' : 'outline'}>
                    {round.status}
                  </Badge>
                </TableCell>
                <TableCell>{round.assignedTeamIds.length}</TableCell>
                <TableCell>{round.assignedJudgeIds?.length || 0}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTimeDisplay(round.startTime)}
                  <br />
                  {formatDateTimeDisplay(round.endTime)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          view.setSelectedRound(round);
                          view.setEditForm(view.mapRoundToForm(round));
                          view.setEditOpen(true);
                        }}
                      >
                        Edit round
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          view.setSelectedRound(round);
                          view.setDeleteOpen(true);
                        }}
                      >
                        Delete round
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
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Round</DialogTitle>
            <DialogDescription>Update the round, assigned teams, and judges.</DialogDescription>
          </DialogHeader>
          <RoundForm
            form={view.editForm}
            onChange={view.setEditForm}
            tracks={view.tracks}
            rubrics={view.rubrics}
            teams={view.filterTeamsByTrack(view.teams, view.editForm.trackId)}
            judges={view.judges}
            event={view.activeEvent}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => view.setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={view.submitUpdateRound}
              disabled={view.updateMutation.isPending || !view.editForm.name.trim()}
            >
              {view.updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={view.deleteOpen} onOpenChange={view.setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete round</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{view.selectedRound?.name}"? It will no longer be available in this event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => view.selectedRound && view.deleteMutation.mutate(view.selectedRound.id)}
            >
              {view.deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
