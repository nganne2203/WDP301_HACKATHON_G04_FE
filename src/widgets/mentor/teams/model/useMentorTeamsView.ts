import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { teamsApi } from '@/entities/team/api';
import { useStore } from '@/entities/session/model/store';
import { useCompetitionsQuery, selectDefaultCompetition } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { chatApi } from '@/shared/api/chat';
import { applyIncomingChatMessageInCache, CHAT_ROOMS_QUERY_KEY, markChatRoomSeenInCache } from '@/shared/lib/chatRoomCache';
import type { ChatMessage } from '@/shared/api/types';
import { useSocket } from '@/shared/socket/SocketProvider';
import { SOCKET_EVENTS } from '@/shared/socket/socketEvents';

export function useMentorTeamsView() {
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();
  const user = useStore((state) => state.user);
  const appRole = useStore((state) => state.appRole);
  const isSpeaker = appRole === 'speaker';
  const selectedCompetition = useStore((state) => state.selectedCompetition);
  const setSelectedCompetition = useStore((state) => state.setSelectedCompetition);
  const [page, setPage] = useState(1);

  const eventsQuery = useCompetitionsQuery();
  const competitions = eventsQuery.data || [];

  // Auto-select first competition if store is empty and competitions are loaded
  useEffect(() => {
    if (competitions.length > 0 && !selectedCompetition) {
      const defaultCompetition = selectDefaultCompetition(competitions) || competitions[0];
      setSelectedCompetition({
        id: defaultCompetition.id,
        title: defaultCompetition.title,
        semester: defaultCompetition.semester,
        status: defaultCompetition.status,
      });
    }
  }, [competitions, selectedCompetition, setSelectedCompetition]);

  useEffect(() => {
    setPage(1);
  }, [selectedCompetition?.id]);

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams.list({ competitionId: selectedCompetition?.id, page, limit: 12 }),
    enabled: Boolean(selectedCompetition?.id),
    queryFn: async () => await teamsApi.list({ competitionId: selectedCompetition?.id, page, limit: 12 }),
  });
  const teams = teamsQuery.data?.data || [];
  const pagination = teamsQuery.data?.pagination || null;
  const roomsQuery = useQuery({
    queryKey: CHAT_ROOMS_QUERY_KEY,
    enabled: !isSpeaker,
    staleTime: 30_000,
    queryFn: async () => (await chatApi.listRooms()).data,
  });
  const roomSubscriptions = useMemo(
    () => (roomsQuery.data || []).map((room) => ({ id: room.id, roomKey: room.roomKey, teamId: room.teamId })),
    [roomsQuery.data],
  );
  const roomSubscriptionKey = roomSubscriptions.map((room) => room.id).join('|');

  useEffect(() => {
    if (isSpeaker || !socket || !connected || roomSubscriptions.length === 0) return;

    roomSubscriptions.forEach((room) => {
      socket.emit(SOCKET_EVENTS.JOIN_TEAM_ROOM, { teamId: room.teamId });
    });

    const handleReceiveMessage = (message: ChatMessage) => {
      applyIncomingChatMessageInCache(queryClient, {
        message,
        currentUserId: user?.id || null,
        activeRoomId: null,
      });
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
  }, [connected, isSpeaker, queryClient, roomSubscriptionKey, socket, user?.id]);

  const unreadCountsByTeamId = new Map(
    (roomsQuery.data || []).map((room) => [room.teamId, room.unreadCount || 0]),
  );

  return {
    page,
    setPage,
    pagination,
    appRole,
    isSpeaker,
    eventsQuery,
    competitions,
    selectedCompetition,
    teamsQuery,
    teams,
    roomsQuery,
    unreadCountsByTeamId,
  };
}
