import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, MessageSquare, Send, UsersRound } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router';

import { useStore } from '@/entities/session/model/store';
import { teamsApi } from '@/entities/team/api';
import { chatApi } from '@/shared/api/chat';
import { ApiError } from '@/shared/api/client';
import type { ChatMessage, Team } from '@/shared/api/types';
import {
  getChatRoomMessagesQueryKey,
  markChatRoomSeenInCache,
  updateChatRoomLastMessageInCache,
  upsertChatMessageInCache,
} from '@/shared/lib/chatRoomCache';
import { useSocket } from '@/shared/socket/SocketProvider';
import { SOCKET_EVENTS } from '@/shared/socket/socketEvents';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Textarea } from '@/shared/ui/textarea';

import type { ParticipantChatsOutletContext } from './ParticipantChatsLayout';

function formatMessageTime(value?: string) {
  if (!value) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

function getInitials(value?: string) {
  if (!value) return 'TM';
  return value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function MessageBubble({ isMine, message }: { isMine: boolean; message: ChatMessage }) {
  const senderName = message.sender?.fullName || message.sender?.email || 'Unknown user';

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[88%] rounded-[28px] border px-4 py-3 shadow-sm',
          isMine ? 'border-slate-900 bg-slate-950 text-white' : 'border-border bg-white',
        ].join(' ')}
      >
        <div className="mb-2 flex items-start gap-2">
          {!isMine ? (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-slate-100 text-[11px] text-slate-700">
                {getInitials(senderName)}
              </AvatarFallback>
            </Avatar>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium">{isMine ? 'You' : senderName}</p>
              <Badge variant={message.senderRole === 'mentor' ? 'secondary' : 'outline'} className="px-1.5 py-0 text-[10px] uppercase">
                {message.senderRole}
              </Badge>
              <span className={['text-[11px]', isMine ? 'text-white/70' : 'text-muted-foreground'].join(' ')}>
                {formatMessageTime(message.createdAt)}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ParticipantChatRoomView() {
  const navigate = useNavigate();
  const { chatRoomId = '' } = useParams();
  const { rooms } = useOutletContext<ParticipantChatsOutletContext>();
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();
  const user = useStore((state) => state.user);
  const [draft, setDraft] = useState('');
  const lastSeenMessageIdRef = useRef<string | null>(null);

  const room = useMemo(
    () => rooms.find((candidate) => candidate.id === chatRoomId) || null,
    [chatRoomId, rooms],
  );

  const teamQuery = useQuery({
    queryKey: ['participant-chat', 'team', room?.teamId],
    enabled: Boolean(room?.teamId),
    queryFn: async () => (await teamsApi.getById(room!.teamId)).data,
  });

  const messagesQuery = useQuery({
    queryKey: room?.id ? getChatRoomMessagesQueryKey(room.id) : ['chat', 'rooms', 'missing', 'messages'],
    enabled: Boolean(room?.id),
    staleTime: 30_000,
    queryFn: async () => (await chatApi.listMessages(room!.id, { limit: 80 })).data,
  });
  const latestUnreadMessage = useMemo(() => {
    if (!room?.unreadCount || !user?.id) return null;

    return [...(messagesQuery.data || [])]
      .reverse()
      .find((message) => message.senderId !== user.id) || null;
  }, [messagesQuery.data, room?.unreadCount, user?.id]);

  useEffect(() => {
    if (!room?.id || !latestUnreadMessage) return;
    if (lastSeenMessageIdRef.current === latestUnreadMessage.id) return;

    let cancelled = false;

    const markSeen = async () => {
      try {
        if (socket && connected) {
          await new Promise<void>((resolve, reject) => {
            socket.emit(
              SOCKET_EVENTS.MESSAGE_SEEN,
              { chatRoomId: room.id, teamId: room.teamId },
              (response: { ok?: boolean; error?: string }) => {
                if (response?.ok) {
                  resolve();
                  return;
                }
                reject(new Error(response?.error || 'Could not sync read state.'));
              },
            );
          });
        } else {
          await chatApi.markRoomSeen(room.id);
        }

        if (!cancelled) {
          lastSeenMessageIdRef.current = latestUnreadMessage.id;
          markChatRoomSeenInCache(queryClient, room.id);
        }
      } catch {
        // Keep chat usable even if seen sync fails.
      }
    };

    void markSeen();

    return () => {
      cancelled = true;
    };
  }, [connected, latestUnreadMessage, queryClient, room?.id, room?.teamId, socket]);

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      if (socket && connected && room) {
        return await new Promise<ChatMessage>((resolve, reject) => {
          socket.emit(
            SOCKET_EVENTS.SEND_MESSAGE,
            {
              teamId: room.teamId,
              chatRoomId: room.id,
              message,
              messageType: 'text',
            },
            (response: { ok?: boolean; message?: ChatMessage; error?: string }) => {
              if (response?.ok && response.message) {
                resolve(response.message);
                return;
              }
              reject(new Error(response?.error || 'Could not send message.'));
            },
          );
        });
      }

      return (
        await chatApi.sendMessage({
          teamId: room!.teamId,
          chatRoomId: room!.id,
          message,
          messageType: 'text',
        })
      ).data;
    },
    onSuccess: (createdMessage) => {
      setDraft('');
      if (room?.id) {
        upsertChatMessageInCache(queryClient, room.id, createdMessage);
        updateChatRoomLastMessageInCache(queryClient, room.id, createdMessage);
      }
    },
  });

  const team: Team | null = teamQuery.data || null;
  const messages = messagesQuery.data || [];
  const sendError = sendMutation.error instanceof ApiError
    ? sendMutation.error.firstError
    : sendMutation.error instanceof Error
      ? sendMutation.error.message
      : null;

  const handleSend = async () => {
    const message = draft.trim();
    if (!message || !room || sendMutation.isPending) return;
    await sendMutation.mutateAsync(message);
  };

  if (!room) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,#eef2ff,transparent_45%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-950">Conversation unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            This room could not be found for your account. Return to your room list and choose another conversation.
          </p>
          <div className="mt-6 flex justify-center">
            <Button type="button" variant="outline" onClick={() => navigate('/participant/chats')}>
              Back to chats
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,#eef2ff,transparent_45%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <div className="border-b border-border/70 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
        <div className="flex items-start gap-3">
          <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => navigate('/participant/chats')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-slate-950">{room.team?.name || 'Team chat'}</h2>
                <p className="mt-1 truncate text-sm text-slate-500">
                  Shared room for your team and assigned mentors
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{room.participantRole || 'member'}</Badge>
                <Badge variant="secondary">{team?.assignedMentors?.length || 0} mentor(s)</Badge>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(team?.assignedMentors || []).length > 0 ? (
                team!.assignedMentors!.map((mentor) => (
                  <Badge key={mentor.id} variant="outline" className="max-w-full truncate rounded-full bg-white">
                    {mentor.fullName || mentor.email}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-500">No mentors assigned yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-4 xl:p-6">
        <div className="flex h-full min-h-0 flex-col rounded-[28px] border border-white/60 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 p-4 md:p-6">
              {messagesQuery.isLoading ? (
                <div className="flex min-h-[300px] items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading messages...
                </div>
              ) : messagesQuery.error ? (
                <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  {messagesQuery.error instanceof ApiError ? messagesQuery.error.firstError : 'Failed to load messages.'}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-4 text-center text-sm text-muted-foreground">
                  <UsersRound className="h-8 w-8" />
                  <p>No messages yet. Start the first update for your team here.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble key={message.id} isMine={message.senderId === user?.id} message={message} />
                ))
              )}
            </div>
          </ScrollArea>
          <div className="border-t border-border/70 bg-white/90 px-4 py-4 md:px-6">
            <div className="flex items-end gap-3 rounded-[24px] border border-slate-200 bg-slate-50/90 p-3 shadow-sm">
              <div className="min-w-0 flex-1">
                <label className="sr-only" htmlFor={`participant-chat-${room.id}`}>
                  New message
                </label>
            <Textarea
              id={`participant-chat-${room.id}`}
                  rows={1}
                  className="max-h-32 min-h-[44px] resize-y rounded-2xl border-0 bg-transparent px-3 py-2 shadow-none focus-visible:ring-0"
              placeholder="Write an update, ask for help, or coordinate with your mentors here..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
              </div>
              <Button
                type="button"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full"
                onClick={handleSend}
                disabled={!draft.trim() || sendMutation.isPending}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </div>
            {sendError ? <p className="mt-2 text-sm text-destructive">{sendError}</p> : null}
            <div className="mt-2 flex items-center justify-between gap-3 px-1">
              <span className="text-xs text-slate-500">
                Messages update live while this conversation is open.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
