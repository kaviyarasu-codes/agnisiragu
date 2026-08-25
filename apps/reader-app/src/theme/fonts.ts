// src/theme/fonts.ts
// Loads the design's two type families: Anek Tamil (display/headlines, Tamil
// text set in the .ta class in the design) and Noto Sans Tamil (body Tamil
// text, the .tb class) for Tamil glyphs, plus Barlow / Barlow Condensed for
// English UI chrome (labels, numerals, tickers — the .chip class and any
// plain English text in the design).
//
// Run `npm install` after pulling this change — it adds four
// @expo-google-fonts packages to package.json (see below).

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

// Font family name tokens — reference these via FONT_FAMILIES (constants/index.ts),
// never the raw string, so a font swap only touches one file.
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
