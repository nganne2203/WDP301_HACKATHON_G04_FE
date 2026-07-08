import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useStore } from '@/entities/session/model/store';

import { connectSocket, disconnectSocket, getSocket, type AppSocket } from './socket';
import { SOCKET_EVENTS } from './socketEvents';

interface SocketContextValue {
  socket: AppSocket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const user = useStore((state) => state.user);
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setSocket(null);
      setConnected(false);
      return;
    }

    const activeSocket = connectSocket();
    setSocket(activeSocket);
    setConnected(Boolean(activeSocket?.connected));

    if (!activeSocket) return;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    activeSocket.on(SOCKET_EVENTS.CONNECT, handleConnect);
    activeSocket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);

    return () => {
      activeSocket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      activeSocket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);

      if (!getSocket()?.connected) {
        disconnectSocket();
        setSocket(null);
        setConnected(false);
      }
    };
  }, [user?.id]);

  const value = useMemo(
    () => ({ socket, connected }),
    [connected, socket],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}
