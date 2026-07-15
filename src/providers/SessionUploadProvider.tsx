import { ReactNode, useCallback, useEffect, useRef } from 'react';

import { useCloud } from '@/providers/CloudProvider';
import { submitSession } from '@/services/sessions';
import { useQuranStore } from '@/store/useQuranStore';

/**
 * Drains the queue of completed sessions to the server.
 *
 * Sessions are worked offline — that is the point of the app — so they are queued
 * locally and sent when there is a network. The server is the only judge of
 * whether one counts, and its verdict is what a parent sees; the local stats are
 * the user's own view and stay as they are either way.
 */
export function SessionUploadProvider({ children }: { children: ReactNode }) {
  const { session, online } = useCloud();
  const hydrated = useQuranStore((state) => state.hydrated);
  const pendingSessions = useQuranStore((state) => state.pendingSessions);
  const clearPendingSessions = useQuranStore((state) => state.clearPendingSessions);
  const draining = useRef(false);

  const drain = useCallback(async () => {
    if (draining.current) return;
    if (!session || !online || !hydrated) return;

    const currentUserId = session.user.id;
    // Only send what this account earned, or what was worked signed-out (which
    // merges into this account on first sign-in). A previous account's queued
    // session must never be posted with this account's JWT.
    const queue = useQuranStore
      .getState()
      .pendingSessions.filter(
        (pending) => pending.userId == null || pending.userId === currentUserId,
      );
    if (queue.length === 0) return;

    draining.current = true;
    try {
      const settled: string[] = [];
      for (const pending of queue) {
        const verdict = await submitSession(pending);
        // `retry` is a network failure, not a verdict: stop and keep the rest of
        // the queue, or a lost connection would silently discard real work.
        if (verdict.status === 'retry') break;
        settled.push(pending.id);
      }
      if (settled.length > 0) clearPendingSessions(settled);
    } finally {
      draining.current = false;
    }
  }, [clearPendingSessions, hydrated, online, session]);

  useEffect(() => {
    void drain();
  }, [drain, pendingSessions.length]);

  return children;
}
