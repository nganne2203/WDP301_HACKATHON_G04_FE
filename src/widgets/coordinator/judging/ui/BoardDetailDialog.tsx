import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';

import { scoringApi } from '@/entities/score-sheet/api';
import { submissionsApi } from '@/entities/submission/api';
import { queryKeys } from '@/lib/queryKeys';
import type { JudgingBoard } from '@/shared/api/types';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

function getInitials(value?: string | null) {
  return (value || '?')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function BoardDetailDialog({
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
  const queryClient = useQueryClient();
  const sheetsQuery = useQuery({
    queryKey: queryKeys.scoreSheets.list({ roundId, limit: 10 }),
    enabled: open && Boolean(board?.id),
    queryFn: () => scoringApi.listSheets({ roundId, limit: 10 }),
  });

  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions.list({ roundId, limit: 10 }),
    enabled: open && Boolean(roundId),
    queryFn: () => submissionsApi.list({ roundId, limit: 10 }),
  });

  const submissionStatusMutation = useMutation({
    mutationFn: ({ submissionId, status }: { submissionId: string; status: 'ACCEPTED' | 'REJECTED' }) =>
      submissionsApi.updateStatus(submissionId, status),
    onSuccess: async (_, variables) => {
      toast.success(`Submission marked as ${variables.status.toLowerCase()}`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.submissions.list({ roundId, limit: 10 }) });
    },
    onError: () => {
      toast.error('Failed to update submission status');
    },
  });

  const sheets = sheetsQuery.data?.data || [];
  const submissions = submissionsQuery.data?.data || [];
  const boardTeamIds = board ? new Set(board.teams.map((team) => team.id)) : new Set<string>();
  const submissionMap = useMemo(() => {
    const map: Record<string, (typeof submissions)[0]> = {};
    for (const submission of submissions) {
      if (boardTeamIds.has(submission.teamId)) {
        map[submission.teamId] = submission;
      }
    }
    return map;
  }, [boardTeamIds, submissions]);
  const teamScoreMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sheet of sheets) {
      if (boardTeamIds.has(sheet.teamId) && (sheet.status === 'SUBMITTED' || sheet.status === 'LOCKED')) {
        if (!map[sheet.teamId] || sheet.finalScore > map[sheet.teamId]) {
          map[sheet.teamId] = sheet.finalScore;
        }
      }
    }
    return map;
  }, [boardTeamIds, sheets]);

  if (!board) return null;

  const scoredCount = board.teams.filter((team) => teamScoreMap[team.id] !== undefined).length;
  const progress = board.teams.length > 0 ? Math.round((scoredCount / board.teams.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{board.name} - Details</DialogTitle>
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
                {board.judges.map((judge) => (
                  <div key={judge.id} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-blue-200 text-blue-800 text-xs">
                        {getInitials(judge.fullName || judge.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{judge.fullName || judge.email}</span>
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
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">#</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Team</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Submission</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Score</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {board.teams.map((team, index) => {
                    const score = teamScoreMap[team.id];
                    const submission = submissionMap[team.id];
                    return (
                      <tr key={team.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                        <td className="px-3 py-2 font-medium">{team.name}</td>
                        <td className="px-3 py-2">
                          {submission ? (
                            <div className="space-y-1">
                              <Badge variant={submission.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                                {submission.status}
                              </Badge>
                              <div className="flex flex-wrap gap-1 text-xs">
                                {submission.demoUrl && <a className="text-blue-700 underline" href={submission.demoUrl} target="_blank" rel="noreferrer">Demo</a>}
                                {submission.reportUrl && <a className="text-blue-700 underline" href={submission.reportUrl} target="_blank" rel="noreferrer">Report</a>}
                                {submission.presentationUrl && <a className="text-blue-700 underline" href={submission.presentationUrl} target="_blank" rel="noreferrer">Slides</a>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No submission</span>
                          )}
                        </td>
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
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {submission ? (
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" disabled={submissionStatusMutation.isPending || submission.status === 'ACCEPTED'} onClick={() => submissionStatusMutation.mutate({ submissionId: submission.id, status: 'ACCEPTED' })}>
                                Accept
                              </Button>
                              <Button variant="outline" size="sm" disabled={submissionStatusMutation.isPending || submission.status === 'REJECTED'} onClick={() => submissionStatusMutation.mutate({ submissionId: submission.id, status: 'REJECTED' })}>
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {submissionsQuery.isLoading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Loading submissions</AlertTitle>
              <AlertDescription>Loading team submissions for this round.</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
