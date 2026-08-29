// src/lib/notificationsCompat.ts
// expo-notifications' Android remote-push APIs throw synchronously at
// *module load* time when running inside Expo Go on SDK 53+ (Expo dropped
// remote push from Expo Go entirely — see
// https://docs.expo.dev/develop/development-builds/introduction/). A plain
// `import * as Notifications from 'expo-notifications'` at the top of a
// file can't be wrapped in try/catch (imports execute before any of your
// code runs), so every screen that touched it was crashing the whole
// router on launch under Expo Go. This module requires it lazily instead —
// only inside a real dev/production build — and returns safe fallbacks
// everywhere else so screens render normally (just without live push
// permission state) while previewing in Expo Go. Real push notifications
// still require a dev/production build either way; this only stops Expo Go
// previews from crashing on the way to testing everything else.

import Constants, { ExecutionEnvironment } from 'expo-constants';
// Type-only import — erased at compile time, so it never triggers the
// Expo-Go module-load crash that loadNotifications() below guards against.
import type { NotificationResponse, Subscription } from 'expo-notifications';

export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

function loadNotifications(): typeof import('expo-notifications') | null {
  if (isExpoGo()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-notifications');
  } catch {
    return null;
  }
}

export async function getPermissionsAsync(): Promise<{ status: PermissionStatus }> {
  const Notifications = loadNotifications();
  if (!Notifications) return { status: 'undetermined' };
  try {
    return await Notifications.getPermissionsAsync();
  } catch {
    return { status: 'undetermined' };
  }
}

export async function requestPermissionsAsync(): Promise<{ status: PermissionStatus }> {
  const Notifications = loadNotifications();
  if (!Notifications) return { status: 'undetermined' };
  try {
    return await Notifications.requestPermissionsAsync();
  } catch {
    return { status: 'undetermined' };
  }
}

export async function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<string | null> {
  const Notifications = loadNotifications();
  if (!Notifications) return null;
  try {
    const res = await Notifications.getExpoPushTokenAsync(options);
    return res.data;
  } catch (err) {
    // This used to swallow the error completely — every push-registration
    // failure looked identical to "user just hasn't opened the app yet",
    // with zero trail anywhere. The #1 real-world cause is missing FCM/APNs
    // push credentials for this EAS project (run `eas credentials` to
    // check/upload them) — but log the actual thrown error so a connected
    // Metro/dev-client session shows the real reason instead of a guess.
    console.warn('[push] getExpoPushTokenAsync failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// Cold-start case: the app process was launched BY tapping a notification
// (it wasn't already running). Returns the response that launched it, or
// null on a normal launch / in Expo Go.
export async function getLastNotificationResponseAsync(): Promise<NotificationResponse | null> {
  const Notifications = loadNotifications();
  if (!Notifications) return null;
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch {
    return null;
  }
}

// Warm case: the app was already running (foreground or background) and the
// user tapped a notification. Returns a no-op subscription in Expo Go so
// callers can unconditionally call .remove() on cleanup.
export function addNotificationResponseReceivedListener(
  callback: (response: NotificationResponse) => void,
): Subscription {
  const Notifications = loadNotifications();
  if (!Notifications) return { remove: () => {} } as Subscription;
  try {
    return Notifications.addNotificationResponseReceivedListener(callback);
  } catch {
    return { remove: () => {} } as Subscription;
  }
}
