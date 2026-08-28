// src/components/ui/RateTicker.tsx
// The design's `.rate` strip: sponsor credit + gold/silver rate figures,
// shown under the swipe feed (screens 1a/1b/1d) and article-list cards
// (1c). Gold/silver rates and the sponsor name aren't wired to a backend
// endpoint yet — this renders whatever is passed in, with sensible
// placeholders, so it's ready to plug into a `/rates` + local-ads source
// later without changing the component.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';

interface RateTickerProps {
  sponsorName?: string;
  goldRate?: string;
  silverRate?: string;
  sensexValue?: string;
  variant?: 'dark' | 'light';
}

export default function RateTicker({
  sponsorName = 'Agnisiragu', goldRate = '₹7,240', silverRate = '₹96', sensexValue = '81,050', variant = 'dark',
}: RateTickerProps) {
  const t = useTheme();
  const dark = variant === 'dark';
  const bg = dark ? t.ink900 : t.surface;
  const textColor = dark ? '#fff' : t.ink;
  const dim = dark ? 'rgba(255,255,255,0.55)' : t.inkMuted;

  return (
    <View style={[styles.row, { backgroundColor: bg, borderTopColor: t.border, borderTopWidth: dark ? 0 : 1 }]}>
      <Text style={[styles.caption, { color: dim }]}>sponsor</Text>
      <Text style={[styles.sponsor, { color: textColor }]} numberOfLines={1}>{sponsorName}</Text>
      {dark ? <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} /> : null}
      <Text style={[styles.figure, { color: dark ? t.gold : textColor }]}>22K {goldRate}</Text>
      <Text style={[styles.figure, { color: dark ? '#C9C5C0' : dim }]}>Ag {silverRate}</Text>
      <Text style={[styles.figure, { color: dark ? '#C9C5C0' : dim }]}>Sensex {sensexValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  caption: {
    fontFamily: FONT_FAMILIES.condensedBold,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sponsor: {
    flex: 1,
    fontFamily: FONT_FAMILIES.displaySemiBold,
    fontSize: 11.5,
  },
  divider: { width: 1, height: 16 },
  figure: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 11 },
});
