import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useCloud } from '@/providers/CloudProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { Palette, typography } from '@/theme';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session, initializing, lastError, syncNow } = useCloud();
  const finishAccountOnboarding = useQuranStore(
    (state) => state.finishAccountOnboarding,
  );

  useEffect(() => {
    if (initializing) return;
    if (session) {
      finishAccountOnboarding();
      void syncNow();
      router.replace('/(tabs)');
      return;
    }
    if (lastError) router.replace('/onboarding-account');
  }, [
    finishAccountOnboarding,
    initializing,
    lastError,
    session,
    syncNow,
  ]);

  return (
    <View style={styles.screen}>
      <ActivityIndicator color={colors.gold} size="large" />
      <Text style={styles.text}>Connexion sécurisée en cours…</Text>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  text: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 13,
  },
  });
}
