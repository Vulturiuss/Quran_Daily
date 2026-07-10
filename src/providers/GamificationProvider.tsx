import { ReactNode, useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useSubscription } from '@/providers/SubscriptionProvider';
import { useQuranStore } from '@/store/useQuranStore';

export function GamificationProvider({ children }: { children: ReactNode }) {
  const hydrated = useQuranStore((state) => state.hydrated);
  const refreshGamification = useQuranStore((state) => state.refreshGamification);
  const { isPremium } = useSubscription();
  const freezeAllowance = isPremium ? 3 : 1;

  const refresh = useCallback(() => {
    if (!hydrated) return;
    refreshGamification(freezeAllowance);
  }, [freezeAllowance, hydrated, refreshGamification]);

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
