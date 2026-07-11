import { useEffect, useMemo } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useStore } from '@/entities/session/model/store';
import { chatApi } from '@/shared/api/chat';
import { ApiError } from '@/shared/api/client';
import type { ChatMessage, ChatRoom } from '@/shared/api/types';
import { applyIncomingChatMessageInCache, CHAT_ROOMS_QUERY_KEY, markChatRoomSeenInCache } from '@/shared/lib/chatRoomCache';
import { useSocket } from '@/shared/socket/SocketProvider';
import { SOCKET_EVENTS } from '@/shared/socket/socketEvents';
import { Badge } from '@/shared/ui/badge';
import { ScrollArea } from '@/shared/ui/scroll-area';

export interface ParticipantChatsOutletContext {
  rooms: ChatRoom[];
}

function formatRoomTime(value?: string) {
  if (!value) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

function ChatRoomRow({ room, selected }: { room: ChatRoom; selected: boolean }) {
  return (
    <NavLink
      to={`/participant/chats/${room.id}`}
      className={({ isActive }) => [
        'group flex rounded-3xl border p-4 transition-all',
        selected || isActive
          ? 'border-blue-600 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200'
          : 'border-border bg-card hover:border-blue-200 hover:bg-blue-50/60',
      ].join(' ')}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className={[
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
            selected ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-600',
          ].join(' ')}
        >
          <MessageSquare className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{room.team?.name || 'Team chat'}</p>
              <p className={['mt-1 truncate text-xs', selected ? 'text-white/70' : 'text-muted-foreground'].join(' ')}>
                Shared team conversation
              </p>
            </div>
            <span className={['shrink-0 text-[11px]', selected ? 'text-white/70' : 'text-muted-foreground'].join(' ')}>
              {formatRoomTime(room.lastMessage?.createdAt || room.updatedAt)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className={['line-clamp-2 text-sm', selected ? 'text-white/90' : 'text-muted-foreground'].join(' ')}>
              {room.lastMessage?.message || 'No messages yet. Start the conversation.'}
            </p>
            {room.unreadCount > 0 ? (
              <Badge variant={selected ? 'secondary' : 'default'} className="shrink-0 rounded-full px-2 py-0.5 text-[11px]">
                {room.unreadCount > 99 ? '99+' : room.unreadCount}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </NavLink>
  );
}

export function ParticipantChatsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();
  const user = useStore((state) => state.user);
  const selectedRoomId = params.chatRoomId || '';

  const roomsQuery = useQuery({
    queryKey: CHAT_ROOMS_QUERY_KEY,
    staleTime: 30_000,
    queryFn: async () => (await chatApi.listRooms()).data,
  });

  const rooms = roomsQuery.data || [];
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) || null;
  const roomSubscriptions = useMemo(
    () => rooms.map((room) => ({ id: room.id, roomKey: room.roomKey, teamId: room.teamId })),
    [rooms],
  );
  const roomSubscriptionKey = roomSubscriptions.map((room) => room.id).join('|');

  useEffect(() => {
    if (!socket || !connected || roomSubscriptions.length === 0) return;

    roomSubscriptions.forEach((room) => {
      socket.emit(SOCKET_EVENTS.JOIN_TEAM_ROOM, { teamId: room.teamId });
    });

    const handleReceiveMessage = (message: ChatMessage) => {
      applyIncomingChatMessageInCache(queryClient, {
        message,
        currentUserId: user?.id || null,
        activeRoomId: selectedRoomId || null,
      });

      if (message.chatRoomId === selectedRoomId && message.senderId !== user?.id) {
        socket.emit(SOCKET_EVENTS.MESSAGE_SEEN, {
          chatRoomId: message.chatRoomId,
          teamId: message.teamId,
        });
      }
    };

    const handleMessageSeen = (seen: { chatRoomId: string; userId: string }) => {
      if (seen.userId === user?.id) {
        markChatRoomSeenInCache(queryClient, seen.chatRoomId);
      }
    };

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_SEEN, handleMessageSeen);

    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_SEEN, handleMessageSeen);

      roomSubscriptions.forEach((room) => {
        socket.emit(SOCKET_EVENTS.LEAVE_TEAM_ROOM, {
          teamId: room.teamId,
          roomKey: room.roomKey,
        });
      });
    };
  }, [connected, queryClient, roomSubscriptionKey, selectedRoomId, socket, user?.id]);

  const showConversationOnMobile = location.pathname !== '/participant/chats';

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f6f8fc]">
      <div className="border-b border-border/70 bg-white px-6 py-5">
        <div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Chats</h1>
            <p className="mt-1 text-sm text-slate-600">
              Shared team conversations with your members and assigned mentors.
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside
          className={[
            'min-h-0 shrink-0 border-r border-border/70 bg-white',
            showConversationOnMobile ? 'hidden lg:flex' : 'flex',
            'w-full flex-col lg:w-[360px] xl:w-[400px]',
          ].join(' ')}
        >
          <div className="border-b border-border/70 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Team rooms</p>
                <p className="text-xs text-slate-500">{rooms.length} conversation(s)</p>
              </div>
              {roomsQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> : null}
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-3 p-4">
              {roomsQuery.isLoading ? (
                <div className="flex min-h-[220px] items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading chats...
                </div>
              ) : roomsQuery.error ? (
                <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  {roomsQuery.error instanceof ApiError ? roomsQuery.error.firstError : 'Failed to load chat rooms.'}
                </div>
              ) : rooms.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-blue-200 px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                    <MessageSquare className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">No chats yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Your team room will appear here once your account is part of a team conversation.
                    </p>
                  </div>
                </div>
              ) : (
                rooms.map((room) => (
                  <ChatRoomRow key={room.id} room={room} selected={room.id === selectedRoom?.id} />
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        <section className={['min-h-0 flex-1', !showConversationOnMobile ? 'hidden lg:flex' : 'flex'].join(' ')}>
          <Outlet context={{ rooms } satisfies ParticipantChatsOutletContext} />
        </section>
      </div>
    </div>
  );
}

export function ParticipantChatsIndex() {
  return (
    <div className="hidden min-h-0 flex-1 items-center justify-center lg:flex">
      <div className="mx-auto max-w-md px-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-200">
          <MessageSquare className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-slate-950">Select a conversation</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Choose a team room from the left to read updates, ask mentors for support, and keep everyone in one shared thread.
        </p>
      </div>
    </div>
  );
}
