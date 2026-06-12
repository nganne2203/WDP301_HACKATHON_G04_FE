import { Loader2, ShieldCheck, UserPlus, Webhook } from 'lucide-react';

import type { useRepositoriesView } from '../model/useRepositoriesView';
import { PERMISSIONS } from '../model/useRepositoriesView';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

type RepositoriesViewModel = ReturnType<typeof useRepositoriesView>;

export function RepositoryCollaborationSection({ view }: { view: RepositoriesViewModel }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Access and Webhook Actions
          </CardTitle>
          <CardDescription>Assign or revoke collaborators and re-register the repository webhook when needed.</CardDescription>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              {view.assignCollaboratorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign member
            </Button>
            <Button variant="outline" onClick={() => view.revokeCollaboratorMutation.mutate()} disabled={view.revokeCollaboratorMutation.isPending || !view.activeEventId || !view.collabRepoName || !view.collabUsername}>
              {view.revokeCollaboratorMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revoke collaborator
            </Button>
            <Button variant="outline" onClick={() => view.registerWebhookMutation.mutate()} disabled={view.registerWebhookMutation.isPending || !view.activeEventId || !view.collabRepoName}>
              {view.registerWebhookMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Webhook className="mr-2 h-4 w-4" />}
              Register webhook
            </Button>
          </div>
          {view.selectedRepositorySummary && (
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">{view.selectedRepositorySummary.repositoryFullName}</p>
              <p className="mt-1 text-muted-foreground">
                Access: {view.selectedRepositorySummary.accessState} • Webhook: {view.selectedRepositorySummary.webhookStatus}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
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
            {view.inviteMemberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Invite member
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
