import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ExternalLink,
  Github,
  GitCommitHorizontal,
  Loader2,
  Plus,
  RefreshCcw,
  ShieldCheck,
  ShieldX,
  UserPlus,
  Webhook,
} from 'lucide-react';

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
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';

import { accessVariant, shortSha, statusVariant, webhookVariant } from '../model/repository-view.utils';
import { PERMISSIONS, useRepositoriesView } from '../model/useRepositoriesView';
import { RepositoryDetailDialog } from './RepositoryDetailDialog';

export function Repositories() {
  const view = useRepositoriesView();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Repository Management</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý GitHub config, repository linkage, quyền truy cập và evidence pipeline theo từng event.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="w-full md:w-96 space-y-2">
            <Label>Event</Label>
            <Select value={view.activeEventId} onValueChange={view.setSelectedEventId} disabled={view.eventsQuery.isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {view.events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {view.configQuery.isLoading || view.eventsQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading GitHub configuration</AlertTitle>
          <AlertDescription>Reading event-specific integration settings from the database.</AlertDescription>
        </Alert>
      ) : (
        <Alert className={view.config?.enabled ? 'bg-green-50 border-green-200' : undefined}>
          {view.config?.enabled ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Github className="h-4 w-4" />}
          <AlertTitle>{view.config?.enabled ? 'GitHub integration enabled' : 'GitHub integration disabled'}</AlertTitle>
          <AlertDescription>
            Organization: <strong>{view.config?.organizationName || 'Not configured'}</strong>
            {' '}• Token: <strong>{view.config?.hasToken ? 'Configured' : 'Missing'}</strong>
            {' '}• Event: <strong>{view.activeEvent?.title || 'No event selected'}</strong>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              GitHub Config
            </CardTitle>
            <CardDescription>One encrypted `SystemConfiguration` record is stored for this event; saved tokens are never displayed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => view.saveConfigMutation.mutate()} disabled={view.saveConfigMutation.isPending || !view.activeEventId}>
                {view.saveConfigMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
              <Button variant="outline" onClick={() => view.testConnectionMutation.mutate()} disabled={view.testConnectionMutation.isPending || !view.config?.hasToken || !view.activeEventId}>
                {view.testConnectionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Test connection
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Repository
            </CardTitle>
            <CardDescription>Tạo repo GitHub và link luôn vào team của event hiện tại.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {view.createRepositoryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create repository
            </Button>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Linked Repositories</CardTitle>
            <CardDescription>
              Danh sách repository đã link với event, kèm trạng thái quyền truy cập, webhook và pipeline evidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {view.repositoriesQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading repositories</AlertTitle>
                <AlertDescription>Đang đọc danh sách repository từ backend.</AlertDescription>
              </Alert>
            ) : view.repositories.length === 0 ? (
              <Alert>
                <AlertTitle>No repositories linked yet</AlertTitle>
                <AlertDescription>Tạo repository đầu tiên để bắt đầu pipeline GitHub cho event này.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {view.repositories.map((repository) => (
                  <div key={repository.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{repository.repositoryFullName}</p>
                          <Badge variant={statusVariant(repository.status)}>{repository.status}</Badge>
                          <Badge variant={accessVariant(repository.accessState)}>{repository.accessState}</Badge>
                          <Badge variant={webhookVariant(repository.webhookStatus)}>{repository.webhookStatus}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Team: {repository.team?.name || '-'} • Round: {repository.round?.name || 'Chưa gắn'}
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
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open
                          </Button>
                        </a>
                        <Button variant="outline" size="sm" onClick={() => view.syncRepositoryMutation.mutate(repository.id)} disabled={view.syncRepositoryMutation.isPending}>
                          <RefreshCcw className="w-4 h-4 mr-2" />
                          Sync
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => view.analyzeRepositoryMutation.mutate(repository.id)} disabled={view.analyzeRepositoryMutation.isPending}>
                          <GitCommitHorizontal className="w-4 h-4 mr-2" />
                          Analyze
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => view.triggerAiReviewMutation.mutate(repository.id)} disabled={view.triggerAiReviewMutation.isPending}>
                          <Bot className="w-4 h-4 mr-2" />
                          AI Review
                        </Button>
                        <Button size="sm" onClick={() => { view.setSelectedRepository(repository); view.setSelectedRepositoryId(repository.id); view.setCollabRepoName(repository.githubRepo); }}>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Access + Webhook Actions
            </CardTitle>
            <CardDescription>Gán hoặc thu hồi collaborator, đồng thời đăng ký lại webhook khi cần.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Repository</Label>
              <Select value={view.collabRepoName} onValueChange={view.setCollabRepoName} disabled={view.repositories.length === 0}>
                <SelectTrigger><SelectValue placeholder="Select repository" /></SelectTrigger>
                <SelectContent>
                  {view.repositories.map((repository) => (
                    <SelectItem key={repository.id} value={repository.githubRepo}>{repository.repositoryFullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collab-user">GitHub username</Label>
                <Input id="collab-user" value={view.collabUsername} onChange={(event) => view.setCollabUsername(event.target.value)} placeholder="octocat" />
              </div>
              <div className="space-y-2">
                <Label>Permission</Label>
                <Select value={view.collabPermission} onValueChange={(value) => view.setCollabPermission(value as typeof PERMISSIONS[number])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERMISSIONS.map((permission) => (
                      <SelectItem key={permission} value={permission}>{permission}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => view.assignCollaboratorMutation.mutate()} disabled={view.assignCollaboratorMutation.isPending || !view.activeEventId || !view.collabRepoName || !view.collabUsername}>
                {view.assignCollaboratorMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Assign member
              </Button>
              <Button variant="outline" onClick={() => view.revokeCollaboratorMutation.mutate()} disabled={view.revokeCollaboratorMutation.isPending || !view.activeEventId || !view.collabRepoName || !view.collabUsername}>
                {view.revokeCollaboratorMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Revoke collaborator
              </Button>
              <Button variant="outline" onClick={() => view.registerWebhookMutation.mutate()} disabled={view.registerWebhookMutation.isPending || !view.activeEventId || !view.collabRepoName}>
                {view.registerWebhookMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Webhook className="w-4 h-4 mr-2" />}
                Register webhook
              </Button>
            </div>
            {view.selectedRepositorySummary && (
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">{view.selectedRepositorySummary.repositoryFullName}</p>
                <p className="text-muted-foreground mt-1">
                  Access: {view.selectedRepositorySummary.accessState} • Webhook: {view.selectedRepositorySummary.webhookStatus}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Organization Invitation
            </CardTitle>
            <CardDescription>Invite a member to the GitHub organization by email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" value={view.inviteEmail} onChange={(event) => view.setInviteEmail(event.target.value)} placeholder="member@gmail.com" />
            </div>
            <Button onClick={() => view.inviteMemberMutation.mutate()} disabled={view.inviteMemberMutation.isPending || !view.activeEventId}>
              {view.inviteMemberMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Invite member
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldX className="w-5 h-5" />
            Organization Danger Zone
          </CardTitle>
          <CardDescription>Revoke every organization member except the configured owner username.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Destructive action</AlertTitle>
            <AlertDescription>
              This calls GitHub and removes organization members. It skips only the configured owner: {view.ownerUsername || 'not configured'}.
            </AlertDescription>
          </Alert>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <ShieldX className="w-4 h-4 mr-2" />
                Revoke all members except owner
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke organization members?</AlertDialogTitle>
                <AlertDialogDescription>
                  Type <strong>REVOKE MEMBERS</strong> to confirm. This operation continues even if one removal fails.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input value={view.confirmationText} onChange={(event) => view.setConfirmationText(event.target.value)} placeholder="REVOKE MEMBERS" />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => view.setConfirmationText('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={view.confirmationText !== 'REVOKE MEMBERS' || view.revokeMembersMutation.isPending}
                  onClick={(event) => {
                    event.preventDefault();
                    view.revokeMembersMutation.mutate();
                  }}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {view.revokeMembersMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm revoke
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {view.revokeResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Removed</p>
                <p className="text-2xl font-semibold">{view.revokeResult.removed.length}</p>
                <p className="text-xs text-muted-foreground break-words">{view.revokeResult.removed.join(', ') || 'None'}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Skipped</p>
                <p className="text-2xl font-semibold">{view.revokeResult.skipped.length}</p>
                <p className="text-xs text-muted-foreground break-words">{view.revokeResult.skipped.join(', ') || 'None'}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Failed</p>
                <p className="text-2xl font-semibold">{view.revokeResult.failed.length}</p>
                <p className="text-xs text-muted-foreground break-words">
                  {view.revokeResult.failed.map((item) => `${item.username}: ${item.reason}`).join(', ') || 'None'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RepositoryDetailDialog repository={view.selectedRepository} open={Boolean(view.selectedRepository)} onClose={() => view.setSelectedRepository(null)} />
    </div>
  );
}
