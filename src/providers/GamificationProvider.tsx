import { ReactNode, useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useSubscription } from '@/providers/SubscriptionProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { freezeAllowanceFor, hasFullAccess } from '@/utils/access';

export function GamificationProvider({ children }: { children: ReactNode }) {
  const hydrated = useQuranStore((state) => state.hydrated);
  const refreshGamification = useQuranStore((state) => state.refreshGamification);
  const { configured, isPremium, loading } = useSubscription();
  const freezeAllowance = freezeAllowanceFor(hasFullAccess(configured, isPremium));

  const refresh = useCallback(() => {
    // Until the subscription resolves, `isPremium` is false for everyone. Acting
    // on that would apply the free allowance to a premium user, and the store
    // would then see the allowance change again once it resolves.
    if (!hydrated || loading) return;
    refreshGamification(freezeAllowance);
  }, [freezeAllowance, hydrated, loading, refreshGamification]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return children;
}
