import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, ExternalLink, GitCommitHorizontal } from 'lucide-react';

import { repositoriesApi } from '@/entities/repository/api';
import { queryKeys } from '@/lib/queryKeys';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import type { Repository } from '@/shared/api/types';

function CommitsTab({ repositoryId }: { repositoryId: string }) {
  const commitsQuery = useQuery({
    queryKey: queryKeys.repositories.commits(repositoryId),
    queryFn: async () => (await repositoriesApi.listCommits(repositoryId, 1, 20)).data,
    enabled: Boolean(repositoryId),
  });
  const commits = commitsQuery.data || [];

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
    </div>
  );
}

function AnalysisTab({ repositoryId }: { repositoryId: string }) {
  const analysisQuery = useQuery({
    queryKey: queryKeys.repositories.analysis(repositoryId),
    queryFn: async () => (await repositoriesApi.listStaticAnalysis(repositoryId, 1, 5)).data,
    enabled: Boolean(repositoryId),
  });
  const results = analysisQuery.data || [];

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
    </div>
  );
}

function AiReviewsTab({ repositoryId }: { repositoryId: string }) {
  const aiQuery = useQuery({
    queryKey: queryKeys.repositories.aiReviews(repositoryId),
    queryFn: async () => (await repositoriesApi.listAiReviews(repositoryId, 1, 5)).data,
    enabled: Boolean(repositoryId),
  });
  const reviews = aiQuery.data || [];

  if (aiQuery.isLoading) return <p className="text-sm text-muted-foreground py-2">Loading AI reviews…</p>;
  if (!reviews.length) return <p className="text-sm text-muted-foreground py-2">No AI reviews available.</p>;

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="rounded border p-3 text-sm space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-purple-500" />
            <Badge variant="outline">{review.reviewKind}</Badge>
            <Badge variant={review.needsHumanReview ? 'destructive' : 'secondary'}>
              {review.needsHumanReview ? 'Needs review' : 'OK'}
            </Badge>
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

  if (!repository) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="commits">Commits</TabsTrigger>
            <TabsTrigger value="analysis">Static Analysis</TabsTrigger>
            <TabsTrigger value="ai">AI Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="commits" className="mt-4">
            <CommitsTab repositoryId={repository.id} />
          </TabsContent>
          <TabsContent value="analysis" className="mt-4">
            <AnalysisTab repositoryId={repository.id} />
          </TabsContent>
          <TabsContent value="ai" className="mt-4">
            <AiReviewsTab repositoryId={repository.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
