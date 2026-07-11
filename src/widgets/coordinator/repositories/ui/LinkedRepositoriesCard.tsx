import {
  Bot,
  ExternalLink,
  GitCommitHorizontal,
  Loader2,
  MoreHorizontal,
  RefreshCcw,
  Search,
} from 'lucide-react';

import type { useRepositoriesView } from '../model/useRepositoriesView';
import { accessVariant, shortSha, statusVariant, webhookVariant } from '../model/repository-view.utils';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Input } from '@/shared/ui/input';
import { ListPagination } from '@/shared/ui/list-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

type RepositoriesViewModel = ReturnType<typeof useRepositoriesView>;

export function LinkedRepositoriesCard({ view }: { view: RepositoriesViewModel }) {
  function openDetails(repository: RepositoriesViewModel['repositories'][number]) {
    view.setSelectedRepository(repository);
    view.setSelectedRepositoryId(repository.id);
    view.setCollabRepoName(repository.githubRepo);
  }

  const isActionPending = view.syncRepositoryMutation.isPending ||
    view.analyzeRepositoryMutation.isPending ||
    view.triggerAiReviewMutation.isPending ||
    view.triggerPerPushReviewMutation.isPending;

  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle>Linked Repositories</CardTitle>
          <CardDescription>
            Monitor repository access, webhook health, and evidence processing for every team.
          </CardDescription>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={view.repositorySearch}
              onChange={(event) => view.setRepositorySearch(event.target.value)}
              className="pl-9"
              placeholder="Search repository or owner..."
              aria-label="Search linked repositories"
            />
          </div>
          <Select
            value={view.repositoryStatus}
            onValueChange={(value) => view.setRepositoryStatus(value as typeof view.repositoryStatus)}
          >
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="DISCONNECTED">Disconnected</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={view.repositoryAccessState}
            onValueChange={(value) => view.setRepositoryAccessState(value as typeof view.repositoryAccessState)}
          >
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue placeholder="All access" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All access</SelectItem>
              <SelectItem value="GRANTED">Granted</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REVOKED">Revoked</SelectItem>
              <SelectItem value="UNKNOWN">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
            <AlertTitle>No matching repositories</AlertTitle>
            <AlertDescription>
              {view.repositorySearch || view.repositoryStatus !== 'all' || view.repositoryAccessState !== 'all'
                ? 'Try changing the search text or filters.'
                : 'Create repositories in bulk to start the GitHub workflow for this event.'}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="min-w-64 pl-4">Repository</TableHead>
                    <TableHead className="min-w-44">Team / Round</TableHead>
                    <TableHead className="min-w-52">Health</TableHead>
                    <TableHead className="min-w-40">Evidence</TableHead>
                    <TableHead className="w-36 pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.repositories.map((repository) => (
                    <TableRow key={repository.id}>
                      <TableCell className="max-w-80 py-3 pl-4">
                        <button
                          type="button"
                          className="block max-w-full truncate text-left font-medium hover:underline"
                          onClick={() => openDetails(repository)}
                          title={repository.repositoryFullName}
                        >
                          {repository.repositoryFullName}
                        </button>
                        <p className="mt-1 text-xs text-muted-foreground">Branch: {repository.defaultBranch || 'main'}</p>
                        {repository.lastWebhookRegistrationError && (
                          <p className="mt-1 max-w-72 truncate text-xs text-destructive" title={repository.lastWebhookRegistrationError}>
                            {repository.lastWebhookRegistrationError}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="max-w-44 truncate font-medium" title={repository.team?.name || ''}>
                          {repository.team?.name || 'No team'}
                        </p>
                        <p className="mt-1 max-w-44 truncate text-xs text-muted-foreground" title={repository.round?.name || ''}>
                          {repository.round?.name || 'No round assigned'}
                        </p>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant={statusVariant(repository.status)}>{repository.status}</Badge>
                          <Badge variant={accessVariant(repository.accessState)}>{repository.accessState}</Badge>
                          <Badge variant={webhookVariant(repository.webhookStatus)}>{repository.webhookStatus}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        <p>Latest: <span className="font-mono text-foreground">{shortSha(repository.latestCommitSha)}</span></p>
                        <p className="mt-1">Processed: <span className="font-mono text-foreground">{shortSha(repository.lastProcessedCommitSha)}</span></p>
                      </TableCell>
                      <TableCell className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" onClick={() => openDetails(repository)}>Details</Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Actions for ${repository.repositoryFullName}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Repository actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <a href={repository.repositoryUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink className="mr-2 h-4 w-4" /> Open on GitHub
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={isActionPending} onSelect={() => view.syncRepositoryMutation.mutate(repository.id)}>
                                <RefreshCcw className="mr-2 h-4 w-4" /> Sync commits
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={isActionPending} onSelect={() => view.analyzeRepositoryMutation.mutate(repository.id)}>
                                <GitCommitHorizontal className="mr-2 h-4 w-4" /> Analyze
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem disabled={isActionPending} onSelect={() => view.triggerAiReviewMutation.mutate(repository.id)}>
                                <Bot className="mr-2 h-4 w-4" /> AI review
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={isActionPending} onSelect={() => view.triggerPerPushReviewMutation.mutate(repository.id)}>
                                <Bot className="mr-2 h-4 w-4" /> Per-push review
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ListPagination
              page={view.repositoriesPage}
              pagination={view.repositoriesPagination}
              onPageChange={view.setRepositoriesPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
