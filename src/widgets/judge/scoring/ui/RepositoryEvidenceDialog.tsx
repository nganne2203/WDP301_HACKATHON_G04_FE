import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, ExternalLink, FileDiff, GitCommitHorizontal } from 'lucide-react';

import { repositoriesApi } from '@/entities/repository/api';
import { queryKeys } from '@/lib/queryKeys';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { ListPagination } from '@/shared/ui/list-pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import type { Repository } from '@/shared/api/types';

function CommitsTab({ repositoryId, page, onPageChange }: { repositoryId: string; page: number; onPageChange: (page: number) => void }) {
  const commitsQuery = useQuery({
    queryKey: [...queryKeys.repositories.commits(repositoryId), page],
    queryFn: () => repositoriesApi.listCommits(repositoryId, page, 5),
    enabled: Boolean(repositoryId),
  });
  const commits = commitsQuery.data?.data.commits || [];

  if (commitsQuery.isLoading) return <p className="text-sm text-muted-foreground py-2">Loading commits…</p>;
  if (!commits.length) return <p className="text-sm text-muted-foreground py-2">No commits recorded.</p>;

  return (
    <div className="space-y-2">
      {commits.map((commit) => (
        <div key={commit.id} className="rounded border p-3 text-sm space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-muted-foreground">{commit.commitSha?.slice(0, 8)}</span>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>+{commit.linesAdded}</span>
              <span>-{commit.linesRemoved}</span>
              <span>{commit.filesChanged} files</span>
            </div>
          </div>
          <p className="line-clamp-2">{commit.message || 'No message'}</p>
          <p className="text-xs text-muted-foreground">{commit.authorName} · {commit.timestamp ? new Date(commit.timestamp).toLocaleString() : ''}</p>
          {commit.commitUrl && (
            <a href={commit.commitUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> View on GitHub
            </a>
          )}
        </div>
      ))}
      <ListPagination page={page} pagination={commitsQuery.data?.pagination} onPageChange={onPageChange} />
    </div>
  );
}

function AnalysisTab({ repositoryId, page, onPageChange }: { repositoryId: string; page: number; onPageChange: (page: number) => void }) {
  const analysisQuery = useQuery({
    queryKey: [...queryKeys.repositories.analysis(repositoryId), page],
    queryFn: () => repositoriesApi.listStaticAnalysis(repositoryId, page, 5),
    enabled: Boolean(repositoryId),
  });
  const results = analysisQuery.data?.data || [];

  if (analysisQuery.isLoading) return <p className="text-sm text-muted-foreground py-2">Loading analysis…</p>;
  if (!results.length) return <p className="text-sm text-muted-foreground py-2">No static analysis results.</p>;

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <div key={result.id} className="rounded border p-3 text-sm space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={result.errorCount > 0 ? 'destructive' : 'secondary'}>{result.errorCount} errors</Badge>
            <Badge variant="outline">{result.warningCount} warnings</Badge>
            <span className="text-xs text-muted-foreground font-mono">{result.commitSha?.slice(0, 8)}</span>
          </div>
          {result.rawOutput && (
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">{result.rawOutput.slice(0, 500)}</pre>
          )}
        </div>
      ))}
      <ListPagination page={page} pagination={analysisQuery.data?.pagination} onPageChange={onPageChange} />
    </div>
  );
}

