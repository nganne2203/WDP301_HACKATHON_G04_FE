import { useState } from 'react';
import { Award, CheckCircle2, Loader2, Medal, RefreshCcw, Send, Trophy, Upload, Users } from 'lucide-react';

import { useResultsView } from '../model/useResultsView';

import { describeAdvancementRule } from '@/features/event-management/model/event-form';
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
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Separator } from '@/shared/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import type { RepositoryAccessAction } from '@/shared/api/types';

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

  const top3Finalists = view.finalists.slice(0, 3);
  const top3Rankings = view.rankings.slice(0, 3);
  const podiumItems = top3Finalists.length ? top3Finalists : top3Rankings;

  const isPublished = view.rankings.some((r) => r.publishedAt !== null);

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
          <Button size="lg" variant="outline" disabled>
            <Trophy className="w-4 h-4 mr-2" />
            View Only
          </Button>
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

      {/* Event + Round selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Event</Label>
              {view.eventsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading events…</p>
              ) : (
                <Select value={view.selectedEventId || view.activeEventId} onValueChange={view.setSelectedEventId}>
                  <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                  <SelectContent>
                    {view.events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
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
                disabled={view.generateRankingsMutation.isPending || !view.activeEventId || !view.activeRoundId}
                className="w-full"
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
                disabled={view.selectFinalistsMutation.isPending || view.rankings.length === 0}
                className="w-full"
              >
                {view.selectFinalistsMutation.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Users className="mr-2 h-4 w-4" />
                }
                Select Finalists
              </Button>
              )}
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Users className="h-4 w-4" />
        <AlertTitle>Current advancement rule</AlertTitle>
        <AlertDescription>
          {describeAdvancementRule(view.activeEvent)}
        </AlertDescription>
      </Alert>

      {/* Summary alert */}
      {view.rankingsQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading rankings…</AlertTitle>
          <AlertDescription>Fetching score data from the backend.</AlertDescription>
        </Alert>
      ) : view.rankings.length === 0 ? (
        <Alert>
          <Trophy className="h-4 w-4" />
          <AlertTitle>No rankings yet</AlertTitle>
          <AlertDescription>
            Select an event and round, then click "Generate Rankings" to calculate scores from locked score sheets.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Trophy className="h-4 w-4" />
          <AlertTitle>
            {view.finalists.length
              ? `${view.finalists.length} finalists selected from ${view.rankings.length} ranked teams`
              : `${view.rankings.length} teams ranked`}
          </AlertTitle>
          <AlertDescription>
            Round: <strong>{view.activeRound?.name || '–'}</strong>
            {' '} · Type: <strong>{view.activeRound?.roundType || '–'}</strong>
          </AlertDescription>
        </Alert>
      )}

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
                  Generate rankings first, then use Select Finalists to mark which teams go to the next round.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {view.finalists.map((ranking) => (
                  <div key={ranking.id} className="rounded-lg border bg-background p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{ranking.team?.name || 'Unknown team'}</p>
                        <p className="truncate text-xs text-muted-foreground">{ranking.team?.projectName || ranking.team?.chapterName || 'No project name'}</p>
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
                  {ranking.team?.projectName && (
                    <p className="text-sm text-muted-foreground mb-2">{ranking.team.projectName}</p>
                  )}
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
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Finalist</TableHead>
                  <TableHead>Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.rankings.map((ranking) => (
                  <TableRow key={ranking.id}>
                    <TableCell>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                        {ranking.rank}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ranking.team?.name || '–'}</p>
                        {ranking.team?.projectName && (
                          <p className="text-xs text-muted-foreground">{ranking.team.projectName}</p>
                        )}
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
                        <Badge><CheckCircle2 className="mr-1 h-3 w-3" />Finalist</Badge>
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
