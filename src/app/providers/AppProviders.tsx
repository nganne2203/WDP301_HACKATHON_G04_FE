import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { useStore } from '@/entities/session/model/store';
import { SESSION_EXPIRED_EVENT } from '@/lib/authEvents';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/shared/ui/sonner';

function SessionExpiredHandler() {
  const setUser = useStore((state) => state.setUser);
  const setAuthLoading = useStore((state) => state.setAuthLoading);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setAuthLoading(false);
      queryClient.clear();
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [setAuthLoading, setUser]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionExpiredHandler />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
