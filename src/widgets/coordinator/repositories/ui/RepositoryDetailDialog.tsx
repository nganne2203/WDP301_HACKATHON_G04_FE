import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, Github, Loader2 } from 'lucide-react';

import { repositoriesApi } from '@/entities/repository/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Repository } from '@/shared/api/types';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { ListPagination } from '@/shared/ui/list-pagination';

import { formatDate, shortSha, webhookVariant } from '../model/repository-view.utils';

export function RepositoryDetailDialog({
  repository,
  open,
  onClose,
}: {
  repository: Repository | null;
  open: boolean;
  onClose: () => void;
}) {
  const [pages, setPages] = useState({ commits: 1, diffs: 1, analysis: 1, impact: 1, ai: 1 });

  useEffect(() => {
    setPages({ commits: 1, diffs: 1, analysis: 1, impact: 1, ai: 1 });
  }, [repository?.id]);

  const commitsQuery = useQuery({
    queryKey: [...queryKeys.repositories.commits(repository?.id), pages.commits],
    enabled: open && Boolean(repository?.id),
    queryFn: () => repositoriesApi.listCommits(repository!.id, pages.commits, 5),
  });

  const diffQuery = useQuery({
    queryKey: [...queryKeys.repositories.diffs(repository?.id), pages.diffs],
    enabled: open && Boolean(repository?.id),
    queryFn: () => repositoriesApi.listCommitDiffs(repository!.id, pages.diffs, 5),
  });

  const analysisQuery = useQuery({
    queryKey: [...queryKeys.repositories.analysis(repository?.id), pages.analysis],
    enabled: open && Boolean(repository?.id),
    queryFn: () => repositoriesApi.listStaticAnalysis(repository!.id, pages.analysis, 5),
  });

  const impactQuery = useQuery({
    queryKey: [...queryKeys.repositories.impact(repository?.id), pages.impact],
    enabled: open && Boolean(repository?.id),
    queryFn: () => repositoriesApi.listImpactDecisions(repository!.id, pages.impact, 5),
  });

  const reviewsQuery = useQuery({
    queryKey: [...queryKeys.repositories.aiReviews(repository?.id), pages.ai],
    enabled: open && Boolean(repository?.id),
    queryFn: () => repositoriesApi.listAiReviews(repository!.id, pages.ai, 5),
  });

  if (!repository) return null;

  const commits = commitsQuery.data?.data.commits || [];
  const diffs = diffQuery.data?.data || [];
  const analyses = analysisQuery.data?.data || [];
  const impacts = impactQuery.data?.data || [];
  const aiReviews = reviewsQuery.data?.data.aiReviews || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            {repository.repositoryFullName}
          </DialogTitle>
          <DialogDescription>
            Review connection status, commits, code checks, and AI reviews.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Team</p>
            <p className="font-medium">{repository.team?.name || '-'}</p>
            <p className="text-xs text-muted-foreground">{repository.team?.chapterName || repository.team?.status || '-'}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Round</p>
            <p className="font-medium">{repository.round?.name || 'No round assigned'}</p>
            <p className="text-xs text-muted-foreground">{repository.defaultBranch}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Latest commit</p>
            <p className="font-medium">{shortSha(repository.latestCommitSha)}</p>
            <p className="text-xs text-muted-foreground">Processed: {shortSha(repository.lastProcessedCommitSha)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Webhook</p>
            <div className="mt-1">
              <Badge variant={webhookVariant(repository.webhookStatus)}>{repository.webhookStatus}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{formatDate(repository.webhookRegisteredAt)}</p>
          </div>
        </div>

        <Tabs defaultValue="commits" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="commits">Commits</TabsTrigger>
            <TabsTrigger value="diffs">Diffs</TabsTrigger>
            <TabsTrigger value="analysis">Static Analysis</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
            <TabsTrigger value="ai">AI Reviews</TabsTrigger>
          </TabsList>

          <div className="min-h-[350px]">
            <TabsContent value="commits" className="space-y-3 pt-3">
            {commitsQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading commits</AlertTitle>
                <AlertDescription>Loading recent commits.</AlertDescription>
              </Alert>
            ) : commits.length === 0 ? (
              <Alert>
                <AlertTitle>No commits available</AlertTitle>
                <AlertDescription>This repository has not synced commits to the system yet.</AlertDescription>
              </Alert>
            ) : (
              commits.map((commit) => (
                <div key={commit.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{commit.message || '(No commit message)'}</p>
                    <Badge variant="outline">{shortSha(commit.commitSha)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {commit.authorName || commit.authorUsername || 'Unknown'} • {formatDate(commit.timestamp)}
                  </p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    +{commit.linesAdded} / -{commit.linesRemoved} • {commit.filesChanged} files
                  </p>
                </div>
              ))
            )}
            <ListPagination
              page={pages.commits}
              pagination={commitsQuery.data?.pagination}
              onPageChange={(page) => setPages((current) => ({ ...current, commits: page }))}
            />
          </TabsContent>

          <TabsContent value="diffs" className="space-y-3 pt-3">
            {diffQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading code changes</AlertTitle>
                <AlertDescription>Loading recent code changes.</AlertDescription>
              </Alert>
            ) : diffs.length === 0 ? (
              <Alert>
                <AlertTitle>No code changes available</AlertTitle>
                <AlertDescription>Sync commits or try again later.</AlertDescription>
              </Alert>
            ) : (
              diffs.map((diff) => (
                <div key={diff.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {shortSha(diff.baseCommitSha)} → {shortSha(diff.headCommitSha)}
                    </p>
                    <Badge variant="outline">{diff.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {diff.patchSummary || `${diff.includedFiles} included / ${diff.excludedFiles} excluded`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {diff.files.slice(0, 5).map((file) => (
                      <Badge key={`${diff.id}-${file.filePath}`} variant="secondary">
                        {file.filePath}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
            <ListPagination
              page={pages.diffs}
              pagination={diffQuery.data?.pagination}
              onPageChange={(page) => setPages((current) => ({ ...current, diffs: page }))}
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-3 pt-3">
            {analysisQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading code checks</AlertTitle>
                <AlertDescription>Loading the latest code check results.</AlertDescription>
              </Alert>
            ) : analyses.length === 0 ? (
              <Alert>
                <AlertTitle>No static analysis results</AlertTitle>
                <AlertDescription>No code check results yet.</AlertDescription>
              </Alert>
            ) : (
              analyses.map((item) => (
                <div key={item.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{shortSha(item.commitSha)}</p>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Errors: {item.errorCount} • Warnings: {item.warningCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Source: {item.source || '-'}</p>
                </div>
              ))
            )}
            <ListPagination
              page={pages.analysis}
              pagination={analysisQuery.data?.pagination}
              onPageChange={(page) => setPages((current) => ({ ...current, analysis: page }))}
            />
          </TabsContent>

          <TabsContent value="impact" className="space-y-3 pt-3">
            {impactQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading impact results</AlertTitle>
                <AlertDescription>Loading change impact results.</AlertDescription>
              </Alert>
            ) : impacts.length === 0 ? (
              <Alert>
                <AlertTitle>No impact decisions</AlertTitle>
                <AlertDescription>No impact results yet.</AlertDescription>
              </Alert>
            ) : (
              impacts.map((item) => (
                <div key={item.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{shortSha(item.commitSha)}</p>
                    <Badge variant={item.needsHumanReview ? 'destructive' : 'secondary'}>
                      {item.impactLevel}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Decision: {item.decision} • Score: {item.impactScore}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.reasons.join(', ') || 'No reasons provided'}</p>
                </div>
              ))
            )}
            <ListPagination
              page={pages.impact}
              pagination={impactQuery.data?.pagination}
              onPageChange={(page) => setPages((current) => ({ ...current, impact: page }))}
            />
          </TabsContent>

          <TabsContent value="ai" className="space-y-3 pt-3">
            {reviewsQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading AI reviews</AlertTitle>
                <AlertDescription>Loading AI review history.</AlertDescription>
              </Alert>
            ) : aiReviews.length === 0 ? (
              <Alert>
                <AlertTitle>No AI reviews</AlertTitle>
                <AlertDescription>This repository does not have any per-push or aggregate audits yet.</AlertDescription>
              </Alert>
            ) : (
              aiReviews.map((review) => (
                <div key={review.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{review.reviewKind}</p>
                    <Badge variant={review.needsHumanReview ? 'destructive' : 'secondary'}>
                      {review.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.summary || 'No summary available.'}</p>
                  <p className="text-xs text-muted-foreground">
                    {review.modelName || 'Unknown model'} • {formatDate(review.completedAt || review.requestedAt)}
                  </p>
                </div>
              ))
            )}
            <ListPagination
              page={pages.ai}
              pagination={reviewsQuery.data?.pagination}
              onPageChange={(page) => setPages((current) => ({ ...current, ai: page }))}
            />
          </TabsContent>
        </div>
      </Tabs>
      </DialogContent>
    </Dialog>
  );
}
