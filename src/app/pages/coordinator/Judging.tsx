import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Shuffle, Users, Trophy, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { mockJudgingBoards } from '../../../lib/data';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
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
import { toast } from 'sonner';

type Board = typeof mockJudgingBoards[number];

const boardTeams: Record<string, { name: string; score: number | null; status: string }[]> = {
  'board-1': [
    { name: 'Data Ninjas', score: 92, status: 'scored' },
    { name: 'Code Wizards', score: 85, status: 'scored' },
    { name: 'AI Avengers', score: 79, status: 'scored' },
    { name: 'Cloud Chasers', score: 75, status: 'scored' },
    { name: 'Neural Net', score: 71, status: 'scored' },
    { name: 'Byte Busters', score: 68, status: 'in-progress' },
    { name: 'Stack Overflow', score: null, status: 'pending' },
    { name: 'DevOps Dragons', score: null, status: 'pending' },
    { name: 'API Architects', score: null, status: 'pending' },
    { name: 'Lambda Lions', score: null, status: 'pending' },
  ],
  'board-2': [
    { name: 'React Rangers', score: 88, status: 'scored' },
    { name: 'Vue Vanguard', score: 84, status: 'scored' },
    { name: 'Node Knights', score: 77, status: 'scored' },
    { name: 'Python Pirates', score: 74, status: 'scored' },
    { name: 'Go Getters', score: 72, status: 'scored' },
    { name: 'Rust Rebels', score: 69, status: 'in-progress' },
    { name: 'TypeScript Titans', score: null, status: 'pending' },
    { name: 'Docker Dynamos', score: null, status: 'pending' },
    { name: 'K8s Krew', score: null, status: 'pending' },
    { name: 'GraphQL Guild', score: null, status: 'pending' },
  ],
  'board-3': [
    { name: 'Agile Aces', score: 81, status: 'scored' },
    { name: 'Scrum Stars', score: 76, status: 'scored' },
    { name: 'Kanban Kings', score: null, status: 'in-progress' },
    { name: 'Sprint Squad', score: null, status: 'pending' },
    { name: 'Backlog Busters', score: null, status: 'pending' },
    { name: 'Retro Rockets', score: null, status: 'pending' },
    { name: 'Velocity Vipers', score: null, status: 'pending' },
    { name: 'Epic Eagles', score: null, status: 'pending' },
  ],
};

export function Judging() {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [showAutoAssignConfirm, setShowAutoAssignConfirm] = useState(false);
  const [autoAssignDone, setAutoAssignDone] = useState(false);

  function handleAutoAssign() {
    setShowAutoAssignConfirm(false);
    setAutoAssignDone(true);
    toast.success('Teams auto-assigned successfully across 3 judging boards');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Judging Management</h1>
          <p className="text-sm text-muted-foreground">
            Assign teams to judging boards and monitor evaluation progress
          </p>
        </div>
        <Button onClick={() => setShowAutoAssignConfirm(true)}>
          <Shuffle className="w-4 h-4 mr-2" />
          Auto-Assign Teams
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockJudgingBoards.map((board) => (
          <Card key={board.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{board.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {board.teams} teams assigned
                  </p>
                </div>
                <Badge
                  variant={
                    board.status === 'scoring'
                      ? 'default'
                      : board.status === 'assigned'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {board.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Evaluation Progress</span>
                  <span className="font-medium">{board.progress}%</span>
                </div>
                <Progress value={board.progress} />
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Assigned Judges
                </h4>
                <div className="space-y-2">
                  {board.judges.map((judge, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {judge
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{judge}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Top 2 Teams
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between p-2 bg-yellow-50 rounded">
                    <span>1. Data Ninjas</span>
                    <span className="font-medium">92</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>2. Code Wizards</span>
                    <span className="font-medium">85</span>
                  </div>
                </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Board Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium mb-2">Total Teams</h3>
              <p className="text-2xl font-semibold">28</p>
              <p className="text-xs text-muted-foreground mt-1">Across 3 boards</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium mb-2">Finalists</h3>
              <p className="text-2xl font-semibold">6</p>
              <p className="text-xs text-muted-foreground mt-1">Top 2 from each board</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium mb-2">Total Judges</h3>
              <p className="text-2xl font-semibold">6</p>
              <p className="text-xs text-muted-foreground mt-1">2 per board</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Assign Confirmation */}
      <AlertDialog open={showAutoAssignConfirm} onOpenChange={setShowAutoAssignConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auto-Assign Teams</AlertDialogTitle>
            <AlertDialogDescription>
              This will automatically distribute all 28 registered teams evenly across the 3 judging
              boards (~9–10 teams per board) using a randomized balanced assignment algorithm.
              Any existing manual assignments will be overwritten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAutoAssign}>
              <Shuffle className="w-4 h-4 mr-2" />
              Auto-Assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Auto-Assign Done Confirmation */}
      <Dialog open={autoAssignDone} onOpenChange={setAutoAssignDone}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Assignment Complete
            </DialogTitle>
            <DialogDescription>
              Teams have been successfully distributed across all judging boards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {mockJudgingBoards.map((board) => (
              <div
                key={board.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{board.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {board.judges.join(', ')}
                  </p>
                </div>
                <Badge variant="secondary">{board.teams} teams</Badge>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <Button onClick={() => setAutoAssignDone(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Board Details Dialog */}
      {selectedBoard && (
        <Dialog open={!!selectedBoard} onOpenChange={() => setSelectedBoard(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedBoard.name} — Details</span>
              </DialogTitle>
              <DialogDescription>
                Full team list, scores, and judge assignments for {selectedBoard.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* Judges */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Judges
                </h3>
                <div className="flex gap-2">
                  {selectedBoard.judges.map((judge, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-blue-200 text-blue-800 text-xs">
                          {judge.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{judge}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold">Evaluation Progress</span>
                  <span className="font-medium">{selectedBoard.progress}%</span>
                </div>
                <Progress value={selectedBoard.progress} />
              </div>

              {/* Teams Table */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Assigned Teams ({selectedBoard.teams})
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
                      {(boardTeams[selectedBoard.id] ?? []).map((team, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium">{team.name}</td>
                          <td className="px-3 py-2">
                            {team.status === 'scored' ? (
                              <span className="inline-flex items-center gap-1 text-green-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Scored
                              </span>
                            ) : team.status === 'in-progress' ? (
                              <span className="inline-flex items-center gap-1 text-amber-600">
                                <AlertCircle className="w-3.5 h-3.5" />
                                In Progress
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Pending</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {team.score !== null ? (
                              <span
                                className={
                                  team.score >= 85
                                    ? 'text-green-700'
                                    : team.score >= 70
                                    ? 'text-blue-700'
                                    : 'text-muted-foreground'
                                }
                              >
                                {team.score}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setSelectedBoard(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
