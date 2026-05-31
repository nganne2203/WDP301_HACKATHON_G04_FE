import { Bell, LogOut, Menu, Search, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useStore } from '../../../store/useStore';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  coordinator: 'Event Coordinator',
  judge: 'Judge',
  mentor: 'Mentor',
  speaker: 'Speaker',
  team_leader: 'Team Leader',
  participant: 'Participant',
};

export function Topbar() {
  const { toggleSidebar, selectedEvent, user, appRole, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.fullName || 'User';
  const displayEmail = user?.email || '';
  const displayRole = appRole ? (ROLE_LABEL[appRole] ?? appRole) : '';

  const initials = displayName
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
            <Badge variant={selectedEvent.status === 'ONGOING' || selectedEvent.status === 'ongoing' ? 'default' : 'secondary'}>
              {selectedEvent.status.replace('_', ' ')}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-80 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search teams, participants..." className="pl-9" />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>

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
              <DropdownMenuItem disabled>
                <UserCircle className="w-4 h-4 mr-2" />
                {displayRole}
              </DropdownMenuItem>
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
}
