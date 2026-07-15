export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  JOIN_TEAM_ROOM: 'join_team_room',
  LEAVE_TEAM_ROOM: 'leave_team_room',

  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',

  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',

  MESSAGE_SEEN: 'message_seen',

  NOTIFICATION_CREATED: 'notification_created',
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATIONS_READ_ALL: 'notifications_read_all',

  ERROR: 'error',
} as const;
