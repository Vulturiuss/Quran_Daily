import { useSubscription } from '@/providers/SubscriptionProvider';
import { Capabilities, capabilities, hasFullAccess } from '@/utils/access';

export interface Access extends Capabilities {
  hasFullAccess: boolean;
  /**
   * False until RevenueCat, the Supabase profile and auth have all answered.
   *
   * While unresolved, `isPremium` is false for *everyone*, so the capabilities
   * below describe the free tier even for a subscriber. Two rules follow, and
   * they are the whole point of this hook:
   *
   * - **Render optimistically.** Showing a free-tier UI for a beat makes a
   *   subscriber's theme flash back to the default and pops an upsell they have
   *   already paid to remove.
   * - **Never write.** A write taken on unresolved capabilities is destructive
   *   and does not heal: `setLearningSurah(n, 1)` demoted a subscriber's other
   *   two surahs to `locked`, and a session started with `freezeAllowance: 1`
   *   clamped their three streak freezes to one for the rest of the month.
   *
   * Guard every tier-dependent write with `resolved`.
   */
  resolved: boolean;
}

export function useAccess(): Access {
  const { configured, isPremium, loading } = useSubscription();
  const full = hasFullAccess(configured, isPremium);

  return {
    ...capabilities(full),
    hasFullAccess: full,
    resolved: !loading,
  };
}
