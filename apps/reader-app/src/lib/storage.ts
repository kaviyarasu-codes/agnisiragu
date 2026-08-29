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
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
  } catch (err) {
    // On some Android devices the very first SecureStore WRITE of a fresh
    // install has to generate the Android Keystore alias, which has been
    // known to throw on certain OEM/OS combinations instead of just being
    // slow — this was previously unguarded here, which is consistent with
    // the "app closes on first launch, works the 2nd time" report (the
    // alias exists by the 2nd launch, so the same write succeeds silently).
    // Logging in requires the token to actually persist, so this is
    // surfaced rather than swallowed like the read-side helpers below.
    console.warn('[storage] setToken failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
  } catch (err) {
    console.warn('[storage] setRefreshToken failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (err) {
    console.warn('[storage] clearTokens failed:', err instanceof Error ? err.message : err);
  }
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
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.ARTICLE_READ_COUNT, String(count));
  } catch (err) {
    console.warn('[storage] setArticleReadCount failed:', err instanceof Error ? err.message : err);
  }
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
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_PREFS, JSON.stringify(prefs));
  } catch (err) {
    console.warn('[storage] setUserPrefs failed:', err instanceof Error ? err.message : err);
    throw err;
  }
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
