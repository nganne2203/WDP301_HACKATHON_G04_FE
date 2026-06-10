import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Shuffle, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { eventsApi } from '../../../lib/api/events';
import { roundsApi } from '../../../lib/api/rounds';
import { judgingBoardsApi } from '../../../lib/api/judging-boards';
import { scoringApi } from '../../../lib/api/scoring';
import type { JudgingBoard, Round } from '../../../lib/api/types';

function getInitials(value?: string | null) {
  return (value || '?')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function statusVariant(status: string) {
  if (status === 'SCORING') return 'default' as const;
  if (status === 'ASSIGNED' || status === 'COMPLETED') return 'secondary' as const;
  return 'outline' as const;
}

function BoardDetailDialog({
  board,
  open,
  onClose,
  roundId,
}: {
  board: JudgingBoard | null;
  open: boolean;
  onClose: () => void;
  roundId: string;
}) {
  const sheetsQuery = useQuery({
    queryKey: ['scoring-sheets-board', roundId, board?.id],
    enabled: open && Boolean(board?.id),
    queryFn: () => scoringApi.listSheets({ roundId, boardId: board!.id, limit: 100 }),
  });

  const sheets = sheetsQuery.data?.data || [];
  const teamScoreMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of sheets) {
      if (s.status === 'SUBMITTED' || s.status === 'LOCKED') {
        if (!m[s.teamId] || s.finalScore > m[s.teamId]) {
          m[s.teamId] = s.finalScore;
        }
      }
    }
    return m;
  }, [sheets]);

  if (!board) return null;

  const scoredCount = board.teams.filter((t) => teamScoreMap[t.id] !== undefined).length;
  const progress = board.teams.length > 0 ? Math.round((scoredCount / board.teams.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{board.name} — Details</DialogTitle>
          <DialogDescription>
            Team list, scores, and judge assignments for {board.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Judges
            </h3>
            {board.judges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No judges assigned yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {board.judges.map((j) => (
                  <div key={j.id} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-blue-200 text-blue-800 text-xs">
                        {getInitials(j.fullName || j.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{j.fullName || j.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-semibold">Evaluation Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Assigned Teams ({board.teams.length})
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">#</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Team</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {board.teams.map((team, idx) => {
                    const score = teamScoreMap[team.id];
                    return (
                      <tr key={team.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium">{team.name}</td>
                        <td className="px-3 py-2">
                          {score !== undefined ? (
                            <span className="inline-flex items-center gap-1 text-green-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Scored
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {score !== undefined ? (
                            <span className={score >= 85 ? 'text-green-700' : score >= 70 ? 'text-blue-700' : 'text-muted-foreground'}>
                              {score.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Judging() {
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<JudgingBoard | null>(null);
  const [showAutoAssignConfirm, setShowAutoAssignConfirm] = useState(false);
  const [assignedBoards, setAssignedBoards] = useState<JudgingBoard[]>([]);
  const [showAssignedResult, setShowAssignedResult] = useState(false);

  const eventsQuery = useQuery({
    queryKey: ['coordinator-judging-events'],
    queryFn: () => eventsApi.list({ page: 1, limit: 100 }),
  });

  const events = eventsQuery.data?.data || [];
  const activeEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || events[0] || null,
    [events, selectedEventId]
  );

  const roundsQuery = useQuery({
    queryKey: ['coordinator-judging-rounds', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: () => roundsApi.list({ eventId: activeEvent!.id, limit: 100 }),
  });

  const rounds: Round[] = roundsQuery.data?.data || [];
  const activeRound = useMemo(
    () => rounds.find((r) => r.id === selectedRoundId) || rounds[0] || null,
    [rounds, selectedRoundId]
  );

  const boardsQuery = useQuery({
    queryKey: ['coordinator-judging-boards', activeRound?.id],
    enabled: Boolean(activeRound?.id),
    queryFn: () => judgingBoardsApi.list({ roundId: activeRound!.id, limit: 100 }),
  });

  const boards: JudgingBoard[] = boardsQuery.data?.data || [];
  const totalTeams = boards.reduce((sum, b) => sum + b.teams.length, 0);
  const totalJudges = new Set(boards.flatMap((b) => b.judgeIds)).size;

  const autoAssignMutation = useMutation({
    mutationFn: () =>
      judgingBoardsApi.autoAssign({ eventId: activeEvent!.id, roundId: activeRound!.id, teamsPerBoard: 10 }),
    onSuccess: (res) => {
      const created = res.data || [];
      setAssignedBoards(created);
      setShowAutoAssignConfirm(false);
      setShowAssignedResult(true);
      queryClient.invalidateQueries({ queryKey: ['coordinator-judging-boards'] });
      toast.success(`Auto-assigned teams across ${created.length} judging boards`);
    },
    onError: () => {
      toast.error('Failed to auto-assign teams');
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Judging Management</h1>
          <p className="text-sm text-muted-foreground">
            Assign teams to judging boards and monitor evaluation progress
          </p>
        </div>
        <Button
          onClick={() => setShowAutoAssignConfirm(true)}
          disabled={!activeRound || autoAssignMutation.isPending}
        >
          {autoAssignMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Shuffle className="w-4 h-4 mr-2" />
          )}
          Auto-Assign Teams
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="w-full md:w-72">
          <Select
            value={activeEvent?.id || ''}
            onValueChange={setSelectedEventId}
            disabled={eventsQuery.isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-72">
          <Select
            value={activeRound?.id || ''}
            onValueChange={setSelectedRoundId}
            disabled={!activeEvent || roundsQuery.isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={roundsQuery.isLoading ? 'Loading rounds…' : 'Select round'} />
            </SelectTrigger>
            <SelectContent>
              {rounds.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name} ({r.roundType})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {boardsQuery.isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading boards</AlertTitle>
          <AlertDescription>Fetching judging board data…</AlertDescription>
        </Alert>
      )}

      {!boardsQuery.isLoading && activeRound && boards.length === 0 && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>No judging boards yet</AlertTitle>
          <AlertDescription>Use Auto-Assign to distribute confirmed teams across boards.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {boards.map((board) => (
          <Card key={board.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{board.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {board.teams.length} / {board.maxTeams} teams
                  </p>
                </div>
                <Badge variant={statusVariant(board.status)}>
                  {board.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">
                    {Math.round((board.teams.length / Math.max(board.maxTeams, 1)) * 100)}%
                  </span>
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
                    {board.judges.slice(0, 3).map((j) => (
                      <div key={j.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {getInitials(j.fullName || j.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{j.fullName || j.email}</span>
                      </div>
                    ))}
                    {board.judges.length > 3 && (
                      <p className="text-xs text-muted-foreground ml-1">+{board.judges.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedBoard(board)}
              >
                View Board Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {boards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Board Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium mb-2">Total Teams</h3>
                <p className="text-2xl font-semibold">{totalTeams}</p>
                <p className="text-xs text-muted-foreground mt-1">Across {boards.length} boards</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium mb-2">Boards</h3>
                <p className="text-2xl font-semibold">{boards.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Active judging boards</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium mb-2">Judges Assigned</h3>
                <p className="text-2xl font-semibold">{totalJudges}</p>
                <p className="text-xs text-muted-foreground mt-1">Unique judges across boards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showAutoAssignConfirm} onOpenChange={setShowAutoAssignConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auto-Assign Teams</AlertDialogTitle>
            <AlertDialogDescription>
              This will randomly distribute all confirmed teams from{' '}
              <strong>{activeEvent?.title}</strong> across judging boards (~10 teams per board).
              Existing boards for this round will be replaced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => autoAssignMutation.mutate()}>
              <Shuffle className="w-4 h-4 mr-2" />
              Auto-Assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAssignedResult} onOpenChange={setShowAssignedResult}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Assignment Complete
            </DialogTitle>
            <DialogDescription>
              Teams distributed successfully across {assignedBoards.length} boards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {assignedBoards.map((board) => (
              <div key={board.id} className="flex items-center justify-between p-3 border rounded-lg">
                <p className="font-medium text-sm">{board.name}</p>
                <Badge variant="secondary">{board.teams.length} teams</Badge>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <Button onClick={() => setShowAssignedResult(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      <BoardDetailDialog
        board={selectedBoard}
        open={!!selectedBoard}
        onClose={() => setSelectedBoard(null)}
        roundId={activeRound?.id || ''}
      />
    </div>
  );
}
