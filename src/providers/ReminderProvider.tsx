import { ReactNode, useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { cancelSmartReminders, syncSmartReminders } from '@/services/notifications';
import { useQuranStore } from '@/store/useQuranStore';

export function ReminderProvider({ children }: { children: ReactNode }) {
  const hydrated = useQuranStore((state) => state.hydrated);
  const onboardingCompleted = useQuranStore((state) => state.onboardingCompleted);
  const notificationsEnabled = useQuranStore(
    (state) => state.profile.notificationsEnabled,
  );
  const notificationTime = useQuranStore((state) => state.profile.notificationTime);
  const currentStreak = useQuranStore((state) => state.stats.currentStreak);
  const history = useQuranStore((state) => state.history);

  const refreshSchedule = useCallback(async () => {
    if (Platform.OS === 'web' || !hydrated) return;
    if (!onboardingCompleted || !notificationsEnabled) {
      await cancelSmartReminders();
      return;
    }
    await syncSmartReminders({
      time: notificationTime,
      currentStreak,
      completedDates: history.map((record) => record.date),
    });
  }, [
    currentStreak,
    history,
    hydrated,
    notificationTime,
    notificationsEnabled,
    onboardingCompleted,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshSchedule().catch(() => undefined);
    }, 350);
    return () => clearTimeout(timer);
  }, [refreshSchedule]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshSchedule().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [refreshSchedule]);

  return children;
}
