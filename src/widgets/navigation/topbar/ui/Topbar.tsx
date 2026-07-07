import { memo, useMemo } from 'react';
import { Bell, LogOut, Menu, UserCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Button } from '@/shared/ui/button';
import { getRoleLabel } from '@/entities/session/lib/navigation';
import { useStore } from '@/entities/session/model/store';
import { useLogoutMutation } from '@/hooks/mutations/useAuthMutations';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { notificationsApi } from '@/shared/api/notifications';
import type { EventStatus } from '@/shared/api/types';
import { queryKeys } from '@/lib/queryKeys';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

const eventStatusMeta: Record<EventStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  OPEN_REGISTRATION: { label: 'Open Registration', variant: 'default' },
  REGISTRATION_CLOSED: { label: 'Registration Closed', variant: 'secondary' },
  ONGOING: { label: 'Ongoing', variant: 'default' },
  SCORING: { label: 'Scoring', variant: 'outline' },
  COMPLETED: { label: 'Completed', variant: 'outline' },
  ARCHIVED: { label: 'Archived', variant: 'secondary' },
};

export const Topbar = memo(function Topbar() {
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const selectedEvent = useStore((state) => state.selectedEvent);
  const user = useStore((state) => state.user);
  const appRole = useStore((state) => state.appRole);
  const logoutMutation = useLogoutMutation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.list({ limit: 5 }),
    queryFn: async () => (await notificationsApi.list({ limit: 5 })).data,
    enabled: Boolean(user),
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/login', { replace: true });
  };

  const handleMarkAllNotificationsRead = async () => {
    await notificationsApi.markAllAsRead();
    await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  };

  const displayName = user?.fullName || 'User';
  const displayEmail = user?.email || '';
  const displayRole = getRoleLabel(appRole);
  const selectedEventStatus = selectedEvent ? eventStatusMeta[selectedEvent.status as EventStatus] : null;
  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter((notification) => notification.status === 'UNREAD').length;

  const initials = useMemo(
    () =>
      displayName
        ?.split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
    [displayName]
  );

  return (
    <div className="h-16 border-b border-border bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="w-5 h-5" />
        </Button>

        {selectedEvent && (
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-sm font-semibold">{selectedEvent.title}</h2>
              <p className="text-xs text-muted-foreground">{selectedEvent.semester}</p>
            </div>
            <Badge variant={selectedEventStatus?.variant || 'secondary'}>
              {selectedEventStatus?.label || selectedEvent.status.replaceAll('_', ' ')}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between gap-3">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="text-xs font-normal text-blue-600 hover:text-blue-700"
                  onClick={handleMarkAllNotificationsRead}
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex cursor-default flex-col items-start gap-1 whitespace-normal"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className="text-sm font-medium">{notification.title}</span>
                    {notification.status === 'UNREAD' && <span className="mt-1 h-2 w-2 rounded-full bg-red-500" />}
                  </div>
                  {notification.message && (
                    <span className="text-xs text-muted-foreground">{notification.message}</span>
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-2 h-10 rounded-md hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="w-8 h-8">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName} />}
                <AvatarFallback className="bg-blue-100 text-blue-900 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground">
                  {displayRole}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{displayName}</span>
                  <span className="text-xs text-muted-foreground font-normal">{displayEmail}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <UserCircle className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem disabled>{displayRole}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
});
