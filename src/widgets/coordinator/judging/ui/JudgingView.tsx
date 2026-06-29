import { CheckCircle2, Loader2, Shuffle, Users } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import { statusVariant, useJudgingView } from '../model/useJudgingView';
import { BoardDetailDialog } from './BoardDetailDialog';

function getInitials(value?: string | null) {
  return (value || '?')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Judging() {
  const view = useJudgingView();
  const previewBoards = view.randomizationPreview?.boards || [];
  const previewGridClassName =
    previewBoards.length <= 1
      ? 'grid-cols-1'
      : previewBoards.length === 2
        ? 'grid-cols-2'
        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Judging Management</h1>
          <p className="text-sm text-muted-foreground">
            Randomize eligible teams into boards, confirm lineups, and track judging progress.
          </p>
        </div>
        <Button
          onClick={() => view.setShowRandomizeConfirm(true)}
          disabled={!view.activeRound || view.randomizePreviewMutation.isPending}
        >
          {view.randomizePreviewMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Shuffle className="mr-2 h-4 w-4" />
          )}
          Randomize Boards
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="w-full md:w-72">
          <Select
            value={view.activeEvent?.id || ''}
            onValueChange={view.setSelectedEventId}
            disabled={view.eventsQuery.isLoading}
          >
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
        <div className="w-full md:w-72">
          <Select
            value={view.activeRound?.id || ''}
            onValueChange={view.setSelectedRoundId}
            disabled={!view.activeEvent || view.roundsQuery.isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={view.roundsQuery.isLoading ? 'Loading rounds...' : 'Select round'} />
            </SelectTrigger>
            <SelectContent>
              {view.rounds.map((round) => (
                <SelectItem key={round.id} value={round.id}>
                  {round.name} ({round.roundType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {view.boardsQuery.isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading judging boards</AlertTitle>
          <AlertDescription>The system is fetching judging board data...</AlertDescription>
        </Alert>
      )}

      {view.boardsQuery.error && (
        <Alert>
          <AlertTitle>Unable to load judging boards</AlertTitle>
          <AlertDescription>
            {view.boardsQuery.error instanceof Error ? view.boardsQuery.error.message : 'Please try again later.'}
          </AlertDescription>
        </Alert>
      )}

      {!view.boardsQuery.isLoading && view.activeRound && view.boards.length === 0 && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>No judging boards yet</AlertTitle>
          <AlertDescription>
            Randomize eligible teams, review the preview, then confirm the official board lineup.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {view.boards.map((board) => (
          <Card key={board.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{board.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {board.teams.length} / {board.maxTeams} teams
                  </p>
                </div>
                <Badge variant={statusVariant(board.status)}>{board.status.replace('_', ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">
                    {Math.round((board.teams.length / Math.max(board.maxTeams, 1)) * 100)}%
                  </span>
                </div>
                <Progress value={Math.round((board.teams.length / Math.max(board.maxTeams, 1)) * 100)} />
              </div>

              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Judges ({board.judges.length})
                </h4>
                {board.judges.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No judges assigned yet</p>
                ) : (
                  <div className="space-y-1">
                    {board.judges.slice(0, 3).map((judge) => (
                      <div key={judge.id} className="flex items-center gap-2 rounded-lg bg-gray-50 p-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-blue-100 text-xs text-blue-700">
                            {getInitials(judge.fullName || judge.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{judge.fullName || judge.email}</span>
                      </div>
                    ))}
                    {board.judges.length > 3 && (
                      <p className="ml-1 text-xs text-muted-foreground">+{board.judges.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>

              <Button variant="outline" className="w-full" onClick={() => view.setSelectedBoard(board)}>
                View Board Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {view.boards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Judging Board Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-medium">Total Teams</h3>
                <p className="text-2xl font-semibold">{view.totalTeams}</p>
                <p className="mt-1 text-xs text-muted-foreground">Across {view.boards.length} boards</p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-medium">Board Count</h3>
                <p className="text-2xl font-semibold">{view.boards.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Active in this round</p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-medium">Assigned Judges</h3>
                <p className="text-2xl font-semibold">{view.totalJudges}</p>
                <p className="mt-1 text-xs text-muted-foreground">Total unique judges</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={view.showRandomizeConfirm} onOpenChange={view.setShowRandomizeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Randomize Board Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              The system will take eligible teams from <strong>{view.activeEvent?.title}</strong>, create a random
              assignment plan for the current round, and show a preview for confirmation before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => view.randomizePreviewMutation.mutate()}>
              <Shuffle className="mr-2 h-4 w-4" />
              Randomize Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={view.showRandomizationPreview} onOpenChange={view.setShowRandomizationPreview}>
        <DialogContent
          className="flex max-h-[92vh] !w-[min(90vw,1040px)] !max-w-[1040px] flex-col overflow-hidden p-0"
          style={{ width: 'min(90vw, 1040px)', maxWidth: '1040px' }}
        >
          <div className="flex-shrink-0 px-5 pt-5 sm:px-6 sm:pt-6">
          <DialogHeader>
            <DialogTitle>Preview Board Lineup</DialogTitle>
            <DialogDescription>
              {view.randomizationPreview
                ? `There are ${view.randomizationPreview.eligibleTeamCount} eligible teams and ${view.randomizationPreview.ineligibleTeamCount} ineligible teams. The assignment is saved only after confirmation.`
                : 'No preview data available.'}
            </DialogDescription>
          </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className={`grid w-full items-stretch gap-4 ${previewGridClassName}`}>
            {previewBoards.map((board) => (
              <Card key={board.boardNumber} className="min-w-0 w-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{board.name}</CardTitle>
                    <Badge variant="secondary">
                      {board.teams.length} / {board.maxTeams}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {board.teams.map((team) => (
                    <div key={team.id} className="rounded-md border px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{team.name}</span>
                        <span className="text-xs text-muted-foreground">Slot {team.placementSlot}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{team.projectName || team.chapterName || team.id}</p>
                    </div>
                  ))}
                  {board.teams.length === 0 && (
                    <p className="text-sm text-muted-foreground">No teams assigned to this board yet.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          </div>
          <div className="flex flex-shrink-0 justify-end gap-2 border-t bg-background px-5 py-4 sm:px-6">
            <Button
              variant="outline"
              onClick={() => view.randomizePreviewMutation.mutate()}
              disabled={view.randomizePreviewMutation.isPending}
            >
              {view.randomizePreviewMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shuffle className="mr-2 h-4 w-4" />
              )}
              Randomize Again
            </Button>
            <Button
              onClick={() => view.confirmRandomizationMutation.mutate()}
              disabled={view.confirmRandomizationMutation.isPending}
            >
              {view.confirmRandomizationMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirm Lineup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={view.showAssignedResult} onOpenChange={view.setShowAssignedResult}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Confirmation Successful
            </DialogTitle>
            <DialogDescription>
              The lineup has been locked into {view.assignedBoards.length} judging boards.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            {view.assignedBoards.map((board) => (
              <div key={board.id} className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm font-medium">{board.name}</p>
                <Badge variant="secondary">{board.teams.length} teams</Badge>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <Button onClick={() => view.setShowAssignedResult(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <BoardDetailDialog
        board={view.selectedBoard}
        open={Boolean(view.selectedBoard)}
        onClose={() => view.setSelectedBoard(null)}
        roundId={view.activeRound?.id || ''}
      />
    </div>
  );
}
