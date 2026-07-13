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

  // The `p_` prefix is load-bearing: the RPC's parameters must not collide with
  // the column names, or `ON CONFLICT (user_id, session_date)` is ambiguous and
  // the function raises on every call. See supabase/schema.sql.
  const { data, error } = await supabase.rpc('record_daily_session', {
    p_client_id: session.id,
    p_session_date: session.date,
    p_started_at: session.startedAt,
    p_completed_at: session.completedAt,
    p_active_seconds: session.activeSeconds,
    p_xp_earned: session.xpEarned,
    p_surahs_reviewed: session.surahsReviewed,
    p_recited_verses: session.recitedVerses ?? 0,
    p_verses_learned: session.versesLearned,
    p_is_perfect: session.isPerfect,
  });

  if (error) return { status: 'retry' };

  const verdict = data as { accepted?: boolean; reason?: string } | null;
  if (verdict?.accepted) return { status: 'accepted' };

  // The server judged it impossible (tapped through, forged timestamps…). Keeping
  // it in the queue would retry it forever.
  return { status: 'rejected', reason: verdict?.reason ?? 'unknown' };
}
