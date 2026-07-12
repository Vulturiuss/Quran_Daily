import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
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
import { FamilyProvider } from '@/providers/FamilyProvider';
import { GamificationProvider } from '@/providers/GamificationProvider';
import { ReminderProvider } from '@/providers/ReminderProvider';
import { SubscriptionProvider } from '@/providers/SubscriptionProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { colors } from '@/theme';

SplashScreen.setOptions({ duration: 500, fade: true });

function useNotificationNavigation() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const redirect = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    };

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse?.notification) redirect(lastResponse.notification);
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) =>
        redirect(response.notification),
      );

    return () => {
      subscription.remove();
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
    <ThemeProvider>
      <SafeAreaProvider>
      <CloudProvider>
        <FamilyProvider>
          <ReminderProvider>
            <SubscriptionProvider>
              <GamificationProvider>
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
                    <Stack.Screen name="onboarding-account" />
                    <Stack.Screen name="account" />
                    <Stack.Screen name="auth/callback" />
                    <Stack.Screen name="family/index" />
                    <Stack.Screen name="family/[userId]" />
                    <Stack.Screen name="library" />
                    <Stack.Screen name="privacy" />
                    <Stack.Screen name="subscription" />
                    <Stack.Screen name="terms" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="session/review"
                      options={{ gestureEnabled: false }}
                    />
                    <Stack.Screen
                      name="session/learn"
                      options={{ gestureEnabled: false }}
                    />
                    <Stack.Screen
                      name="session/complete"
                      options={{ gestureEnabled: false }}
                    />
                    <Stack.Screen name="surah/[number]" />
                  </Stack>
                </AudioProvider>
              </GamificationProvider>
            </SubscriptionProvider>
          </ReminderProvider>
        </FamilyProvider>
      </CloudProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
