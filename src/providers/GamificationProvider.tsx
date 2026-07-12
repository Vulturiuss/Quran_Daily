import { ReactNode, useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useAccess } from '@/hooks/useAccess';
import { useQuranStore } from '@/store/useQuranStore';

/**
 * Keeps the persisted state in step with the tier. It is the only place allowed
 * to *lower* what the user has, because it is the only one that waits for the
 * subscription to actually resolve.
 */
export function GamificationProvider({ children }: { children: ReactNode }) {
  const hydrated = useQuranStore((state) => state.hydrated);
  const refreshGamification = useQuranStore((state) => state.refreshGamification);
  const enforceLearningLimit = useQuranStore((state) => state.enforceLearningLimit);
  const { freezeAllowance, maxLearningSurahs, resolved } = useAccess();

  const refresh = useCallback(() => {
    // Until the subscription resolves, `isPremium` is false for everyone. Acting
    // on that would apply the free tier to a subscriber — and both writes below
    // are destructive: the freeze balance gets clamped for the month, and surahs
    // being learnt get demoted.
    if (!hydrated || !resolved) return;
    refreshGamification(freezeAllowance);
    // A lapsed subscriber would otherwise keep their three parallel surahs for
    // good, and regain a slot each time one was finished (the queue promotes
    // another). Progress is kept; the surahs simply stop being active.
    enforceLearningLimit(maxLearningSurahs);
  }, [
    enforceLearningLimit,
    freezeAllowance,
    hydrated,
    maxLearningSurahs,
    refreshGamification,
    resolved,
  ]);

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
