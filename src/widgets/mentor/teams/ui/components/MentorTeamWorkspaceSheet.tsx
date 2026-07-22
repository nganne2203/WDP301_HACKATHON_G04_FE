import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageSquare, Send, UsersRound } from 'lucide-react';

import { TeamDetail } from '@/entities/team';
import { chatApi } from '@/shared/api/chat';
import { ApiError } from '@/shared/api/client';
import type { ChatMessage, Team } from '@/shared/api/types';
import {
  CHAT_ROOMS_QUERY_KEY,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Textarea } from '@/shared/ui/textarea';

type WorkspaceTab = 'overview' | 'chat';

interface MentorTeamWorkspaceSheetProps {
  team: Team;
  open: boolean;
  activeTab: WorkspaceTab;
  onActiveTabChange: (tab: WorkspaceTab) => void;
  onOpenChange: (open: boolean) => void;
}

function formatMessageTime(value?: string) {
  if (!value) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

function messageInitials(value?: string) {
  if (!value) return 'TM';
  return value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const senderName = message.sender?.fullName || message.sender?.email || 'Unknown user';
  const isMentor = message.senderRole === 'mentor';

  return (
    <div className={`flex ${isMentor ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[88%] rounded-[28px] border px-4 py-3 shadow-sm',
          isMentor ? 'border-slate-900 bg-slate-950 text-white' : 'border-border bg-white',
        ].join(' ')}
      >
        <div className="mb-2 flex items-start gap-2">
          {!isMentor ? (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-slate-100 text-[11px] text-slate-700">
                {messageInitials(senderName)}
              </AvatarFallback>
            </Avatar>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{senderName}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isMentor ? 'secondary' : 'outline'} className="px-1.5 py-0 text-[10px] uppercase">
                {message.senderRole}
              </Badge>
              <span className={['text-[11px]', isMentor ? 'text-white/70' : 'text-muted-foreground'].join(' ')}>
                {formatMessageTime(message.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.message}</p>
      </div>
    </div>
  );
}

export function MentorTeamWorkspaceSheet({
  team,
  open,
  activeTab,
  onActiveTabChange,
  onOpenChange,
}: MentorTeamWorkspaceSheetProps) {
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();
  const [draft, setDraft] = useState('');
  const lastSeenMessageIdRef = useRef<string | null>(null);

  const roomsQuery = useQuery({
    queryKey: CHAT_ROOMS_QUERY_KEY,
    enabled: open,
    staleTime: 30_000,
    queryFn: async () => (await chatApi.listRooms()).data,
  });

  const room = useMemo(
    () => roomsQuery.data?.find((candidate) => candidate.teamId === team.id) || null,
    [roomsQuery.data, team.id],
  );

  const messagesQuery = useQuery({
    queryKey: room?.id ? getChatRoomMessagesQueryKey(room.id) : ['chat', 'rooms', 'missing', 'messages'],
    enabled: open && activeTab === 'chat' && Boolean(room?.id),
    staleTime: 30_000,
    queryFn: async () => (await chatApi.listMessages(room!.id, { limit: 80 })).data,
  });
  const latestUnreadMessage = useMemo(() => {
    if (!room?.unreadCount) return null;

    return [...(messagesQuery.data || [])]
      .reverse()
      .find((message) => message.senderRole !== 'mentor') || null;
  }, [messagesQuery.data, room?.unreadCount]);

  useEffect(() => {
    if (!open || activeTab !== 'chat' || !room?.id || !latestUnreadMessage) return;
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
        // Keep chat usable even if seen state fails to sync.
      }
    };

    void markSeen();

    return () => {
      cancelled = true;
    };
  }, [activeTab, connected, latestUnreadMessage, open, queryClient, room?.id, room?.teamId, socket]);

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      if (socket && connected && room) {
        return await new Promise<ChatMessage>((resolve, reject) => {
          socket.emit(
            SOCKET_EVENTS.SEND_MESSAGE,
            {
              chatRoomId: room.id,
              teamId: team.id,
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
          chatRoomId: room?.id,
          teamId: team.id,
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

  const sendError = sendMutation.error instanceof ApiError
    ? sendMutation.error.firstError
    : sendMutation.error instanceof Error
      ? sendMutation.error.message
      : null;
  const messagesError = messagesQuery.error instanceof ApiError ? messagesQuery.error.firstError : null;
  const orderedMessages = messagesQuery.data || [];

  const handleSend = async () => {
    const message = draft.trim();
    if (!message || sendMutation.isPending) return;
    await sendMutation.mutateAsync(message);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-hidden px-0 sm:max-w-3xl xl:max-w-5xl">
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="shrink-0 px-6 pb-3 pr-12">
            <SheetTitle>{team.name}</SheetTitle>
            <SheetDescription>
              One shared team room for members and assigned mentors. Use the tabs below to switch between details and conversation.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 px-6 pb-6">
            <Tabs value={activeTab} onValueChange={(value) => onActiveTabChange(value as WorkspaceTab)} className="h-full gap-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="chat">Team Chat</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="min-h-0">
                <ScrollArea className="h-[calc(100vh-11rem)] rounded-2xl border">
                  <div className="p-4">
                    <TeamDetail team={team} />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="chat" className="min-h-0">
                <div className="flex h-[calc(100vh-11rem)] min-h-0 flex-col rounded-2xl border bg-card">
                  <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{team.status}</Badge>
                        <Badge variant="secondary">{team.assignedMentors?.length || 0} mentor(s)</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Assigned mentors</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {(team.assignedMentors || []).length > 0 ? (
                            team.assignedMentors!.map((mentor) => (
                              <Badge key={mentor.id} variant="outline" className="max-w-full truncate">
                                {mentor.fullName || mentor.email}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No mentors assigned yet.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 p-4">
                    <div className="flex h-full min-h-0 flex-col rounded-[28px] border border-white/60 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                      <ScrollArea className="min-h-0 flex-1">
                        <div className="space-y-4 p-4 md:p-6">
                          {roomsQuery.isLoading || (room && messagesQuery.isLoading) ? (
                            <div className="flex min-h-[300px] items-center justify-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading team chat...
                            </div>
                          ) : roomsQuery.error ? (
                            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                              {roomsQuery.error instanceof ApiError ? roomsQuery.error.firstError : 'Failed to load chat rooms.'}
                            </div>
                          ) : !room ? (
                            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 px-4 text-center text-sm text-muted-foreground">
                              <MessageSquare className="h-8 w-8" />
                              <p>The shared team room has not appeared for this mentor account yet.</p>
                            </div>
                          ) : messagesError ? (
                            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                              {messagesError}
                            </div>
                          ) : orderedMessages.length === 0 ? (
                            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-4 text-center text-sm text-muted-foreground">
                              <UsersRound className="h-8 w-8" />
                              <p>No messages yet. Start the conversation with this team.</p>
                            </div>
                          ) : (
                            orderedMessages.map((message) => <MessageBubble key={message.id} message={message} />)
                          )}
                        </div>
                      </ScrollArea>

                      <div className="border-t border-border/70 bg-white/90 px-4 py-4 md:px-6">
                        <div className="flex items-end gap-3 rounded-[24px] border border-slate-200 bg-slate-50/90 p-3 shadow-sm">
                          <div className="min-w-0 flex-1">
                            <label className="sr-only" htmlFor={`mentor-chat-${team.id}`}>
                              Message
                            </label>
                            <Textarea
                              id={`mentor-chat-${team.id}`}
                              rows={1}
                              className="max-h-32 min-h-[44px] resize-y rounded-2xl border-0 bg-transparent px-3 py-2 shadow-none focus-visible:ring-0"
                              placeholder="Ask for repository updates, clarify blockers, or guide the team here..."
                              value={draft}
                              onChange={(competition) => setDraft(competition.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            className="h-11 w-11 shrink-0 rounded-full"
                            onClick={handleSend}
                            disabled={!room || !draft.trim() || sendMutation.isPending}
                          >
                            {sendMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            <span className="sr-only">Send message</span>
                          </Button>
                        </div>
                        {sendError ? (
                          <p className="mt-2 text-sm text-destructive">{sendError}</p>
                        ) : null}
                        <div className="mt-2 flex items-center justify-between gap-3 px-1">
                          <span className="text-xs text-muted-foreground">
                            {room ? 'Messages update live while this panel is open.' : 'Room will become available once your mentor access is recognized.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
