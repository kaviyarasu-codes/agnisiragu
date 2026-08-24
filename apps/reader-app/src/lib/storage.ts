// src/lib/storage.ts

import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants';
import type { UserPrefs } from '@/types';

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
}

export async function getArticleReadCount(): Promise<number> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEYS.ARTICLE_READ_COUNT);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export async function setArticleReadCount(count: number): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.ARTICLE_READ_COUNT, String(count));
}

export async function getUserPrefs(): Promise<UserPrefs | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEYS.USER_PREFS);
    return raw ? (JSON.parse(raw) as UserPrefs) : null;
  } catch {
    return null;
  }
}

export async function setUserPrefs(prefs: UserPrefs): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_PREFS, JSON.stringify(prefs));
}

// Stable per-install identifier — used to register push notifications for
// guest readers who haven't logged in (login is only required after the
// free-article limit, so most installs never log in at all).
function generateDeviceId(): string {
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_ID);
    if (existing) return existing;
    const id = generateDeviceId();
    await SecureStore.setItemAsync(STORAGE_KEYS.DEVICE_ID, id);
    return id;
  } catch {
    return generateDeviceId();
  }
}
