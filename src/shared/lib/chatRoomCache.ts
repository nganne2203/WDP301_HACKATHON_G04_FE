import type { QueryClient } from '@tanstack/react-query';

import type { ChatMessage, ChatRoom } from '@/shared/api/types';

export const CHAT_ROOMS_QUERY_KEY = ['chat', 'rooms'] as const;
export const getChatRoomMessagesQueryKey = (chatRoomId: string) => ['chat', 'rooms', chatRoomId, 'messages'] as const;

function upsertMessageCollection(current: ChatMessage[] | undefined, message: ChatMessage) {
  if (!current) return [message];

  const existingIndex = current.findIndex((entry) => (
    entry.id === message.id
      || (entry.clientMessageId && entry.clientMessageId === message.clientMessageId)
  ));

  if (existingIndex === -1) return [...current, message];

  return current.map((entry, index) => (index === existingIndex ? message : entry));
}

export function markChatRoomSeenInCache(queryClient: QueryClient, chatRoomId: string) {
  queryClient.setQueryData<ChatRoom[]>(CHAT_ROOMS_QUERY_KEY, (current) => {
    if (!current) return current;

    return current.map((room) => (
      room.id === chatRoomId
        ? { ...room, unreadCount: 0 }
        : room
    ));
  });
}

export function updateChatRoomLastMessageInCache(queryClient: QueryClient, chatRoomId: string, message: ChatMessage) {
  queryClient.setQueryData<ChatRoom[]>(CHAT_ROOMS_QUERY_KEY, (current) => {
    if (!current) return current;

    return current.map((room) => (
      room.id === chatRoomId
        ? { ...room, lastMessage: message, unreadCount: 0, updatedAt: message.updatedAt }
        : room
    ));
  });
}

export function upsertChatMessageInCache(queryClient: QueryClient, chatRoomId: string, message: ChatMessage) {
  queryClient.setQueryData<ChatMessage[]>(
    getChatRoomMessagesQueryKey(chatRoomId),
    (current) => upsertMessageCollection(current, message),
  );
}

export function applyIncomingChatMessageInCache(
  queryClient: QueryClient,
  {
    activeRoomId,
    currentUserId,
    message,
  }: {
    activeRoomId?: string | null;
    currentUserId?: string | null;
    message: ChatMessage;
  },
) {
  upsertChatMessageInCache(queryClient, message.chatRoomId, message);

  queryClient.setQueryData<ChatRoom[]>(CHAT_ROOMS_QUERY_KEY, (current) => {
    if (!current) return current;

    return current.map((room) => {
      if (room.id !== message.chatRoomId) return room;

      const isOwnMessage = Boolean(currentUserId) && message.senderId === currentUserId;
      const isActiveRoom = activeRoomId === room.id;

      return {
        ...room,
        lastMessage: message,
        updatedAt: message.updatedAt,
        unreadCount: isOwnMessage || isActiveRoom ? 0 : (room.unreadCount || 0) + 1,
      };
    });
  });
}
