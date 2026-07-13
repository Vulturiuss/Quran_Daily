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
import { OfflineAudioProvider } from '@/providers/OfflineAudioProvider';
import { ReminderProvider } from '@/providers/ReminderProvider';
import { SessionUploadProvider } from '@/providers/SessionUploadProvider';
import { SubscriptionProvider } from '@/providers/SubscriptionProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
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

// The Stack lives in its own component so it can read the palette: RootLayout
// renders ThemeProvider, so it cannot call useTheme() at its own level. Without
// this the navigator background stayed teal and every screen transition flashed
// teal on the pink and blue themes.
function ThemedStack() {
  const { colors } = useTheme();

  return (
    <>
      {/* On the light theme, white status-bar icons would be invisible. */}
      <StatusBar style={colors.scheme === 'light' ? 'dark' : 'light'} />
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
      <Stack.Screen name="map" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="ramadan" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="session/review" options={{ gestureEnabled: false }} />
      <Stack.Screen name="session/learn" options={{ gestureEnabled: false }} />
      <Stack.Screen name="session/verify" options={{ gestureEnabled: false }} />
      <Stack.Screen name="session/complete" options={{ gestureEnabled: false }} />
        <Stack.Screen name="surah/[number]" />
      </Stack>
    </>
  );
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
    // Before the store hydrates there is no selected theme yet, so the splash
    // fallback keeps the static default palette.
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaProvider>
      <CloudProvider>
        <FamilyProvider>
          <ReminderProvider>
            <SubscriptionProvider>
              <SessionUploadProvider>
              {/* Inside SubscriptionProvider: offline audio is a Premium feature,
                  so it needs the tier before it downloads anything. */}
              <OfflineAudioProvider>
              <GamificationProvider>
                {/* ThemeProvider sits below SubscriptionProvider: themes are a
                    Premium feature, so it needs to know the tier to fall back to
                    the default palette for free users. */}
                <ThemeProvider>
                  <AudioProvider>
                    <ThemedStack />
                  </AudioProvider>
                </ThemeProvider>
              </GamificationProvider>
              </OfflineAudioProvider>
              </SessionUploadProvider>
            </SubscriptionProvider>
          </ReminderProvider>
        </FamilyProvider>
      </CloudProvider>
    </SafeAreaProvider>
  );
}
