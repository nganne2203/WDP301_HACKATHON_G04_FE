import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, FileText, Github, Loader2, Save, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Progress } from '../../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
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
import { ApiError } from '../../../lib/api/client';
import { eventsApi } from '../../../lib/api/events';
import { judgingBoardsApi } from '../../../lib/api/judging-boards';
import { roundsApi } from '../../../lib/api/rounds';
import { rubricsApi } from '../../../lib/api/rubrics';
import { scoringApi } from '../../../lib/api/scoring';
import { submissionsApi } from '../../../lib/api/submissions';
import type { Criterion, JudgingBoard, Round, ScoreSheet } from '../../../lib/api/types';
import { useStore } from '../../../store/useStore';

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Could not connect to server.';
}

export function JudgeScoring() {
  const queryClient = useQueryClient();
  const { user } = useStore();

  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [generalComment, setGeneralComment] = useState('');
  const [submitConfirm, setSubmitConfirm] = useState(false);

  const eventsQuery = useQuery({
    queryKey: ['judge-scoring-events'],
    queryFn: () => eventsApi.list({ page: 1, limit: 100 }),
  });
  const events = eventsQuery.data?.data || [];
  const activeEvent = useMemo(() => events.find((e) => e.id === selectedEventId) || events[0] || null, [events, selectedEventId]);

  const roundsQuery = useQuery({
    queryKey: ['judge-scoring-rounds', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: () => roundsApi.list({ eventId: activeEvent!.id, limit: 100 }),
  });
  const rounds: Round[] = roundsQuery.data?.data || [];
  const activeRound = useMemo(() => rounds.find((r) => r.id === selectedRoundId) || rounds[0] || null, [rounds, selectedRoundId]);

  const boardQuery = useQuery({
    queryKey: ['judge-board', activeRound?.id, user?.id],
    enabled: Boolean(activeRound?.id),
    queryFn: () => judgingBoardsApi.list({ roundId: activeRound!.id, limit: 100 }),
  });
  const myBoard: JudgingBoard | null = useMemo(() => {
    const boards = boardQuery.data?.data || [];
    return boards.find((b) => b.judgeIds.includes(user?.id || '')) || boards[0] || null;
  }, [boardQuery.data, user?.id]);

  const assignedTeams = myBoard?.teams || [];

  const submissionsQuery = useQuery({
    queryKey: ['judge-submissions', activeRound?.id],
    enabled: Boolean(activeRound?.id && assignedTeams.length > 0),
    queryFn: () => submissionsApi.list({ roundId: activeRound!.id, limit: 100 }),
  });
  const submissions = submissionsQuery.data?.data || [];
  const submissionByTeam = useMemo(() => {
    const m: Record<string, (typeof submissions)[0]> = {};
    for (const s of submissions) m[s.teamId] = s;
    return m;
  }, [submissions]);

  const rubricQuery = useQuery({
    queryKey: ['judge-rubric', activeRound?.rubricId],
    enabled: Boolean(activeRound?.rubricId),
    queryFn: () => rubricsApi.getById(activeRound!.rubricId!),
  });
  const criteria: Criterion[] = rubricQuery.data?.data?.criteria || [];
  const maxScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);

  const selectedTeam = assignedTeams.find((t) => t.id === selectedTeamId) || assignedTeams[0] || null;

  const sheetQuery = useQuery({
    queryKey: ['judge-sheet', activeRound?.id, selectedTeam?.id, user?.id],
    enabled: Boolean(activeRound?.id && selectedTeam?.id),
    queryFn: () => scoringApi.listSheets({ roundId: activeRound!.id, teamId: selectedTeam!.id, judgeId: user?.id }),
  });
  const existingSheet: ScoreSheet | null = sheetQuery.data?.data?.[0] || null;

  useEffect(() => {
    if (existingSheet) {
      const s: Record<string, number> = {};
      const c: Record<string, string> = {};
      for (const entry of existingSheet.scores) {
        if (entry.criterionId) {
          s[entry.criterionId] = entry.scoreValue;
          if (entry.comment) c[entry.criterionId] = entry.comment;
        }
      }
      setScores(s);
      setComments(c);
      setGeneralComment(existingSheet.generalComment || '');
    } else {
      setScores({});
      setComments({});
      setGeneralComment('');
    }
  }, [existingSheet?.id]);

  const totalScore = useMemo(
    () => Object.values(scores).reduce((sum, v) => sum + (v || 0), 0),
    [scores]
  );

  const saveMutation = useMutation({
    mutationFn: (submit: boolean) =>
      scoringApi.submitSheet({
        roundId: activeRound!.id,
        teamId: selectedTeam!.id,
        generalComment,
        submit,
        scores: Object.entries(scores).map(([criterionId, scoreValue]) => ({
          criterionId,
          scoreValue,
          comment: comments[criterionId] || null,
        })),
      }),
    onSuccess: (_, submit) => {
      queryClient.invalidateQueries({ queryKey: ['judge-sheet'] });
      toast.success(submit ? `Score sheet submitted for ${selectedTeam?.name}` : 'Draft saved');
      setSubmitConfirm(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const isSubmitted = existingSheet?.status === 'SUBMITTED' || existingSheet?.status === 'LOCKED';
  const submission = selectedTeam ? submissionByTeam[selectedTeam.id] : null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Score Teams</h1>
        <p className="text-sm text-muted-foreground">Evaluate teams assigned to your judging board</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="w-full md:w-60">
          <Select value={activeEvent?.id || ''} onValueChange={setSelectedEventId} disabled={eventsQuery.isLoading}>
            <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
            <SelectContent>
              {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-60">
          <Select value={activeRound?.id || ''} onValueChange={setSelectedRoundId} disabled={!activeEvent || roundsQuery.isLoading}>
            <SelectTrigger><SelectValue placeholder={roundsQuery.isLoading ? 'Loading…' : 'Select round'} /></SelectTrigger>
            <SelectContent>
              {rounds.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!activeRound && !roundsQuery.isLoading && (
        <Alert>
          <AlertTitle>No round selected</AlertTitle>
          <AlertDescription>Select an event and round to start scoring.</AlertDescription>
        </Alert>
      )}

      {activeRound && assignedTeams.length === 0 && !boardQuery.isLoading && (
        <Alert>
          <AlertTitle>No teams assigned</AlertTitle>
          <AlertDescription>You have no teams assigned to score in this round yet.</AlertDescription>
        </Alert>
      )}

      {activeRound && assignedTeams.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Assigned Teams</CardTitle>
              {myBoard && <p className="text-xs text-muted-foreground">{myBoard.name}</p>}
            </CardHeader>
            <CardContent className="space-y-2">
              {assignedTeams.map((team) => {
                const sheet = sheetQuery.data?.data?.find((s) => s.teamId === team.id);
                const done = sheet?.status === 'SUBMITTED' || sheet?.status === 'LOCKED';
                return (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                      selectedTeam?.id === team.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{team.name}</p>
                      {team.projectName && (
                        <p className="text-xs text-muted-foreground truncate">{team.projectName}</p>
                      )}
                    </div>
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <Badge variant="secondary" className="shrink-0 text-xs">Pending</Badge>
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {selectedTeam ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{selectedTeam.name}</CardTitle>
                    {isSubmitted && (
                      <Badge variant="default" className="w-fit">Score Submitted</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {submission ? (
                      <div className="flex flex-wrap gap-2">
                        {submission.demoUrl && (
                          <a href={submission.demoUrl} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-3.5 h-3.5 mr-1" />
                              Demo
                            </Button>
                          </a>
                        )}
                        {submission.reportUrl && (
                          <a href={submission.reportUrl} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm">
                              <FileText className="w-3.5 h-3.5 mr-1" />
                              Report
                            </Button>
                          </a>
                        )}
                        {submission.presentationUrl && (
                          <a href={submission.presentationUrl} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm">
                              <Github className="w-3.5 h-3.5 mr-1" />
                              Slides
                            </Button>
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No submission found for this team.</p>
                    )}
                  </CardContent>
                </Card>

                {criteria.length === 0 ? (
                  <Alert>
                    <AlertTitle>No rubric assigned</AlertTitle>
                    <AlertDescription>This round has no rubric. Contact the coordinator to assign one.</AlertDescription>
                  </Alert>
                ) : (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Scoring Criteria</CardTitle>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-700">{totalScore}</p>
                          <p className="text-xs text-muted-foreground">of {maxScore} pts</p>
                        </div>
                      </div>
                      <Progress value={maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0} />
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {criteria.map((c) => (
                        <div key={c.id} className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Label className="font-medium">{c.name}</Label>
                              {c.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{c.maxScore} pts</span>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            max={c.maxScore}
                            placeholder={`0–${c.maxScore}`}
                            value={scores[c.id] ?? ''}
                            disabled={isSubmitted}
                            onChange={(e) => {
                              const v = Math.min(Math.max(0, Number(e.target.value)), c.maxScore);
                              setScores((prev) => ({ ...prev, [c.id]: v }));
                            }}
                            className="w-28"
                          />
                          <Input
                            placeholder="Comment (optional)"
                            value={comments[c.id] || ''}
                            disabled={isSubmitted}
                            onChange={(e) => setComments((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          />
                        </div>
                      ))}

                      <div className="space-y-1 pt-2">
                        <Label>General Comment</Label>
                        <Textarea
                          placeholder="Overall feedback for the team…"
                          rows={3}
                          value={generalComment}
                          disabled={isSubmitted}
                          onChange={(e) => setGeneralComment(e.target.value)}
                        />
                      </div>

                      {!isSubmitted && (
                        <div className="flex gap-3 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => saveMutation.mutate(false)}
                            disabled={saveMutation.isPending}
                          >
                            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Draft
                          </Button>
                          <Button
                            onClick={() => setSubmitConfirm(true)}
                            disabled={saveMutation.isPending || criteria.some((c) => scores[c.id] === undefined)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Submit Score
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Alert>
                <AlertTitle>Select a team</AlertTitle>
                <AlertDescription>Choose a team from the list to start scoring.</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={submitConfirm} onOpenChange={setSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Score Sheet</AlertDialogTitle>
            <AlertDialogDescription>
              You are submitting the score sheet for <strong>{selectedTeam?.name}</strong> with a total of{' '}
              <strong>{totalScore}</strong> points. This cannot be modified after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => saveMutation.mutate(true)}>
              <Send className="w-4 h-4 mr-2" />
              Confirm Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
