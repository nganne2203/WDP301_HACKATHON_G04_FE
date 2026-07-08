import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL, getAccessToken } from '@/shared/api/client';

const SOCKET_URL = API_BASE_URL.replace(/\/api$/, '');

export type AppSocket = Socket;

let socket: AppSocket | null = null;

function resolveSocketAuth() {
  const token = getAccessToken();
  return token ? { token } : {};
}

export function connectSocket() {
  const token = getAccessToken();
  if (!token) return null;

  if (socket) {
    socket.auth = resolveSocketAuth();
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: resolveSocketAuth(),
    transports: ['websocket', 'polling'],
  });

  socket.io.on('reconnect_attempt', () => {
    if (!socket) return;
    socket.auth = resolveSocketAuth();
  });

  socket.connect();
  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}
