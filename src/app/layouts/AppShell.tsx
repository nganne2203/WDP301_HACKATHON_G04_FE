import { memo, useEffect } from 'react';
import { Sidebar } from '@/widgets/navigation/sidebar/ui/Sidebar';
import { Topbar } from '@/widgets/navigation/topbar/ui/Topbar';
import { useStore } from '@/entities/session/model/store';

export const AppShell = memo(function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useStore((state) => state.setSidebarCollapsed);

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setSidebarCollapsed(true);
    }
  }, [setSidebarCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {!sidebarCollapsed && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
});
