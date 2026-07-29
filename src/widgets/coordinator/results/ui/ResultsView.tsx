import { useMemo, useState } from 'react';
import { Award, CheckCircle2, Loader2, Medal, RefreshCcw, Send, Trophy, Upload, Users } from 'lucide-react';

import { useResultsView } from '../model/useResultsView';

import { describeAdvancementRule } from '@/features/competition-management/model/competition-form';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
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
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Separator } from '@/shared/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Textarea } from '@/shared/ui/textarea';
import type { Ranking, RepositoryAccessAction, TieBreakMethod } from '@/shared/api/types';

type TieBreakDecisionForm = {
  method: Exclude<TieBreakMethod, 'NONE'>;
  score: string;
  reason: string;
};

const PLACE_ICONS = [Trophy, Medal, Award];
const PLACE_CLASSES = [
  'text-yellow-500',
  'text-gray-400',
  'text-orange-600',
];
const PLACE_BG = [
  'bg-yellow-100 text-yellow-800',
  'bg-gray-100 text-gray-800',
  'bg-orange-100 text-orange-800',
];
const PLACE_LABELS = ['1st Place', '2nd Place', '3rd Place'];

const REPO_ACCESS_OPTIONS: { value: RepositoryAccessAction; label: string; description: string }[] = [
  { value: 'NONE', label: 'No action', description: 'Repository access remains as-is.' },
  { value: 'FREEZE', label: 'Freeze', description: 'Repositories remain readable but prevent new commits.' },
  { value: 'REVOKE', label: 'Revoke', description: 'Revoke all collaborator access immediately.' },
];

