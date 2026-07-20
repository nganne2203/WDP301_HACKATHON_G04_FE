export const SESSION_EXPIRED_EVENT = 'seal:session-expired';

export function notifySessionExpired() {
  window.dispatchCompetition(new Competition(SESSION_EXPIRED_EVENT));
}
