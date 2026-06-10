import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Github, Loader2, Plus, ShieldCheck, ShieldX, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

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
import { ApiError } from '@/shared/api/client';
import { eventsApi } from '@/entities/event/api';
import { githubApi } from '@/entities/github/api';
import type { RevokeGitHubMembersResult } from '@/shared/api/types';

const PERMISSIONS = ['pull', 'triage', 'push', 'maintain', 'admin'] as const;

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Could not connect to server.';
}

export function Repositories() {
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [enabled, setEnabled] = useState(false);

  const [repoName, setRepoName] = useState('');
  const [repoDescription, setRepoDescription] = useState('');
  const [repoPrivate, setRepoPrivate] = useState(true);

  const [collabRepoName, setCollabRepoName] = useState('');
  const [collabUsername, setCollabUsername] = useState('');
  const [collabPermission, setCollabPermission] = useState<typeof PERMISSIONS[number]>('push');

  const [inviteEmail, setInviteEmail] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [revokeResult, setRevokeResult] = useState<RevokeGitHubMembersResult | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['github-config-events'],
    queryFn: async () => {
      const response = await eventsApi.list({ page: 1, limit: 100 });
      return response.data;
    },
  });
  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);
  const activeEventId = activeEvent?.id || '';

  const configQuery = useQuery({
    queryKey: ['github-config', activeEventId],
    enabled: Boolean(activeEventId),
    queryFn: async () => {
      const response = await githubApi.getConfig(activeEventId);
      return response.data;
    },
  });

  useEffect(() => {
    setOrganizationName('');
    setOwnerUsername('');
    setGithubToken('');
    setEnabled(false);
    setRevokeResult(null);
  }, [activeEventId]);

  useEffect(() => {
    if (!configQuery.data) return;
    setOrganizationName(configQuery.data.organizationName || '');
    setOwnerUsername(configQuery.data.ownerUsername || '');
    setEnabled(Boolean(configQuery.data.enabled));
  }, [configQuery.data]);

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      const response = await githubApi.saveConfig({
        eventId: activeEventId,
        organizationName,
        ownerUsername,
        githubToken,
        enabled,
      });
      return response.data;
    },
    onSuccess: async () => {
      setGithubToken('');
      toast.success('GitHub configuration saved');
      await queryClient.invalidateQueries({ queryKey: ['github-config', activeEventId] });
    },
    onError: (error) => toast.error('Could not save GitHub configuration', { description: getApiErrorMessage(error) }),
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      const response = await githubApi.testConnection(activeEventId);
      return response.data;
    },
    onSuccess: (result) => {
      toast.success('GitHub connection works', {
        description: `${result.organizationName} is accessible.`,
      });
    },
    onError: (error) => toast.error('GitHub connection failed', { description: getApiErrorMessage(error) }),
  });

  const createRepositoryMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      const response = await githubApi.createRepository({
        eventId: activeEventId,
        repoName,
        description: repoDescription,
        private: repoPrivate,
      });
      return response.data;
    },
    onSuccess: (result) => {
      toast.success('Repository created', {
        description: result.htmlUrl || result.repoName,
      });
      setRepoName('');
      setRepoDescription('');
      setRepoPrivate(true);
    },
    onError: (error) => toast.error('Could not create repository', { description: getApiErrorMessage(error) }),
  });

  const assignCollaboratorMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      const response = await githubApi.assignCollaborator(collabRepoName, collabUsername, {
        eventId: activeEventId,
        permission: collabPermission,
      });
      return response.data;
    },
    onSuccess: (result) => {
      toast.success('Collaborator assigned', {
        description: `${result.username} has ${result.permission} access to ${result.repoName}.`,
      });
      setCollabUsername('');
    },
    onError: (error) => toast.error('Could not assign collaborator', { description: getApiErrorMessage(error) }),
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      const response = await githubApi.inviteOrganizationMember({
        eventId: activeEventId,
        email: inviteEmail,
        role: 'direct_member',
      });
      return response.data;
    },
    onSuccess: (result) => {
      toast.success('Organization invitation sent', {
        description: result.email,
      });
      setInviteEmail('');
    },
    onError: (error) => toast.error('Could not invite organization member', { description: getApiErrorMessage(error) }),
  });

  const revokeMembersMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      const response = await githubApi.revokeMembers({
        eventId: activeEventId,
        confirmationText: 'REVOKE MEMBERS',
      });
      return response.data;
    },
    onSuccess: (result) => {
      setRevokeResult(result);
      setConfirmationText('');
      toast.success('Organization member revoke completed', {
        description: `${result.removed.length} removed, ${result.failed.length} failed.`,
      });
    },
    onError: (error) => toast.error('Could not revoke organization members', { description: getApiErrorMessage(error) }),
  });

  const config = configQuery.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Repository Management</h1>
        <p className="text-sm text-muted-foreground">Each event has its own GitHub organization configuration.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="w-full md:w-96 space-y-2">
            <Label>Event</Label>
            <Select value={activeEventId} onValueChange={setSelectedEventId} disabled={eventsQuery.isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {configQuery.isLoading || eventsQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading GitHub configuration</AlertTitle>
          <AlertDescription>Reading event-specific integration settings from the database.</AlertDescription>
        </Alert>
      ) : (
        <Alert className={config?.enabled ? 'bg-green-50 border-green-200' : undefined}>
          {config?.enabled ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Github className="h-4 w-4" />}
          <AlertTitle>{config?.enabled ? 'GitHub integration enabled' : 'GitHub integration disabled'}</AlertTitle>
          <AlertDescription>
            Organization: <strong>{config?.organizationName || 'Not configured'}</strong>
            {' '}· Token: <strong>{config?.hasToken ? 'Configured' : 'Missing'}</strong>
            {' '}· Event: <strong>{activeEvent?.title || 'No event selected'}</strong>
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
                <Input
                  id="github-org"
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  placeholder="your-org-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-owner">Owner username</Label>
                <Input
                  id="github-owner"
                  value={ownerUsername}
                  onChange={(event) => setOwnerUsername(event.target.value)}
                  placeholder="owner-github-username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github-token">GitHub token</Label>
              <Input
                id="github-token"
                type="password"
                value={githubToken}
                onChange={(event) => setGithubToken(event.target.value)}
                placeholder={config?.hasToken ? 'Leave blank to keep existing token' : 'github_pat_xxx'}
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={config?.hasToken ? 'default' : 'secondary'}>
                  {config?.hasToken ? 'Token exists' : 'No token saved'}
                </Badge>
                <span>Token value is never returned by the API.</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Enabled</p>
                <p className="text-xs text-muted-foreground">Allow backend GitHub API operations.</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => saveConfigMutation.mutate()}
                disabled={saveConfigMutation.isPending || !activeEventId}
              >
                {saveConfigMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending || !config?.hasToken || !activeEventId}
              >
                {testConnectionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Test connection
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Repository Management
            </CardTitle>
            <CardDescription>Create a repository inside the configured organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repo-name">Repo name</Label>
              <Input
                id="repo-name"
                value={repoName}
                onChange={(event) => setRepoName(event.target.value)}
                placeholder="team-alpha-project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-description">Description</Label>
              <Input
                id="repo-description"
                value={repoDescription}
                onChange={(event) => setRepoDescription(event.target.value)}
                placeholder="Repository for Team Alpha"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={repoPrivate} onCheckedChange={(checked) => setRepoPrivate(checked === true)} id="repo-private" />
              <Label htmlFor="repo-private">Private repository</Label>
            </div>
            <Button
              onClick={() => createRepositoryMutation.mutate()}
              disabled={createRepositoryMutation.isPending || !activeEventId}
            >
              {createRepositoryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create repository
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Collaborator Management
            </CardTitle>
            <CardDescription>Assign a GitHub user to a repository with a selected permission.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collab-repo">Repo name</Label>
                <Input
                  id="collab-repo"
                  value={collabRepoName}
                  onChange={(event) => setCollabRepoName(event.target.value)}
                  placeholder="team-alpha-project"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collab-user">GitHub username</Label>
                <Input
                  id="collab-user"
                  value={collabUsername}
                  onChange={(event) => setCollabUsername(event.target.value)}
                  placeholder="octocat"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Permission</Label>
              <Select value={collabPermission} onValueChange={(value) => setCollabPermission(value as typeof PERMISSIONS[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSIONS.map((permission) => (
                    <SelectItem key={permission} value={permission}>{permission}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => assignCollaboratorMutation.mutate()}
              disabled={assignCollaboratorMutation.isPending || !activeEventId}
            >
              {assignCollaboratorMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign member
            </Button>
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
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="member@gmail.com"
              />
            </div>
            <Button
              onClick={() => inviteMemberMutation.mutate()}
              disabled={inviteMemberMutation.isPending || !activeEventId}
            >
              {inviteMemberMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
              This calls GitHub and removes organization members. It skips only the configured owner: {ownerUsername || 'not configured'}.
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
              <Input
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                placeholder="REVOKE MEMBERS"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmationText('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={confirmationText !== 'REVOKE MEMBERS' || revokeMembersMutation.isPending}
                  onClick={(event) => {
                    event.preventDefault();
                    revokeMembersMutation.mutate();
                  }}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {revokeMembersMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm revoke
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {revokeResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Removed</p>
                <p className="text-2xl font-semibold">{revokeResult.removed.length}</p>
                <p className="text-xs text-muted-foreground break-words">{revokeResult.removed.join(', ') || 'None'}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Skipped</p>
                <p className="text-2xl font-semibold">{revokeResult.skipped.length}</p>
                <p className="text-xs text-muted-foreground break-words">{revokeResult.skipped.join(', ') || 'None'}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Failed</p>
                <p className="text-2xl font-semibold">{revokeResult.failed.length}</p>
                <p className="text-xs text-muted-foreground break-words">
                  {revokeResult.failed.map((item) => `${item.username}: ${item.reason}`).join(', ') || 'None'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
