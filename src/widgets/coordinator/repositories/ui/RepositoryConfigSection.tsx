import { useState } from 'react';
import { CheckCircle2, Github, Link, Loader2, Plus, ShieldX } from 'lucide-react';

import type { useRepositoriesView } from '../model/useRepositoriesView';

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
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';

type RepositoriesViewModel = ReturnType<typeof useRepositoriesView>;

export function RepositoryConfigSection({ view }: { view: RepositoriesViewModel }) {
  const [isLinkRepositoryOpen, setIsLinkRepositoryOpen] = useState(false);

  return (
    <>
      {view.configQuery.isLoading || view.eventsQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading GitHub configuration</AlertTitle>
          <AlertDescription>Loading GitHub settings for this event.</AlertDescription>
        </Alert>
      ) : (
        <Alert className={view.config?.enabled ? 'border-green-200 bg-green-50' : undefined}>
          {view.config?.enabled ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Github className="h-4 w-4" />}
          <AlertTitle>{view.config?.enabled ? 'GitHub integration enabled' : 'GitHub integration disabled'}</AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span>Organization: <strong>{view.config?.organizationName || 'Not configured'}</strong></span>
              <span className="text-muted-foreground/60">•</span>
              <span>Token: <strong>{view.config?.hasToken ? 'Configured' : 'Missing'}</strong></span>
              <span className="text-muted-foreground/60">•</span>
              <span>Event: <strong>{view.activeEvent?.title || 'No event selected'}</strong></span>
            </div>
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
            <CardDescription>Connect this event to your GitHub Organization. Saved tokens stay hidden.</CardDescription>
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
                <p className="text-xs text-muted-foreground">Allow repository and member management.</p>
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

      <Dialog open={isLinkRepositoryOpen} onOpenChange={setIsLinkRepositoryOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Link Existing Repository
              </DialogTitle>
              <DialogDescription>
                Use this only for a repository created outside SEAL. Team repositories are normally created from the bulk actions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLinkRepositoryOpen(false)}>Cancel</Button>
              <Button
                onClick={() => view.linkRepositoryMutation.mutate()}
                disabled={view.linkRepositoryMutation.isPending || !view.activeEventId || !view.selectedTeamId || !view.linkOwner || !view.linkRepo}
              >
                {view.linkRepositoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Link className="mr-2 h-4 w-4" />
                Link repository
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>

      <Card className="relative border-blue-200 bg-blue-50/10">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 z-10 w-fit text-muted-foreground"
          onClick={() => setIsLinkRepositoryOpen(true)}
        >
          <Link className="mr-2 h-4 w-4" />
          Link existing repo
        </Button>
        <CardHeader className="pr-44">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Bulk Repository Operations
          </CardTitle>
          <CardDescription>
            Create repositories in bulk (without assigning members), grant access in bulk, or revoke access in bulk for all teams in the event.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2 max-w-sm">
              <Label>Round</Label>
              <Select value={view.selectedRoundId} onValueChange={view.setSelectedRoundId}>
                <SelectTrigger><SelectValue placeholder="Select round (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No round</SelectItem>
                  {view.rounds.map((round) => (
                    <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
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
                Bulk Create Repos
              </Button>

              <Button
                variant="outline"
                onClick={() => view.bulkGrantAccessMutation.mutate()}
                disabled={view.bulkGrantAccessMutation.isPending || !view.activeEventId}
                className="w-full sm:w-auto border-green-200 hover:bg-green-50 text-green-700"
              >
                {view.bulkGrantAccessMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                )}
                Bulk Grant Access
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={view.bulkRevokeAccessMutation.isPending || !view.activeEventId}
                    className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto"
                  >
                    {view.bulkRevokeAccessMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldX className="mr-2 h-4 w-4 text-red-600" />
                    )}
                    Revoke Event Repo Access
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke access to all event repositories?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes team members as collaborators from repositories linked to this event. It does not remove anyone from the GitHub Organization.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => view.bulkRevokeAccessMutation.mutate()}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Revoke repository access
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
