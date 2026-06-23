import { memo, useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { UserCircle } from 'lucide-react';
import { useStore } from '@/entities/session/model/store';
import { getNavigationItems } from '@/widgets/navigation/model/navigation';

export const Sidebar = memo(function Sidebar() {
  const location = useLocation();
  const user = useStore((state) => state.user);
  const appRole = useStore((state) => state.appRole);
  const sidebarCollapsed = useStore((state) => state.sidebarCollapsed);

  const navItems = useMemo(() => getNavigationItems(appRole), [appRole]);

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
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-black shadow-[0_4px_12px_rgba(0,0,0,0.15)] overflow-hidden">
          <img
            src="/assets/Logo1.png"
            alt="SEAL logo"
            className="h-7 w-7 scale-150 object-contain"
          />
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
});
