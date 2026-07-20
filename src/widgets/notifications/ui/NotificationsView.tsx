import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/features/team/member-invites/model/helpers';
import { queryKeys } from '@/lib/queryKeys';
import { notificationsApi } from '@/shared/api/notifications';
import { teamsApi } from '@/shared/api/teams';
import type { Notification, NotificationStatus, NotificationType } from '@/shared/api/types';
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
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ListPagination } from '@/shared/ui/list-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

const PAGE_SIZE = 10;
const ALL_VALUE = 'ALL';
const notificationTypes: Array<NotificationType | typeof ALL_VALUE> = [ALL_VALUE, 'SYSTEM', 'DEADLINE', 'WORKSHOP', 'RESULT', 'FEEDBACK'];
const notificationStatuses: Array<NotificationStatus | typeof ALL_VALUE> = [ALL_VALUE, 'UNREAD', 'READ'];

type TeamInvitationNotificationMetadata = {
  action?: string;
  invitationToken?: string;
  teamName?: string;
  eventTitle?: string;
  leaderName?: string;
  leaderEmail?: string;
  targetPath?: string;
};

function notificationTypeVariant(type: NotificationType): 'default' | 'secondary' | 'outline' {
  if (type === 'RESULT' || type === 'FEEDBACK') return 'default';
  if (type === 'DEADLINE') return 'outline';
  return 'secondary';
}

function formatTypeLabel(type: string) {
  return type.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export function NotificationsView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<NotificationStatus | typeof ALL_VALUE>(ALL_VALUE);
  const [type, setType] = useState<NotificationType | typeof ALL_VALUE>(ALL_VALUE);
  const [selectedInvitationNotification, setSelectedInvitationNotification] = useState<Notification | null>(null);

  const query = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    status: status === ALL_VALUE ? undefined : status,
    type: type === ALL_VALUE ? undefined : type,
  }), [page, status, type]);

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.list(query),
    queryFn: () => notificationsApi.list(query),
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toast.success('Notifications marked as read');
    },
    onError: (error) => {
      toast.error('Could not mark notifications as read', { description: getApiErrorMessage(error) });
    },
  });

  const invitationDecisionMutation = useMutation({
    mutationFn: async (decision: 'accept' | 'decline') => {
      const metadata = selectedInvitationNotification?.metadata as TeamInvitationNotificationMetadata | undefined;
      const token = metadata?.invitationToken;
      if (!token) throw new Error('Invitation token is missing.');

      const response = decision === 'accept'
        ? await teamsApi.acceptInvitation(token)
        : await teamsApi.declineInvitation(token);
      return response.data;
    },
    onSuccess: async (result, decision) => {
      if (selectedInvitationNotification?.status === 'UNREAD') {
        await notificationsApi.markAsRead(selectedInvitationNotification.id);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
      ]);
      setSelectedInvitationNotification(null);
      toast.success(decision === 'accept' ? 'Invitation accepted' : 'Invitation declined', {
        description: decision === 'accept'
          ? `You joined ${result.team?.name || 'the team'}.`
          : 'The team leader has been notified.',
      });
    },
    onError: (error) => {
      toast.error('Could not confirm invitation', { description: getApiErrorMessage(error) });
    },
  });

  const notifications = notificationsQuery.data?.data || [];
  const pagination = notificationsQuery.data?.pagination || null;
  const selectedInvitationMetadata = selectedInvitationNotification?.metadata as TeamInvitationNotificationMetadata | undefined;
  const confirmPending = invitationDecisionMutation.isPending;

  const resetAndSetStatus = (value: NotificationStatus | typeof ALL_VALUE) => {
    setStatus(value);
    setPage(1);
  };

  const resetAndSetType = (value: NotificationType | typeof ALL_VALUE) => {
    setType(value);
    setPage(1);
  };

  const handleNotificationClick = async (notification: Notification) => {
    const metadata = notification.metadata as TeamInvitationNotificationMetadata | undefined;
    if (metadata?.action === 'TEAM_INVITATION_CONFIRM' && metadata.invitationToken) {
      setSelectedInvitationNotification(notification);
      return;
    }

    if (notification.status === 'UNREAD') {
      await markAsReadMutation.mutateAsync(notification.id);
    }

    if (metadata?.targetPath) {
      navigate(metadata.targetPath);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Review all system, team, result, and feedback updates.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending || notifications.length === 0}
        >
          {markAllReadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
          Mark all read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <CardTitle className="text-base">Inbox</CardTitle>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-sm font-medium">Status</span>
                <Select value={status} onValueChange={(value) => resetAndSetStatus(value as NotificationStatus | typeof ALL_VALUE)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationStatuses.map((item) => (
                      <SelectItem key={item} value={item}>{item === ALL_VALUE ? 'All statuses' : formatTypeLabel(item)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium">Type</span>
                <Select value={type} onValueChange={(value) => resetAndSetType(value as NotificationType | typeof ALL_VALUE)}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((item) => (
                      <SelectItem key={item} value={item}>{item === ALL_VALUE ? 'All types' : formatTypeLabel(item)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {notificationsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notifications...
            </div>
          ) : notificationsQuery.isError ? (
            <div className="p-4">
              <Alert variant="destructive">
                <Bell className="h-4 w-4" />
                <AlertTitle>Could not load notifications</AlertTitle>
                <AlertDescription>{getApiErrorMessage(notificationsQuery.error)}</AlertDescription>
              </Alert>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No notifications found.
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const metadata = notification.metadata as TeamInvitationNotificationMetadata | undefined;
                const actionable = metadata?.action === 'TEAM_INVITATION_CONFIRM' && Boolean(metadata.invitationToken);
                const unread = notification.status === 'UNREAD';

                return (
                  <button
                    key={notification.id}
                    type="button"
                    className="flex w-full flex-col gap-2 px-4 py-4 text-left transition-colors hover:bg-accent sm:flex-row sm:items-start sm:justify-between"
                    onClick={() => void handleNotificationClick(notification)}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{notification.title}</span>
                        {unread && <span className="h-2 w-2 rounded-full bg-red-500" />}
                        <Badge variant={notificationTypeVariant(notification.type)}>{formatTypeLabel(notification.type)}</Badge>
                      </div>
                      {notification.message && (
                        <p className="break-words text-sm text-muted-foreground">{notification.message}</p>
                      )}
                      {actionable && <p className="text-sm font-medium text-blue-600">Review invitation</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <ListPagination page={page} pagination={pagination} onPageChange={setPage} />
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(selectedInvitationNotification)}
        onOpenChange={(open) => {
          if (!open && !confirmPending) setSelectedInvitationNotification(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Team invitation</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedInvitationMetadata?.leaderName || selectedInvitationMetadata?.leaderEmail || 'A team leader'} invited you to join{' '}
              <span className="font-medium text-foreground">{selectedInvitationMetadata?.teamName || 'this team'}</span>
              {selectedInvitationMetadata?.eventTitle ? ` for ${selectedInvitationMetadata.eventTitle}.` : '.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmPending}>Later</AlertDialogCancel>
            <Button
              variant="outline"
              disabled={confirmPending}
              onClick={() => invitationDecisionMutation.mutate('decline')}
            >
              {confirmPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Decline
            </Button>
            <AlertDialogAction
              disabled={confirmPending}
              onClick={(competition) => {
                competition.preventDefault();
                invitationDecisionMutation.mutate('accept');
              }}
            >
              {confirmPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Accept invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
