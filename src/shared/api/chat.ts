import { api } from './client';
import type { ChatMessage, ChatRoom, SendChatMessageRequest } from './types';

export const chatApi = {
  listRooms: () => api.get<ChatRoom[]>('/chat/rooms'),

  listMessages: (chatRoomId: string, query?: { before?: string; limit?: number }) =>
    api.get<ChatMessage[]>(`/chat/rooms/${chatRoomId}/messages`, { params: query }),

  sendMessage: (data: SendChatMessageRequest) =>
    api.post<ChatMessage>('/chat/messages', data),
};
