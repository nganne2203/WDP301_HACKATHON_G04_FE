import { Link, useLocation } from 'react-router';
import { cn } from '../../../lib/cn';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UsersRound,
  ClipboardCheck,
  Github,
  Scale,
  Trophy,
  Settings,
  Award,
  UserCircle,
} from 'lucide-react';
import { useStore } from '../../../store/useStore';

const coordinatorNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/coordinator' },
  { icon: Calendar, label: 'Events', href: '/coordinator/events' },
  { icon: Users, label: 'Participants', href: '/coordinator/participants' },
  { icon: UsersRound, label: 'Teams', href: '/coordinator/teams' },
  { icon: ClipboardCheck, label: 'Check-in', href: '/coordinator/checkin' },
  { icon: Github, label: 'Repositories', href: '/coordinator/repos' },
  { icon: Scale, label: 'Judging', href: '/coordinator/judging' },
  { icon: Trophy, label: 'Results', href: '/coordinator/results' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

const judgeNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/judge' },
  { icon: Scale, label: 'Score Teams', href: '/judge/scoring' },
];

const participantNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/participant' },
  { icon: UsersRound, label: 'My Team', href: '/participant/team' },
];

const mentorNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/mentor' },
  { icon: UsersRound, label: 'My Teams', href: '/mentor/teams' },
];

export function Sidebar() {
  const location = useLocation();
  const { user, appRole, sidebarCollapsed } = useStore();

  const navItems = appRole === 'coordinator' || appRole === 'admin'
    ? coordinatorNav
    : appRole === 'judge'
    ? judgeNav
    : appRole === 'mentor'
    ? mentorNav
    : participantNav;

  const displayName = user?.fullName || 'User';
  const primaryRole = appRole || 'participant';

  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-white border-r border-border transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center gap-3 h-16 px-4 border-b border-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <Award className="w-6 h-6" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <h1 className="text-lg font-semibold">SEAL</h1>
            <p className="text-xs text-muted-foreground">Hackathon Platform</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <UserCircle className="w-5 h-5 flex-shrink-0 text-gray-700" />
          {!sidebarCollapsed && user && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">{primaryRole}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
