import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClientProvider } from '@tanstack/react-query';

import { useStore } from '@/entities/session/model/store';
import { SESSION_EXPIRED_EVENT } from '@/lib/authEvents';
import { queryClient } from '@/lib/queryClient';
import { SocketProvider } from '@/shared/socket/SocketProvider';
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <QueryClientProvider client={queryClient}>
        <SessionExpiredHandler />
        <SocketProvider>{children}</SocketProvider>
        <Toaster />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
