import { AlertTriangle, Loader2, ShieldX } from 'lucide-react';

import type { useRepositoriesView } from '../model/useRepositoriesView';

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
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

type RepositoriesViewModel = ReturnType<typeof useRepositoriesView>;

export function RepositoryDangerZoneCard({ view }: { view: RepositoriesViewModel }) {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <ShieldX className="h-5 w-5" />
          Organization Danger Zone
        </CardTitle>
        <CardDescription>Remove organization membership from everyone except the configured owner username.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Destructive action</AlertTitle>
          <AlertDescription>
            This removes all Organization members except the owner: {view.ownerUsername || 'not set'}.
          </AlertDescription>
        </Alert>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <ShieldX className="mr-2 h-4 w-4" />
              Remove organization members
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove organization members?</AlertDialogTitle>
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
                {view.revokeMembersMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {view.revokeResult && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">Removed</p>
              <p className="text-2xl font-semibold">{view.revokeResult.removed.length}</p>
              <p className="break-words text-xs text-muted-foreground">{view.revokeResult.removed.join(', ') || 'None'}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">Skipped</p>
              <p className="text-2xl font-semibold">{view.revokeResult.skipped.length}</p>
              <p className="break-words text-xs text-muted-foreground">{view.revokeResult.skipped.join(', ') || 'None'}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">Failed</p>
              <p className="text-2xl font-semibold">{view.revokeResult.failed.length}</p>
              <p className="break-words text-xs text-muted-foreground">
                {view.revokeResult.failed.map((item) => `${item.username}: ${item.reason}`).join(', ') || 'None'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
