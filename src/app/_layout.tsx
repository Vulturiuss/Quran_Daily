import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import type { Notification } from 'expo-notifications';
import {
  Amiri_400Regular,
  Amiri_700Bold,
  useFonts as useAmiriFonts,
} from '@expo-google-fonts/amiri';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts as useNunitoFonts,
} from '@expo-google-fonts/nunito';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AudioProvider } from '@/providers/AudioProvider';
import { CloudProvider } from '@/providers/CloudProvider';
import { SubscriptionProvider } from '@/providers/SubscriptionProvider';
import { colors } from '@/theme';

SplashScreen.setOptions({ duration: 500, fade: true });

function useNotificationNavigation() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let cancelled = false;
    let subscription: { remove: () => void } | undefined;

    const redirect = (notification: Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    };

    void import('expo-notifications').then((Notifications) => {
      if (cancelled) return;

      const lastResponse = Notifications.getLastNotificationResponse();
      if (lastResponse?.notification) redirect(lastResponse.notification);

      subscription = Notifications.addNotificationResponseReceivedListener((response) =>
        redirect(response.notification),
      );
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);
}

export default function RootLayout() {
  const [amiriLoaded] = useAmiriFonts({ Amiri_400Regular, Amiri_700Bold });
  const [nunitoLoaded] = useNunitoFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  useNotificationNavigation();

  if (!amiriLoaded || !nunitoLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaProvider>
      <CloudProvider>
        <SubscriptionProvider>
          <AudioProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                animation: 'fade_from_bottom',
                contentStyle: { backgroundColor: colors.background },
                headerShown: false,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="account" />
              <Stack.Screen name="subscription" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="session/review" options={{ gestureEnabled: false }} />
              <Stack.Screen name="session/learn" options={{ gestureEnabled: false }} />
              <Stack.Screen name="session/complete" options={{ gestureEnabled: false }} />
              <Stack.Screen name="surah/[number]" />
            </Stack>
          </AudioProvider>
        </SubscriptionProvider>
      </CloudProvider>
    </SafeAreaProvider>
  );
}
