// src/lib/storage.ts

import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants';

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

export async function getOnboardingDone(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(STORAGE_KEYS.ONBOARDING_DONE)) === '1';
  } catch {
    return false;
  }
}

export async function setOnboardingDone(): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.ONBOARDING_DONE, '1');
}
