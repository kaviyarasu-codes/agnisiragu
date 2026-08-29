// src/lib/push.ts
// Registers this device's Expo push token with the backend so breaking-news
// alerts can reach it. Two paths:
//   - registerGuestPushToken(): works for EVERYONE, logged in or not — this
//     is what most installs will use, since login is only required after
//     the free-article limit. Ties the token to an auto-created guest user
//     keyed by a persisted per-device ID.
//   - registerPushToken(): called after a real login (or on relaunch while
//     already logged in) and re-points the same token at the real account.
// Both are safe to call in either order — the backend only creates a guest
// row if the token isn't already registered, so a logged-in user's token
// never gets silently downgraded back to a guest.

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getPermissionsAsync, getExpoPushTokenAsync } from '@/lib/notificationsCompat';
import { patch } from '@/lib/api';
import { getOrCreateDeviceId } from '@/lib/storage';

let cachedExpoToken: string | null = null;
let didRegisterGuestThisSession = false;
let didRegisterUserThisSession = false;

async function getExpoToken(): Promise<string | null> {
  if (cachedExpoToken) return cachedExpoToken;
  const { status } = await getPermissionsAsync();
  if (status !== 'granted') return null; // don't prompt here — Onboarding owns the permission ask

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  if (!token) return null;
  cachedExpoToken = token;
  return cachedExpoToken;
}

export async function registerGuestPushToken(): Promise<void> {
  if (didRegisterGuestThisSession) return;
  try {
    const fcmToken = await getExpoToken();
    if (!fcmToken) return;

    const deviceId = await getOrCreateDeviceId();
    await patch('/guest/push-token', {
      deviceId,
      fcmToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    didRegisterGuestThisSession = true;
  } catch (err) {
    // Best-effort — never block app bootstrap on this. Still log it (was
    // silently swallowed before), since a save failure here is a different,
    // rarer problem than getExpoToken() returning null.
    console.warn('[push] registerGuestPushToken failed:', err instanceof Error ? err.message : err);
  }
}

export async function registerPushToken(): Promise<void> {
  if (didRegisterUserThisSession) return;
  try {
    const fcmToken = await getExpoToken();
    if (!fcmToken) return;

    await patch('/users/push-token', {
      fcmToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    didRegisterUserThisSession = true;
  } catch (err) {
    // Best-effort — a failed registration just means this device won't get
    // breaking-news pushes; it must never block login or app bootstrap.
    console.warn('[push] registerPushToken failed:', err instanceof Error ? err.message : err);
  }
}
