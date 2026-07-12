import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// The Android notification channel is created outside React, so it uses the
// static palette. The accent is theme-invariant, so this stays correct.
import { colors } from '@/theme';
import { buildReminderPlan, REMINDER_ID_PREFIX } from '@/utils/reminders';

const LEGACY_REMINDER_ID = 'quran-daily-reminder';
const DAILY_CHANNEL_ID = 'daily-reminders';
const STREAK_CHANNEL_ID = 'streak-alerts';
let notificationHandlerConfigured = false;
let notificationQueue: Promise<void> = Promise.resolve();

export interface SmartReminderInput {
  time: string;
  currentStreak: number;
  completedDates: readonly string[];
}

function ensureNotificationHandler() {
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
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  await Promise.all([
    Notifications.setNotificationChannelAsync(DAILY_CHANNEL_ID, {
      name: 'Rappels quotidiens',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: colors.gold,
    }),
    Notifications.setNotificationChannelAsync(STREAK_CHANNEL_ID, {
      name: 'Protection du streak',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: colors.gold,
    }),
  ]);
}

async function hasNotificationPermission(requestPermission: boolean) {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  if (!requestPermission) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

function enqueueNotificationOperation<T>(operation: () => Promise<T>) {
  const result = notificationQueue.then(operation, operation);
  notificationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function cancelSmartRemindersNow() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const identifiers = scheduled
    .map((notification) => notification.identifier)
    .filter(
      (identifier) =>
        identifier === LEGACY_REMINDER_ID || identifier.startsWith(REMINDER_ID_PREFIX),
    );
  await Promise.all(
    identifiers.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
    ),
  );
}

async function replaceSmartReminderSchedule(
  input: SmartReminderInput,
  requestPermission: boolean,
) {
  if (Platform.OS === 'web') return false;
  ensureNotificationHandler();
  await ensureAndroidChannels();
  if (!(await hasNotificationPermission(requestPermission))) return false;

  await cancelSmartRemindersNow();
  const plan = buildReminderPlan(input);
  await Promise.all(
    plan.map((item) =>
      Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: {
          title: item.title,
          body: item.body,
          data: { url: '/(tabs)', kind: item.kind },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.date,
          channelId:
            Platform.OS === 'android'
              ? item.kind === 'streak'
                ? STREAK_CHANNEL_ID
                : DAILY_CHANNEL_ID
              : undefined,
        },
      }),
    ),
  );
  return true;
}

export async function enableSmartReminders(input: SmartReminderInput) {
  return enqueueNotificationOperation(() => replaceSmartReminderSchedule(input, true));
}

export async function syncSmartReminders(input: SmartReminderInput) {
  return enqueueNotificationOperation(() => replaceSmartReminderSchedule(input, false));
}

export async function cancelSmartReminders() {
  if (Platform.OS === 'web') return;
  ensureNotificationHandler();
  return enqueueNotificationOperation(cancelSmartRemindersNow);
}
