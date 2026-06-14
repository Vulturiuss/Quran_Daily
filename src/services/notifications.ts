import { Platform } from 'react-native';

const REMINDER_ID_KEY = 'quran-daily-reminder';
let notificationHandlerConfigured = false;

async function loadNotifications() {
  const Notifications = await import('expo-notifications');

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

export async function configureDailyReminder(time: string) {
  if (Platform.OS === 'web') return false;

  const Notifications = await loadNotifications();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'Rappels quotidiens',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#D4AF37',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission =
    current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return false;

  await cancelDailyReminder();
  const [hour, minute] = time.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID_KEY,
    content: {
      title: 'Ta session du jour t’attend',
      body: 'Cinq minutes pour réciter, apprendre et garder ton élan.',
      data: { url: '/(tabs)' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? 'daily-reminders' : undefined,
    },
  });
  return true;
}

export async function cancelDailyReminder() {
  if (Platform.OS === 'web') return;

  const Notifications = await loadNotifications();
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID_KEY).catch(() => undefined);
}