function DiffsTab({ repositoryId, page, onPageChange }: { repositoryId: string; page: number; onPageChange: (page: number) => void }) {
  const diffsQuery = useQuery({
    queryKey: [...queryKeys.repositories.diffs(repositoryId), page],
    queryFn: () => repositoriesApi.listCommitDiffs(repositoryId, page, 5),
    enabled: Boolean(repositoryId),
  });
  const diffs = diffsQuery.data?.data || [];

  if (diffsQuery.isLoading) return <p className="text-sm text-muted-foreground py-2">Loading code changes…</p>;
  if (!diffs.length) return <p className="text-sm text-muted-foreground py-2">No code changes recorded.</p>;

  return (
    <div className="space-y-3">
      {diffs.map((diff) => (
        <div key={diff.id} className="rounded border p-3 text-sm space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileDiff className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="font-mono text-xs truncate">
                {diff.baseCommitSha?.slice(0, 8)} → {diff.headCommitSha?.slice(0, 8)}
              </span>
            </div>
            <Badge variant="outline">{diff.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {diff.patchSummary || `${diff.includedFiles || 0} changed file(s)`}
          </p>
          {diff.files?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {diff.files.slice(0, 8).map((file) => (
                <Badge key={`${diff.id}-${file.filePath}`} variant="secondary" className="max-w-full truncate">
                  {file.filePath}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ))}
      <ListPagination page={page} pagination={diffsQuery.data?.pagination} onPageChange={onPageChange} />
    </div>
  );
}

function AiReviewsTab({ repositoryId, page, onPageChange }: { repositoryId: string; page: number; onPageChange: (page: number) => void }) {
  const aiQuery = useQuery({
    queryKey: [...queryKeys.repositories.aiReviews(repositoryId), page],
    queryFn: () => repositoriesApi.listAiReviews(repositoryId, page, 5),
    enabled: Boolean(repositoryId),
  });
  const reviews = aiQuery.data?.data.aiReviews || [];

  if (aiQuery.isLoading) return <p className="text-sm text-muted-foreground py-2">Loading AI reviews…</p>;
  if (!reviews.length) return <p className="text-sm text-muted-foreground py-2">No AI reviews available.</p>;

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="rounded border p-3 text-sm space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-purple-500" />
            <Badge variant="outline">{review.reviewKind}</Badge>
            <Badge variant="outline">{review.status}</Badge>
          </div>
          {review.summary && <p className="text-sm">{review.summary}</p>}
          {review.overallSummary && review.overallSummary !== review.summary && (
            <p className="text-xs text-muted-foreground">{review.overallSummary}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {review.modelName} · {review.completedAt ? new Date(review.completedAt).toLocaleString() : ''}
          </p>
        </div>
      ))}
      <ListPagination page={page} pagination={aiQuery.data?.pagination} onPageChange={onPageChange} />
    </div>
  );
}

export function RepositoryEvidenceDialog({
  open,
  onOpenChange,
  repository,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repository: Repository | null;
}) {
  const [tab, setTab] = useState('commits');
  const [pages, setPages] = useState({ commits: 1, diffs: 1, analysis: 1, ai: 1 });

  useEffect(() => {
    setTab('commits');
    setPages({ commits: 1, diffs: 1, analysis: 1, ai: 1 });
  }, [repository?.id]);

  if (!repository) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCommitHorizontal className="h-5 w-5" />
            Repository Evidence — {repository.repositoryFullName}
          </DialogTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline">Access: {repository.accessState}</Badge>
            <Badge variant="outline">Webhook: {repository.webhookStatus}</Badge>
            {repository.repositoryUrl && (
              <a href={repository.repositoryUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="h-6 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" /> Open repo
                </Button>
              </a>
            )}
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="commits">Commits</TabsTrigger>
            <TabsTrigger value="diffs">Diffs</TabsTrigger>
            <TabsTrigger value="analysis">Static Analysis</TabsTrigger>
            <TabsTrigger value="ai">AI Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="commits" className="mt-4">
            <CommitsTab repositoryId={repository.id} page={pages.commits} onPageChange={(page) => setPages((current) => ({ ...current, commits: page }))} />
          </TabsContent>
          <TabsContent value="diffs" className="mt-4">
            <DiffsTab repositoryId={repository.id} page={pages.diffs} onPageChange={(page) => setPages((current) => ({ ...current, diffs: page }))} />
          </TabsContent>
          <TabsContent value="analysis" className="mt-4">
            <AnalysisTab repositoryId={repository.id} page={pages.analysis} onPageChange={(page) => setPages((current) => ({ ...current, analysis: page }))} />
          </TabsContent>
          <TabsContent value="ai" className="mt-4">
            <AiReviewsTab repositoryId={repository.id} page={pages.ai} onPageChange={(page) => setPages((current) => ({ ...current, ai: page }))} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
