import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageSquare, RefreshCcw, Send, UsersRound } from 'lucide-react';

import { TeamDetail } from '@/entities/team';
import { chatApi } from '@/shared/api/chat';
import { ApiError } from '@/shared/api/client';
import type { ChatMessage, Team } from '@/shared/api/types';
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
    <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-[11px] text-blue-700">
              {messageInitials(senderName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{senderName}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isMentor ? 'default' : 'outline'} className="px-1.5 py-0 text-[10px] uppercase">
                {message.senderRole}
              </Badge>
              <span className="text-[11px] text-muted-foreground">{formatMessageTime(message.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm text-foreground">{message.message}</p>
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
  const [draft, setDraft] = useState('');

  const roomsQuery = useQuery({
    queryKey: ['chat', 'rooms'],
    enabled: open,
    staleTime: 30_000,
    refetchInterval: activeTab === 'chat' ? 15_000 : false,
    queryFn: async () => (await chatApi.listRooms()).data,
  });

  const room = useMemo(
    () => roomsQuery.data?.find((candidate) => candidate.teamId === team.id) || null,
    [roomsQuery.data, team.id],
  );

  const messagesQuery = useQuery({
    queryKey: ['chat', 'rooms', room?.id, 'messages'],
    enabled: open && activeTab === 'chat' && Boolean(room?.id),
    refetchInterval: activeTab === 'chat' ? 8_000 : false,
    queryFn: async () => (await chatApi.listMessages(room!.id, { limit: 80 })).data,
  });

  const sendMutation = useMutation({
    mutationFn: async (message: string) => (
      await chatApi.sendMessage({
        chatRoomId: room?.id,
        teamId: team.id,
        message,
        messageType: 'text',
      })
    ).data,
    onSuccess: async () => {
      setDraft('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] }),
        queryClient.invalidateQueries({ queryKey: ['chat', 'rooms', room?.id, 'messages'] }),
      ]);
    },
  });

  const sendError = sendMutation.error instanceof ApiError ? sendMutation.error.firstError : null;
  const messagesError = messagesQuery.error instanceof ApiError ? messagesQuery.error.firstError : null;
  const orderedMessages = messagesQuery.data || [];

  const handleRefresh = async () => {
    await roomsQuery.refetch();
    if (room?.id) await messagesQuery.refetch();
  };

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
                    <Button type="button" variant="outline" size="sm" onClick={handleRefresh} disabled={roomsQuery.isFetching || messagesQuery.isFetching}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>

                  <div className="grid min-h-0 flex-1 gap-4 p-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
                    <div className="min-h-0 rounded-2xl border bg-background">
                      <ScrollArea className="h-full">
                        <div className="space-y-3 p-4">
                          {roomsQuery.isLoading || (room && messagesQuery.isLoading) ? (
                            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading team chat...
                            </div>
                          ) : roomsQuery.error ? (
                            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                              {roomsQuery.error instanceof ApiError ? roomsQuery.error.firstError : 'Failed to load chat rooms.'}
                            </div>
                          ) : !room ? (
                            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-4 text-center text-sm text-muted-foreground">
                              <MessageSquare className="h-8 w-8" />
                              <p>The shared team room has not appeared for this mentor account yet.</p>
                            </div>
                          ) : messagesError ? (
                            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                              {messagesError}
                            </div>
                          ) : orderedMessages.length === 0 ? (
                            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-4 text-center text-sm text-muted-foreground">
                              <UsersRound className="h-8 w-8" />
                              <p>No messages yet. Start the conversation with this team.</p>
                            </div>
                          ) : (
                            orderedMessages.map((message) => <MessageBubble key={message.id} message={message} />)
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="flex min-h-0 flex-col gap-4">
                      <div className="rounded-2xl border bg-background p-4">
                        <p className="text-sm font-medium">Mentor note</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Messages here go to the team’s shared room, so all team members and assigned mentors can follow the conversation.
                        </p>
                      </div>

                      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border bg-background p-4">
                        <label className="mb-2 text-sm font-medium" htmlFor={`mentor-chat-${team.id}`}>
                          Message
                        </label>
                        <Textarea
                          id={`mentor-chat-${team.id}`}
                          className="min-h-[140px] flex-1 resize-none"
                          placeholder="Ask for repository updates, clarify blockers, or guide the team here..."
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                        />
                        {sendError ? (
                          <p className="mt-2 text-sm text-destructive">{sendError}</p>
                        ) : null}
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground">
                            {room ? 'Chat history refreshes automatically while this panel is open.' : 'Room will become available once your mentor access is recognized.'}
                          </span>
                          <Button
                            type="button"
                            onClick={handleSend}
                            disabled={!room || !draft.trim() || sendMutation.isPending}
                          >
                            {sendMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-4 w-4" />
                            )}
                            Send message
                          </Button>
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
