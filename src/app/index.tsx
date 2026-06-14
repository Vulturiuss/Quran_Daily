import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { colors } from '@/theme';
import { useQuranStore } from '@/store/useQuranStore';

export default function EntryScreen() {
  const hydrated = useQuranStore((state) => state.hydrated);
  const onboardingCompleted = useQuranStore((state) => state.onboardingCompleted);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(onboardingCompleted ? '/(tabs)' : '/onboarding');
  }, [hydrated, onboardingCompleted]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
