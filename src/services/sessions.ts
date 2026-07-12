import { supabase } from '@/services/supabase';
import { PendingSession } from '@/types';

export type SessionVerdict =
  | { status: 'accepted' }
  | { status: 'rejected'; reason: string }
  | { status: 'retry' };

/**
 * Submits one completed session to the server, which decides whether it counts.
 *
 * `accepted` and `rejected` are both final — the session leaves the queue either
 * way. Only `retry` keeps it: that is a network or server failure, not a verdict,
 * and dropping the session then would lose a genuine day of work.
 */
export async function submitSession(
  session: PendingSession,
): Promise<SessionVerdict> {
  if (!supabase) return { status: 'retry' };

  const { data, error } = await supabase.rpc('record_daily_session', {
    client_id: session.id,
    session_date: session.date,
    started_at: session.startedAt,
    completed_at: session.completedAt,
    active_seconds: session.activeSeconds,
    xp_earned: session.xpEarned,
    surahs_reviewed: session.surahsReviewed,
    verses_learned: session.versesLearned,
    is_perfect: session.isPerfect,
  });

  if (error) return { status: 'retry' };

  const verdict = data as { accepted?: boolean; reason?: string } | null;
  if (verdict?.accepted) return { status: 'accepted' };

  // The server judged it impossible (tapped through, forged timestamps…). Keeping
  // it in the queue would retry it forever.
  return { status: 'rejected', reason: verdict?.reason ?? 'unknown' };
}
