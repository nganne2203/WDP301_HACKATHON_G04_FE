import { CheckCircle2, Github, Link, Loader2, Plus } from 'lucide-react';

import type { useRepositoriesView } from '../model/useRepositoriesView';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';

type RepositoriesViewModel = ReturnType<typeof useRepositoriesView>;

export function RepositoryConfigSection({ view }: { view: RepositoriesViewModel }) {
  return (
    <>
      {view.configQuery.isLoading || view.eventsQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading GitHub configuration</AlertTitle>
          <AlertDescription>Reading event-specific integration settings from the database.</AlertDescription>
        </Alert>
      ) : (
        <Alert className={view.config?.enabled ? 'border-green-200 bg-green-50' : undefined}>
          {view.config?.enabled ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Github className="h-4 w-4" />}
          <AlertTitle>{view.config?.enabled ? 'GitHub integration enabled' : 'GitHub integration disabled'}</AlertTitle>
          <AlertDescription>
            Organization: <strong>{view.config?.organizationName || 'Not configured'}</strong>
            {' '}• Token: <strong>{view.config?.hasToken ? 'Configured' : 'Missing'}</strong>
            {' '}• Event: <strong>{view.activeEvent?.title || 'No event selected'}</strong>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Config
            </CardTitle>
            <CardDescription>One encrypted configuration record is stored per event; saved tokens are never displayed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="github-org">Organization name</Label>
                <Input id="github-org" value={view.organizationName} onChange={(event) => view.setOrganizationName(event.target.value)} placeholder="your-org-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-owner">Owner username</Label>
                <Input id="github-owner" value={view.ownerUsername} onChange={(event) => view.setOwnerUsername(event.target.value)} placeholder="owner-github-username" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github-token">GitHub token</Label>
              <Input
                id="github-token"
                type="password"
                value={view.githubToken}
                onChange={(event) => view.setGithubToken(event.target.value)}
                placeholder={view.config?.hasToken ? 'Leave blank to keep existing token' : 'github_pat_xxx'}
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={view.config?.hasToken ? 'default' : 'secondary'}>
                  {view.config?.hasToken ? 'Token exists' : 'No token saved'}
                </Badge>
                <span>Token value is never returned by the API.</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Enabled</p>
                <p className="text-xs text-muted-foreground">Allow backend GitHub API operations.</p>
              </div>
              <Switch checked={view.enabled} onCheckedChange={view.setEnabled} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => view.saveConfigMutation.mutate()} disabled={view.saveConfigMutation.isPending || !view.activeEventId}>
                {view.saveConfigMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button variant="outline" onClick={() => view.testConnectionMutation.mutate()} disabled={view.testConnectionMutation.isPending || !view.config?.hasToken || !view.activeEventId}>
                {view.testConnectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test connection
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Repository
            </CardTitle>
            <CardDescription>Create a GitHub repository and immediately link it to a team in the selected event.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Team</Label>
                <Select value={view.selectedTeamId} onValueChange={view.setSelectedTeamId}>
                  <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                  <SelectContent>
                    {view.teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Round</Label>
                <Select value={view.selectedRoundId} onValueChange={view.setSelectedRoundId}>
                  <SelectTrigger><SelectValue placeholder="Optional round" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No round</SelectItem>
                    {view.rounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-name">Repo name</Label>
              <Input id="repo-name" value={view.repoName} onChange={(event) => view.setRepoName(event.target.value)} placeholder="team-alpha-project" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-description">Description</Label>
              <Input id="repo-description" value={view.repoDescription} onChange={(event) => view.setRepoDescription(event.target.value)} placeholder="Repository for Team Alpha" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={view.repoPrivate} onCheckedChange={(checked) => view.setRepoPrivate(checked === true)} id="repo-private" />
              <Label htmlFor="repo-private">Private repository</Label>
            </div>
            <Button onClick={() => view.createRepositoryMutation.mutate()} disabled={view.createRepositoryMutation.isPending || !view.activeEventId || !view.selectedTeamId || !view.repoName}>
              {view.createRepositoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create repository
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link Existing Repository
          </CardTitle>
          <CardDescription>Link an already-existing GitHub repository to a team. Use this when the repo was created outside of SEAL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={view.selectedTeamId} onValueChange={view.setSelectedTeamId}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {view.teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-owner">GitHub owner</Label>
              <Input id="link-owner" value={view.linkOwner} onChange={(e) => view.setLinkOwner(e.target.value)} placeholder="org-or-username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-repo">Repository name</Label>
              <Input id="link-repo" value={view.linkRepo} onChange={(e) => view.setLinkRepo(e.target.value)} placeholder="repo-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-branch">Default branch</Label>
              <Input id="link-branch" value={view.linkBranch} onChange={(e) => view.setLinkBranch(e.target.value)} placeholder="main" />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => view.linkRepositoryMutation.mutate()}
            disabled={view.linkRepositoryMutation.isPending || !view.activeEventId || !view.selectedTeamId || !view.linkOwner || !view.linkRepo}
          >
            {view.linkRepositoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Link className="mr-2 h-4 w-4" />
            Link repository
          </Button>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Bulk Create Repositories
          </CardTitle>
          <CardDescription>
            Tự động tạo và thiết lập GitHub Repositories hàng loạt cho tất cả các đội thi đã được xác nhận (CONFIRMED/ACTIVE) chưa có Repo trong sự kiện.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Round</Label>
              <Select value={view.selectedRoundId} onValueChange={view.setSelectedRoundId}>
                <SelectTrigger><SelectValue placeholder="Chọn vòng thi (tùy chọn)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không gán vòng thi</SelectItem>
                  {view.rounds.map((round) => (
                    <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => view.bulkCreateRepositoriesMutation.mutate()}
                disabled={view.bulkCreateRepositoriesMutation.isPending || !view.activeEventId}
                className="w-full sm:w-auto"
              >
                {view.bulkCreateRepositoriesMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Github className="mr-2 h-4 w-4" />
                )}
                Tạo hàng loạt Repo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
