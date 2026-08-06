// src/hooks/useTheme.ts

import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/app.store';
import { lightTheme, darkTheme, type AppTheme } from '@/theme';

export function useTheme(): AppTheme {
  const { colorScheme } = useAppStore();
  const systemScheme = useColorScheme();

  if (colorScheme === 'dark') return darkTheme;
  if (colorScheme === 'light') return lightTheme;
  // 'system'
  return systemScheme === 'dark' ? darkTheme : lightTheme;
}
