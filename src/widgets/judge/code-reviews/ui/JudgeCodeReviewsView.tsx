import { useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Code, ExternalLink, Loader2, SearchCode } from 'lucide-react';

import { useJudgeCodeReviewsView } from '../model/useJudgeCodeReviewsView';
import { RepositoryEvidenceDialog } from '../../scoring/ui/RepositoryEvidenceDialog';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import type { Repository } from '@/shared/api/types';

export function JudgeCodeReviewsView() {
  const view = useJudgeCodeReviewsView();
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2">
            <SearchCode className="h-6 w-6 text-blue-600" />
            Code Reviews
          </h1>
          <p className="text-sm text-muted-foreground">Inspect submitted repositories, static analysis, and AI review findings for your assigned teams.</p>
        </div>
        <div className="grid w-full gap-3 md:w-auto md:grid-cols-2">
          <div className="md:w-64">
            <Label>Event</Label>
            <Select value={view.activeEvent?.id || ''} onValueChange={view.setSelectedEventId} disabled={view.eventsQuery.isLoading}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {view.events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:w-64">
            <Label>Round</Label>
            <Select value={view.activeRound?.id || ''} onValueChange={view.setSelectedRoundId} disabled={view.roundsQuery.isLoading}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select round" />
              </SelectTrigger>
              <SelectContent>
                {view.rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {view.isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading code review data</AlertTitle>
          <AlertDescription>Fetching assigned repositories and review signals.</AlertDescription>
        </Alert>
      )}

      {!view.isLoading && view.reviewRows.length === 0 && (
        <Alert>
          <AlertTitle>No assigned repositories</AlertTitle>
          <AlertDescription>No team repository is available for this round yet.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {view.reviewRows.map((row) => (
          <Card key={row.team.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{row.team.name}</CardTitle>
                  <CardDescription>{row.repository?.repositoryFullName || 'Repository evidence'}</CardDescription>
                </div>
                {row.latestAiReview ? (
                  <Badge variant={row.latestAiReview.needsHumanReview ? 'destructive' : 'secondary'}>
                    <Bot className="mr-1 h-3 w-3" />
                    {row.latestAiReview.needsHumanReview ? 'Needs review' : 'AI OK'}
                  </Badge>
                ) : (
                  <Badge variant="outline">AI pending</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Repository</p>
                <p className="font-mono text-sm">{row.repository?.repositoryFullName || 'No GitHub repository linked'}</p>
                {row.repository?.repositoryUrl && (
                  <a href={row.repository.repositoryUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    Open repository
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Static Analysis</p>
                  {row.latestAnalysis ? (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={row.latestAnalysis.errorCount > 0 ? 'destructive' : 'secondary'}>
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {row.latestAnalysis.errorCount} error(s)
                      </Badge>
                      <Badge variant="outline">{row.latestAnalysis.warningCount} warning(s)</Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No static run yet.</p>
                  )}
                </div>

                <div className="rounded-md border p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">AI Review</p>
                  {row.latestAiReview ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{row.latestAiReview.reviewKind}</Badge>
                        <Badge variant={row.latestAiReview.needsHumanReview ? 'destructive' : 'secondary'}>
                          {row.latestAiReview.needsHumanReview ? 'Human review needed' : 'No blocker'}
                        </Badge>
                      </div>
                      <p className="line-clamp-3 text-sm">{row.latestAiReview.summary || row.latestAiReview.overallSummary || 'No summary provided.'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No AI review available.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={!row.repository}
                  onClick={() => setSelectedRepository(row.repository)}
                >
                  <Code className="mr-2 h-4 w-4" />
                  Inspect Evidence
                </Button>
                {row.staticAnalysis.length > 0 && <Badge variant="outline">{row.staticAnalysis.length} analysis run(s)</Badge>}
                {row.aiReviews.length > 0 && <Badge variant="outline">{row.aiReviews.length} AI review(s)</Badge>}
                {row.loading && <Badge variant="outline"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Loading</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RepositoryEvidenceDialog
        open={Boolean(selectedRepository)}
        onOpenChange={(open) => !open && setSelectedRepository(null)}
        repository={selectedRepository}
      />
    </div>
  );
}