export function Results() {
  const view = useResultsView();
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showTieBreakDialog, setShowTieBreakDialog] = useState(false);
  const [selectedTieScore, setSelectedTieScore] = useState('');
  const [tieBreakDecisions, setTieBreakDecisions] = useState<Record<string, TieBreakDecisionForm>>({});

  const top3Finalists = view.finalists.slice(0, 3);
  const top3Rankings = view.rankings.slice(0, 3);
  const podiumItems = top3Finalists.length ? top3Finalists : top3Rankings;
  const tieBreakScoreMax = view.activeRound?.rubric?.criterionMaxScore ?? 10;

  const isPublished = view.rankings.some((r) => Boolean(r.publishedAt));
  const isPreliminaryRound = view.activeRound?.roundType === 'PRELIMINARY';
  const unresolvedTieGroups = useMemo(() => {
    const groups = new Map<string, Ranking[]>();
    for (const ranking of view.rankings) {
      const key = String(ranking.score);
      groups.set(key, [...(groups.get(key) || []), ranking]);
    }
    return [...groups.entries()]
      .filter(([, rankings]) => rankings.length > 1 && rankings.some((ranking) => ranking.tieBreakMethod === 'NONE' || !ranking.tieBreakResolvedAt))
      .map(([score, rankings]) => ({ score, rankings }));
  }, [view.rankings]);
  const selectedTieGroup = unresolvedTieGroups.find((group) => group.score === selectedTieScore) || null;

  const initialiseTieBreak = (group: { score: string; rankings: Ranking[] }) => {
    setSelectedTieScore(group.score);
    setTieBreakDecisions(Object.fromEntries(group.rankings.map((ranking) => [ranking.id, {
      method: 'MINI_TEST',
      score: '',
      reason: '',
    }])));
  };

  const openTieBreakDialog = () => {
    const firstGroup = unresolvedTieGroups[0];
    if (!firstGroup) return;
    initialiseTieBreak(firstGroup);
    setShowTieBreakDialog(true);
  };

  const canSubmitTieBreak = Boolean(selectedTieGroup) && selectedTieGroup.rankings.every((ranking) => {
    const decision = tieBreakDecisions[ranking.id];
    return decision &&
      decision.reason.trim().length > 0 &&
      /^\d+(\.\d{1,2})?$/.test(decision.score) &&
      Number(decision.score) >= 0 &&
      Number(decision.score) <= tieBreakScoreMax;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Results & Rankings</h1>
          <p className="text-sm text-muted-foreground">
            {view.canManageResults
              ? 'Manage the result actions allowed for your account.'
              : 'View official rankings and finalist selections for assigned rounds.'}
          </p>
        </div>
        {!view.canManageResults ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="judge-results-round" className="text-xs text-muted-foreground">Round</Label>
              {view.roundsQuery.isLoading ? (
                <p className="h-10 px-3 text-sm leading-10 text-muted-foreground">Loading rounds…</p>
              ) : (
                <Select value={view.selectedRoundId || view.activeRoundId} onValueChange={view.setSelectedRoundId}>
                  <SelectTrigger id="judge-results-round" className="w-full sm:w-72"><SelectValue placeholder="Select round" /></SelectTrigger>
                  <SelectContent>
                    {view.rounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>{round.name} ({round.roundType})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button size="lg" variant="outline" disabled>
              <Trophy className="w-4 h-4 mr-2" />
              View Only
            </Button>
          </div>
        ) : view.canPublishResults && isPublished ? (
          <Button size="lg" variant="outline" disabled className="text-green-700 border-green-300 bg-green-50">
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
            Results Published
          </Button>
        ) : view.canPublishResults ? (
          <Button
            size="lg"
            onClick={() => setShowPublishConfirm(true)}
            disabled={view.rankings.length === 0 || view.publishResultsMutation.isPending}
          >
            {view.publishResultsMutation.isPending
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Upload className="w-4 h-4 mr-2" />
            }
            Publish Results
          </Button>
        ) : (
          <Button size="lg" variant="outline" disabled>
            <Trophy className="w-4 h-4 mr-2" />
            Limited Actions
          </Button>
        )}
      </div>

      {/* Result-management controls */}
      {view.canManageResults && <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Round</Label>
              {view.roundsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading rounds…</p>
              ) : (
                <Select value={view.selectedRoundId || view.activeRoundId} onValueChange={view.setSelectedRoundId}>
                  <SelectTrigger><SelectValue placeholder="Select round" /></SelectTrigger>
                  <SelectContent>
                    {view.rounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>{round.name} ({round.roundType})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {(view.canGenerateRankings || view.canSelectFinalists) && (
            <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2 lg:col-span-2 lg:content-end">
              {view.canGenerateRankings && (
              <Button
                variant="outline"
                onClick={() => view.generateRankingsMutation.mutate()}
                disabled={!view.canGenerateRankingsForRound || view.generateRankingsMutation.isPending || !view.activeCompetitionId || !view.activeRoundId}
                className="w-full"
                title={view.activeRound?.roundType === 'PRELIMINARY' ? 'Rankings are generated only for the final round.' : undefined}
              >
                {view.generateRankingsMutation.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <RefreshCcw className="mr-2 h-4 w-4" />
                }
                Generate Rankings
              </Button>
              )}
              {view.canSelectFinalists && (
              <Button
                variant="outline"
                onClick={() => view.selectFinalistsMutation.mutate()}
                disabled={view.resultsReadOnly || view.selectFinalistsMutation.isPending || view.rankings.length === 0 || view.isCustomSelectionMode}
                className="w-full"
                title={view.resultsReadOnly ? 'Finalist selection is view-only after the competition has been completed or archived.' : undefined}
              >
                {view.selectFinalistsMutation.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Users className="mr-2 h-4 w-4" />
                }
                {view.isCustomSelectionMode ? 'Use Manual Selection' : 'Select Finalists'}
              </Button>
              )}
            </div>
            )}
          </div>
        </CardContent>
      </Card>}

      {/* Summary alert */}
      {view.rankingsQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading rankings…</AlertTitle>
          <AlertDescription>Loading scores for this competition.</AlertDescription>
        </Alert>
      ) : view.rankings.length === 0 ? (
        <Alert>
          <Trophy className="h-4 w-4" />
          <AlertTitle>No rankings yet</AlertTitle>
          <AlertDescription>
            Select an competition and round, then click "Generate Rankings" to calculate scores from locked score sheets.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="sm:grid-cols-[1rem_auto_auto] sm:items-center sm:gap-x-4">
          <Trophy className="h-4 w-4" />
          <AlertTitle className="sm:col-start-2 sm:row-start-1">
            {view.finalists.length
              ? `${view.finalists.length} teams advance from ${view.rankings.length} ranked teams`
              : `${view.rankings.length} teams ranked`}
          </AlertTitle>
          <AlertDescription className="sm:col-start-3 sm:row-start-1 sm:block">
            <div className="flex flex-wrap items-center gap-2">
              <span>{describeAdvancementRule(view.activeCompetition)}</span>
              {view.canResolveTieBreak && unresolvedTieGroups.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={openTieBreakDialog}
                >
                  Resolve {unresolvedTieGroups.length} tie{unresolvedTieGroups.length === 1 ? '' : 's'}
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={showTieBreakDialog} onOpenChange={setShowTieBreakDialog}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resolve tie-break</DialogTitle>
            <DialogDescription>
              Record a decision for every team with the same score. The tie-break score determines their order without changing the official score.
            </DialogDescription>
          </DialogHeader>

          {unresolvedTieGroups.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="tie-break-group">Tied score group</Label>
              <Select
                value={selectedTieScore}
                onValueChange={(score) => {
                  const group = unresolvedTieGroups.find((item) => item.score === score);
                  if (group) initialiseTieBreak(group);
                }}
              >
                <SelectTrigger id="tie-break-group"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {unresolvedTieGroups.map((group) => (
                    <SelectItem key={group.score} value={group.score}>
                      Score {Number(group.score).toFixed(2)} — {group.rankings.length} teams
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedTieGroup && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Official score: <strong>{Number(selectedTieGroup.score).toFixed(2)}</strong>
              </p>
              {selectedTieGroup.rankings.map((ranking) => {
                const decision = tieBreakDecisions[ranking.id];
                return (
                  <div key={ranking.id} className="space-y-3 rounded-lg border p-4">
                    <p className="font-medium">{ranking.team?.name || 'Unknown team'}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Tie-break method</Label>
                        <Select
                          value={decision?.method || 'MINI_TEST'}
                          onValueChange={(method: Exclude<TieBreakMethod, 'NONE'>) => setTieBreakDecisions((current) => ({
                            ...current,
                            [ranking.id]: { ...current[ranking.id], method },
                          }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MINI_TEST">Mini test</SelectItem>
                            <SelectItem value="PENALTY_EVALUATION">Penalty evaluation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`tie-break-score-${ranking.id}`}>Tie-break score (0–{tieBreakScoreMax})</Label>
                        <Input
                          id={`tie-break-score-${ranking.id}`}
                          type="number"
                          min="0"
                          max={tieBreakScoreMax}
                          step="0.01"
                          value={decision?.score || ''}
                          onChange={(event) => setTieBreakDecisions((current) => ({
                            ...current,
                            [ranking.id]: { ...current[ranking.id], score: event.target.value },
                          }))}
                        />
                        <p className="text-xs text-muted-foreground">Maximum two decimal places.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`tie-break-reason-${ranking.id}`}>Decision reason</Label>
                      <Textarea
                        id={`tie-break-reason-${ranking.id}`}
                        rows={2}
                        value={decision?.reason || ''}
                        onChange={(event) => setTieBreakDecisions((current) => ({
                          ...current,
                          [ranking.id]: { ...current[ranking.id], reason: event.target.value },
                        }))}
                        placeholder="Explain the tie-break decision."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTieBreakDialog(false)}>Cancel</Button>
            <Button
              disabled={!canSubmitTieBreak || view.resolveTieBreakMutation.isPending}
              onClick={() => {
                if (!selectedTieGroup) return;
                view.resolveTieBreakMutation.mutate(selectedTieGroup.rankings.map((ranking) => {
                  const decision = tieBreakDecisions[ranking.id];
                  return {
                    teamId: ranking.teamId!,
                    tieBreakMethod: decision.method,
                    tieBreakScore: Number(decision.score),
                    tieBreakReason: decision.reason.trim(),
                  };
                }), {
                  onSuccess: () => setShowTieBreakDialog(false),
                });
              }}
            >
              {view.resolveTieBreakMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save tie-break
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {view.rankings.length > 0 && (
        <Card className={view.finalists.length > 0 ? 'border-green-200 bg-green-50/40' : undefined}>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Teams Advancing To Next Round
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Official finalist selection for {view.activeRound?.name || 'the selected round'}.
                </p>
              </div>
              <Badge variant={view.finalists.length > 0 ? 'default' : 'outline'}>
                {view.finalists.length} selected
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {view.finalists.length === 0 ? (
              <Alert>
                <AlertTitle>No advancing teams selected yet</AlertTitle>
                <AlertDescription>
                  {isPreliminaryRound
                    ? 'Use Select Finalists to mark the teams advancing to the next round.'
                    : 'Generate final rankings before publishing the official results.'}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {view.finalists.map((ranking) => (
                  <div key={ranking.id} className="rounded-lg border bg-background p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{ranking.team?.name || 'Unknown team'}</p>
                        <p className="truncate text-xs text-muted-foreground">{ranking.team?.chapterName || `Team ${ranking.team?.id || ''}`}</p>
                      </div>
                      <Badge className="shrink-0">Rank #{ranking.rank}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">Score {ranking.score.toFixed(2)}</Badge>
                      {ranking.team?.boardNumber && <Badge variant="outline">Board {ranking.team.boardNumber}</Badge>}
                    </div>
                    {ranking.selectionReason && (
                      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{ranking.selectionReason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {view.rankings.length > 0 && view.canSelectFinalists && view.isCustomSelectionMode && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle>Manual Finalist Review</CardTitle>
            <p className="text-sm text-muted-foreground">
              Custom mode is active. Tick teams from the ranking table below, then save the manual advancement list.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="manual-selection-reason">Selection reason</Label>
              <Textarea
                id="manual-selection-reason"
                value={view.manualSelectionReason}
                onChange={(competition) => view.setManualSelectionReason(competition.target.value)}
                placeholder="Optional: e.g. Organizer manual review after tie-break discussion."
                rows={2}
                disabled={view.resultsReadOnly}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {view.manualSelectedTeamIds.length} team(s) currently ticked for the next round.
              </p>
              <Button
                onClick={() => view.selectManualFinalistsMutation.mutate()}
                disabled={view.resultsReadOnly || view.selectManualFinalistsMutation.isPending || view.manualSelectedTeamIds.length === 0}
              >
                {view.selectManualFinalistsMutation.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <CheckCircle2 className="mr-2 h-4 w-4" />
                }
                Save Manual Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Podium */}
      {podiumItems.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {podiumItems.slice(0, 3).map((ranking, i) => {
            const Icon = PLACE_ICONS[i];
            return (
              <Card key={ranking.id} className="border-2 text-center">
                <CardHeader className="pb-3">
                  <div className="mx-auto mb-2">
                    <Icon className={`w-12 h-12 ${PLACE_CLASSES[i]}`} />
                  </div>
                  <CardTitle className="text-lg">{PLACE_LABELS[i]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold mb-2">{ranking.team?.name || '–'}</p>
                  <Badge variant="outline" className={PLACE_BG[i]}>
                    Score: {ranking.score.toFixed(2)}
                  </Badge>
                  {ranking.isSelectedForFinal && (
                    <div className="mt-2">
                      <Badge>Finalist</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full rankings table */}
      {view.rankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {view.canSelectFinalists && view.isCustomSelectionMode && <TableHead className="w-14">Select</TableHead>}
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>{isPreliminaryRound ? 'Advances' : 'Finalist'}</TableHead>
                  <TableHead>Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.rankings.map((ranking) => (
                  <TableRow key={ranking.id}>
                    {view.canSelectFinalists && view.isCustomSelectionMode && (
                      <TableCell>
                        <Checkbox
                          checked={ranking.teamId ? view.manualSelectedTeamIds.includes(ranking.teamId) : false}
                          disabled={view.resultsReadOnly || !ranking.teamId || Boolean(ranking.publishedAt)}
                          onCheckedChange={(checked) => {
                            if (!ranking.teamId) return;
                            view.toggleManualTeamSelection(ranking.teamId, checked === true);
                          }}
                          aria-label={`Select ${ranking.team?.name || 'team'} as finalist`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                        {ranking.rank}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ranking.team?.name || '–'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-lg">{ranking.score.toFixed(2)}</span>
                        {ranking.tieBreakScore > 0 && (
                          <span className="text-xs text-muted-foreground">(+{ranking.tieBreakScore} tie)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ranking.track ? (
                        <Badge variant="outline">{ranking.track.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">–</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ranking.isSelectedForFinal ? (
                        <Badge><CheckCircle2 className="mr-1 h-3 w-3" />{isPreliminaryRound ? 'Advances' : 'Finalist'}</Badge>
                      ) : (
                        <Badge variant="outline">–</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {ranking.publishedAt ? (
                        <span className="text-xs text-green-600">{new Date(ranking.publishedAt).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unpublished</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Publish confirmation dialog */}
      <AlertDialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Results</AlertDialogTitle>
            <AlertDialogDescription>
              This will officially publish rankings for{' '}
              <strong>{view.activeRound?.name || 'the selected round'}</strong>.
              Participants and judges will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-3 space-y-3">
            <div>
              <Label className="text-sm font-medium">Repository access after publication</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Optionally freeze or revoke collaborator access once results are live.
              </p>
              <div className="space-y-2">
                {REPO_ACCESS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      view.repositoryAccessAction === option.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="repoAction"
                      value={option.value}
                      checked={view.repositoryAccessAction === option.value}
                      onChange={() => view.setRepositoryAccessAction(option.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <Separator />
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p><span className="text-muted-foreground">Teams ranked:</span> <strong>{view.rankings.length}</strong></p>
              <p><span className="text-muted-foreground">Finalists:</span> <strong>{view.finalists.length}</strong></p>
              {podiumItems[0] && <p><span className="text-muted-foreground">1st place:</span> <strong>{podiumItems[0].team?.name || '–'}</strong></p>}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowPublishConfirm(false);
                view.publishResultsMutation.mutate();
              }}
              disabled={view.publishResultsMutation.isPending}
            >
              {view.publishResultsMutation.isPending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Send className="mr-2 h-4 w-4" />
              }
              Publish & Notify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
