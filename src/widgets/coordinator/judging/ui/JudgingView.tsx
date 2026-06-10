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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Judging Management</h1>
          <p className="text-sm text-muted-foreground">
            Assign teams to judging boards and monitor evaluation progress
          </p>
        </div>
        <Button onClick={() => view.setShowAutoAssignConfirm(true)} disabled={!view.activeRound || view.autoAssignMutation.isPending}>
          {view.autoAssignMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shuffle className="w-4 h-4 mr-2" />}
          Auto-Assign Teams
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="w-full md:w-72">
          <Select value={view.activeEvent?.id || ''} onValueChange={view.setSelectedEventId} disabled={view.eventsQuery.isLoading}>
            <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
            <SelectContent>
              {view.events.map((event) => (
                <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-72">
          <Select value={view.activeRound?.id || ''} onValueChange={view.setSelectedRoundId} disabled={!view.activeEvent || view.roundsQuery.isLoading}>
            <SelectTrigger>
              <SelectValue placeholder={view.roundsQuery.isLoading ? 'Loading rounds...' : 'Select round'} />
            </SelectTrigger>
            <SelectContent>
              {view.rounds.map((round) => (
                <SelectItem key={round.id} value={round.id}>{round.name} ({round.roundType})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {view.boardsQuery.isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading boards</AlertTitle>
          <AlertDescription>Fetching judging board data...</AlertDescription>
        </Alert>
      )}

      {view.boardsQuery.error && (
        <Alert>
          <AlertTitle>Could not load judging boards</AlertTitle>
          <AlertDescription>
            {view.boardsQuery.error instanceof Error ? view.boardsQuery.error.message : 'Please try again later.'}
          </AlertDescription>
        </Alert>
      )}

      {!view.boardsQuery.isLoading && view.activeRound && view.boards.length === 0 && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>No judging boards yet</AlertTitle>
          <AlertDescription>Use Auto-Assign to distribute confirmed teams across boards.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {view.boards.map((board) => (
          <Card key={board.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{board.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {board.teams.length} / {board.maxTeams} teams
                  </p>
                </div>
                <Badge variant={statusVariant(board.status)}>{board.status.replace('_', ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">{Math.round((board.teams.length / Math.max(board.maxTeams, 1)) * 100)}%</span>
                </div>
                <Progress value={Math.round((board.teams.length / Math.max(board.maxTeams, 1)) * 100)} />
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Judges ({board.judges.length})
                </h4>
                {board.judges.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No judges assigned</p>
                ) : (
                  <div className="space-y-1">
                    {board.judges.slice(0, 3).map((judge) => (
                      <div key={judge.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {getInitials(judge.fullName || judge.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{judge.fullName || judge.email}</span>
                      </div>
                    ))}
                    {board.judges.length > 3 && <p className="text-xs text-muted-foreground ml-1">+{board.judges.length - 3} more</p>}
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
            <CardTitle>Board Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium mb-2">Total Teams</h3>
                <p className="text-2xl font-semibold">{view.totalTeams}</p>
                <p className="text-xs text-muted-foreground mt-1">Across {view.boards.length} boards</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium mb-2">Boards</h3>
                <p className="text-2xl font-semibold">{view.boards.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Active judging boards</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium mb-2">Judges Assigned</h3>
                <p className="text-2xl font-semibold">{view.totalJudges}</p>
                <p className="text-xs text-muted-foreground mt-1">Unique judges across boards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={view.showAutoAssignConfirm} onOpenChange={view.setShowAutoAssignConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auto-Assign Teams</AlertDialogTitle>
            <AlertDialogDescription>
              This will randomly distribute all confirmed teams from <strong>{view.activeEvent?.title}</strong> across judging boards (~10 teams per board).
              Existing boards for this round will be replaced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => view.autoAssignMutation.mutate()}>
              <Shuffle className="w-4 h-4 mr-2" />
              Auto-Assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={view.showAssignedResult} onOpenChange={view.setShowAssignedResult}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Assignment Complete
            </DialogTitle>
            <DialogDescription>Teams distributed successfully across {view.assignedBoards.length} boards.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {view.assignedBoards.map((board) => (
              <div key={board.id} className="flex items-center justify-between p-3 border rounded-lg">
                <p className="font-medium text-sm">{board.name}</p>
                <Badge variant="secondary">{board.teams.length} teams</Badge>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <Button onClick={() => view.setShowAssignedResult(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      <BoardDetailDialog board={view.selectedBoard} open={Boolean(view.selectedBoard)} onClose={() => view.setSelectedBoard(null)} roundId={view.activeRound?.id || ''} />
    </div>
  );
}
