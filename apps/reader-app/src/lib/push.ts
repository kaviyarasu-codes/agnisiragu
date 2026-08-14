// src/lib/push.ts
// Registers this device's Expo push token with the backend so breaking-news
// alerts (App Config → Notifications → Breaking News Alert Enable) can reach
// it. Only works for logged-in users — PushToken rows require a userId.

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { patch } from '@/lib/api';

let didRegisterThisSession = false;

export async function registerPushToken(): Promise<void> {
  if (didRegisterThisSession) return;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return; // don't prompt here — Onboarding owns the permission ask

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    await patch('/users/push-token', {
      fcmToken: tokenResponse.data,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });

    didRegisterThisSession = true;
  } catch {
    // Best-effort — a failed registration just means this device won't get
    // breaking-news pushes; it must never block login or app bootstrap.
  }
}
