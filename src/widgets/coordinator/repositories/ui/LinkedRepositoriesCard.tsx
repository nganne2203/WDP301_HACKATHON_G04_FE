import { Bot, ExternalLink, GitCommitHorizontal, Loader2, RefreshCcw } from 'lucide-react';

import type { useRepositoriesView } from '../model/useRepositoriesView';
import { accessVariant, shortSha, statusVariant, webhookVariant } from '../model/repository-view.utils';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

type RepositoriesViewModel = ReturnType<typeof useRepositoriesView>;

export function LinkedRepositoriesCard({ view }: { view: RepositoriesViewModel }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Repositories</CardTitle>
        <CardDescription>
          Repositories linked to this event, including access state, webhook health, and evidence pipeline status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {view.repositoriesQuery.isLoading ? (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Loading repositories</AlertTitle>
            <AlertDescription>Reading linked repositories from the backend.</AlertDescription>
          </Alert>
        ) : view.repositories.length === 0 ? (
          <Alert>
            <AlertTitle>No repositories linked yet</AlertTitle>
            <AlertDescription>Create the first repository to start the GitHub workflow for this event.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {view.repositories.map((repository) => (
              <div key={repository.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{repository.repositoryFullName}</p>
                      <Badge variant={statusVariant(repository.status)}>{repository.status}</Badge>
                      <Badge variant={accessVariant(repository.accessState)}>{repository.accessState}</Badge>
                      <Badge variant={webhookVariant(repository.webhookStatus)}>{repository.webhookStatus}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Team: {repository.team?.name || '-'} • Round: {repository.round?.name || 'Not assigned'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Latest: {shortSha(repository.latestCommitSha)} • Processed: {shortSha(repository.lastProcessedCommitSha)}
                    </p>
                    {repository.lastWebhookRegistrationError && (
                      <p className="text-xs text-destructive">{repository.lastWebhookRegistrationError}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={repository.repositoryUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </Button>
                    </a>
                    <Button variant="outline" size="sm" onClick={() => view.syncRepositoryMutation.mutate(repository.id)} disabled={view.syncRepositoryMutation.isPending}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Sync
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => view.analyzeRepositoryMutation.mutate(repository.id)} disabled={view.analyzeRepositoryMutation.isPending}>
                      <GitCommitHorizontal className="mr-2 h-4 w-4" />
                      Analyze
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => view.triggerAiReviewMutation.mutate(repository.id)} disabled={view.triggerAiReviewMutation.isPending}>
                      <Bot className="mr-2 h-4 w-4" />
                      AI Review
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => view.triggerPerPushReviewMutation.mutate(repository.id)} disabled={view.triggerPerPushReviewMutation.isPending}>
                      <Bot className="mr-2 h-4 w-4" />
                      Per-Push
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        view.setSelectedRepository(repository);
                        view.setSelectedRepositoryId(repository.id);
                        view.setCollabRepoName(repository.githubRepo);
                      }}
                    >
                      View details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
