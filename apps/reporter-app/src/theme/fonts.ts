// src/theme/fonts.ts
// Same two-family setup as the reader app: Anek Tamil for display/headline
// Tamil text (the design's `.ta` class), Noto Sans Tamil for body Tamil
// (`.tb`), Barlow / Barlow Condensed for English UI chrome (`.chip`).

import { useFonts } from 'expo-font';
import {
  AnekTamil_400Regular,
  AnekTamil_600SemiBold,
  AnekTamil_700Bold,
  AnekTamil_800ExtraBold,
} from '@expo-google-fonts/anek-tamil';
import {
  NotoSansTamil_400Regular,
  NotoSansTamil_500Medium,
  NotoSansTamil_600SemiBold,
} from '@expo-google-fonts/noto-sans-tamil';
import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from '@expo-google-fonts/barlow';
import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';

export const FONT_MAP = {
  'AnekTamil-Regular': AnekTamil_400Regular,
  'AnekTamil-SemiBold': AnekTamil_600SemiBold,
  'AnekTamil-Bold': AnekTamil_700Bold,
  'AnekTamil-ExtraBold': AnekTamil_800ExtraBold,
  'NotoSansTamil-Regular': NotoSansTamil_400Regular,
  'NotoSansTamil-Medium': NotoSansTamil_500Medium,
  'NotoSansTamil-SemiBold': NotoSansTamil_600SemiBold,
  'Barlow-Regular': Barlow_400Regular,
  'Barlow-Medium': Barlow_500Medium,
  'Barlow-SemiBold': Barlow_600SemiBold,
  'Barlow-Bold': Barlow_700Bold,
  'BarlowCondensed-SemiBold': BarlowCondensed_600SemiBold,
  'BarlowCondensed-Bold': BarlowCondensed_700Bold,
};

export function useAppFonts(): boolean {
  const [loaded] = useFonts(FONT_MAP);
  return loaded;
}
