import { ActiveSession } from '@/types';

/**
 * The screen a session in progress belongs to.
 *
 * Several entry points (the Réviser tab, the Apprendre tab, the home screen) can
 * find an unfinished session of another kind waiting. None of them may throw it
 * away silently, so all of them need to be able to send the user *back* to it —
 * and that means one single answer to "where does this session live?".
 */
export type SessionRoute = '/session/review' | '/session/learn' | '/session/verify';

export function sessionRoute(session: ActiveSession): SessionRoute {
  switch (session.kind) {
    case 'review':
      return '/session/review';
    case 'verify':
      return '/session/verify';
    case 'learn':
      return '/session/learn';
    default:
      // 'daily' runs both halves: the reviews first, then the learning one.
      return session.reviewIndex < session.reviewQueue.length
        ? '/session/review'
        : '/session/learn';
  }
}
