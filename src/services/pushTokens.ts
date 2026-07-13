import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { supabase } from '@/services/supabase';

/**
 * The device's push token, kept server-side so a parent can ask for a reminder to
 * be sent without ever seeing the token itself (see `request_family_nudge`).
 *
 * Nothing here is allowed to throw. A token that cannot be registered means one
 * reminder that cannot be delivered — it must never mean an app that will not
 * open, or a sign-out that does not complete.
 */

type PushPlatform = 'ios' | 'android' | 'web';

let currentToken: string | undefined;

function easProjectId(): string | undefined {
  const fromConfig = Constants.expoConfig?.extra?.eas as
    | { projectId?: string }
    | undefined;
  return fromConfig?.projectId ?? Constants.easConfig?.projectId;
}

function devicePlatform(): PushPlatform | undefined {
  if (Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web') {
    return Platform.OS;
  }
  return undefined;
}

async function permissionGranted() {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

/**
 * Registers this device for the current user. Silently does nothing on web, with
 * Supabase unconfigured, without a session, or when the permission is refused.
 */
export async function registerPushToken(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!supabase) return false;

  const client = supabase;
  const platform = devicePlatform();
  if (!platform) return false;

  try {
    const { data } = await client.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return false;

    const projectId = easProjectId();
    if (!projectId) return false;
    if (!(await permissionGranted())) return false;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return false;

    // The token is the key, not the user: a shared family tablet handed from one
    // child to the other must move with it rather than notify both.
    const { error } = await client.from('push_tokens').upsert(
      {
        token,
        user_id: userId,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' },
    );
    if (error) return false;

    currentToken = token;
    return true;
  } catch {
    return false;
  }
}

/**
 * Drops this device's token. Called before signing out — after it, the row is no
 * longer ours to delete, and the next person to use the phone would receive
 * reminders meant for someone else.
 */
export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!supabase) return;

  const client = supabase;
  try {
    const { data } = await client.auth.getSession();
    if (!data.session) return;

    let token = currentToken;
    if (!token) {
      const projectId = easProjectId();
      if (!projectId) return;
      const existing = await Notifications.getExpoPushTokenAsync({ projectId });
      token = existing.data;
    }
    if (!token) return;

    await client.from('push_tokens').delete().eq('token', token);
    currentToken = undefined;
  } catch {
    // A device that could not be unregistered is not a reason to keep someone
    // signed in.
  }
}
