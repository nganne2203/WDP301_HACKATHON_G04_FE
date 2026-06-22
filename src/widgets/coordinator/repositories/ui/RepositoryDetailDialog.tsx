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
  const commitsQuery = useQuery({
    queryKey: queryKeys.repositories.commits(repository?.id),
    enabled: open && Boolean(repository?.id),
    queryFn: async () => (await repositoriesApi.listCommits(repository!.id, 1, 10)).data,
  });

  const diffQuery = useQuery({
    queryKey: queryKeys.repositories.diffs(repository?.id),
    enabled: open && Boolean(repository?.id),
    queryFn: async () => (await repositoriesApi.listCommitDiffs(repository!.id, 1, 5)).data,
  });

  const analysisQuery = useQuery({
    queryKey: queryKeys.repositories.analysis(repository?.id),
    enabled: open && Boolean(repository?.id),
    queryFn: async () => (await repositoriesApi.listStaticAnalysis(repository!.id, 1, 5)).data,
  });

  const impactQuery = useQuery({
    queryKey: queryKeys.repositories.impact(repository?.id),
    enabled: open && Boolean(repository?.id),
    queryFn: async () => (await repositoriesApi.listImpactDecisions(repository!.id, 1, 5)).data,
  });

  const reviewsQuery = useQuery({
    queryKey: queryKeys.repositories.aiReviews(repository?.id),
    enabled: open && Boolean(repository?.id),
    queryFn: async () => (await repositoriesApi.listAiReviews(repository!.id, 1, 5)).data,
  });

  if (!repository) return null;

  const commits = commitsQuery.data?.commits || [];
  const diffs = diffQuery.data || [];
  const analyses = analysisQuery.data || [];
  const impacts = impactQuery.data || [];
  const aiReviews = reviewsQuery.data?.aiReviews || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            {repository.repositoryFullName}
          </DialogTitle>
          <DialogDescription>
            Monitor webhook status, commit evidence, static analysis, and AI reviews for this repository.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Team</p>
            <p className="font-medium">{repository.team?.name || '-'}</p>
            <p className="text-xs text-muted-foreground">{repository.team?.projectName || 'No project name'}</p>
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
                <AlertTitle>Loading commit evidence</AlertTitle>
                <AlertDescription>Fetching the latest commits from the backend.</AlertDescription>
              </Alert>
            ) : commits.length === 0 ? (
              <Alert>
                <AlertTitle>No commit evidence available</AlertTitle>
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
          </TabsContent>

          <TabsContent value="diffs" className="space-y-3 pt-3">
            {diffQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading diff evidence</AlertTitle>
                <AlertDescription>The backend is fetching the latest diffs for this repository.</AlertDescription>
              </Alert>
            ) : diffs.length === 0 ? (
              <Alert>
                <AlertTitle>No diff evidence available</AlertTitle>
                <AlertDescription>Please sync commits or wait for webhooks to process.</AlertDescription>
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
          </TabsContent>

          <TabsContent value="analysis" className="space-y-3 pt-3">
            {analysisQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading static analysis</AlertTitle>
                <AlertDescription>Fetching the latest static analysis results.</AlertDescription>
              </Alert>
            ) : analyses.length === 0 ? (
              <Alert>
                <AlertTitle>No static analysis results</AlertTitle>
                <AlertDescription>No analysis records found for this repository.</AlertDescription>
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
          </TabsContent>

          <TabsContent value="impact" className="space-y-3 pt-3">
            {impactQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading impact decisions</AlertTitle>
                <AlertDescription>Fetching commit impact evaluations.</AlertDescription>
              </Alert>
            ) : impacts.length === 0 ? (
              <Alert>
                <AlertTitle>No impact decisions</AlertTitle>
                <AlertDescription>No impact data found for this repository.</AlertDescription>
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
          </TabsContent>

          <TabsContent value="ai" className="space-y-3 pt-3">
            {reviewsQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading AI reviews</AlertTitle>
                <AlertDescription>Fetching the repository's AI audit history.</AlertDescription>
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
          </TabsContent>
        </div>
      </Tabs>
      </DialogContent>
    </Dialog>
  );
}
