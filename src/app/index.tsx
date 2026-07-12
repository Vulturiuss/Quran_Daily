import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useTheme } from '@/providers/ThemeProvider';
import { Palette } from '@/theme';
import { useQuranStore } from '@/store/useQuranStore';

export default function EntryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hydrated = useQuranStore((state) => state.hydrated);
  const onboardingCompleted = useQuranStore((state) => state.onboardingCompleted);
  const onboardingAccountPending = useQuranStore(
    (state) => state.onboardingAccountPending,
  );

  useEffect(() => {
    if (!hydrated) return;
    router.replace(
      onboardingAccountPending
        ? '/onboarding-account'
        : onboardingCompleted
          ? '/(tabs)'
          : '/onboarding',
    );
  }, [hydrated, onboardingAccountPending, onboardingCompleted]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flex: 1,
      justifyContent: 'center',
    },
  });
}
