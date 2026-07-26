import { useState } from 'react';
import { Calendar, Loader2, MoreVertical, Plus } from 'lucide-react';
import type { Round } from '@/shared/api/types';

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
  const [detailsRound, setDetailsRound] = useState<Round | null>(null);

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
              <Button
                disabled={!view.activeCompetition || view.roundsReadOnly}
                title={view.roundsReadOnly ? 'Rounds are view-only after the competition has been completed or archived.' : undefined}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Round
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] !w-[min(48rem,calc(100vw-2rem))] !max-w-none overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Round</DialogTitle>
                <DialogDescription>Set up a new round for {view.activeCompetition?.title || 'the selected competition'}.</DialogDescription>
              </DialogHeader>
              <RoundForm
                form={view.createForm}
                onChange={view.setCreateForm}
                tracks={view.tracks}
                rubrics={view.rubrics}
                judges={view.judges}
                competition={view.activeCompetition}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => view.setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={view.submitCreateRound}
                  disabled={view.roundsReadOnly || view.createMutation.isPending || !view.createForm.name.trim()}
                >
                  {view.createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Round'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(view.eventsQuery.error || view.roundsQuery.error || view.tracksQuery.error || view.rubricsQuery.error || view.judgesQuery.error) && (
        <Alert>
          <AlertTitle>Unable to load rounds</AlertTitle>
          <AlertDescription>
            {view.getRoundErrorMessage(
              view.eventsQuery.error ||
              view.roundsQuery.error ||
              view.tracksQuery.error ||
              view.rubricsQuery.error ||
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
                  No rounds found for this competition.
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
                      <DropdownMenuItem onClick={() => setDetailsRound(round)}>
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={view.roundsReadOnly}
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
                        disabled={view.roundsReadOnly}
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

      <Dialog open={Boolean(detailsRound)} onOpenChange={(open) => { if (!open) setDetailsRound(null); }}>
        <DialogContent className="flex max-h-[90vh] !w-[min(48rem,calc(100vw-2rem))] !max-w-none flex-col overflow-hidden p-0">
          <div className="flex-shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>{detailsRound?.name || 'Round details'}</DialogTitle>
            <DialogDescription>View the round configuration, assigned teams, and judges.</DialogDescription>
          </DialogHeader>
          </div>
          {detailsRound && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <RoundForm
                assignedTeams={detailsRound.assignedTeams}
                competition={view.activeCompetition}
                form={view.mapRoundToForm(detailsRound)}
                judges={detailsRound.assignedJudges || []}
                onChange={() => undefined}
                readOnly
                rubrics={view.rubrics}
                tracks={view.tracks}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={view.editOpen} onOpenChange={view.setEditOpen}>
        <DialogContent className="max-h-[85vh] !w-[min(48rem,calc(100vw-2rem))] !max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Round</DialogTitle>
            <DialogDescription>Update the round, assigned teams, and judges.</DialogDescription>
          </DialogHeader>
          <RoundForm
            form={view.editForm}
            onChange={view.setEditForm}
            tracks={view.tracks}
            rubrics={view.rubrics}
            judges={view.judges}
            competition={view.activeCompetition}
            assignedTeams={view.selectedRound?.assignedTeams}
            readOnly={view.roundsReadOnly}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => view.setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={view.submitUpdateRound}
              disabled={view.roundsReadOnly || view.updateMutation.isPending || !view.editForm.name.trim()}
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
              Delete "{view.selectedRound?.name}"? It will no longer be available in this competition.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={view.roundsReadOnly || view.deleteMutation.isPending}
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
