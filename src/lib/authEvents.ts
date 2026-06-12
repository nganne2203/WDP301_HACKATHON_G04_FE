export const SESSION_EXPIRED_EVENT = 'seal:session-expired';

export function notifySessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
