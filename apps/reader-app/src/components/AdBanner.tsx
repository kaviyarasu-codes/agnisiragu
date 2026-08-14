// src/components/AdBanner.tsx
// Ad slot rendered in the feed and after article bodies. Shows a Local Ad
// (admin-created, from Admin Panel → Local Ads) when one is active; falls
// back to an AdMob placeholder otherwise (no AdMob SDK wired into the app
// yet — see App Config → Advertisement Placement).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants';
import { useAppStore } from '@/store/app.store';
import { useLocalAds } from '@/hooks/useLocalAds';
import LocalAdCard from './LocalAdCard';

interface Props {
  style?: object;
  index?: number; // used to rotate between multiple active local ads
}

export default function AdBanner({ style, index = 0 }: Props) {
  const { language, remoteConfig } = useAppStore();
  const { data: ads } = useLocalAds();

  if (remoteConfig.localAdsEnable && ads && ads.length > 0) {
    const ad = ads[index % ads.length];
    return <LocalAdCard ad={ad} language={language} style={style} />;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>ADVERTISEMENT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.textSecondary,
    borderStyle: 'dashed',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
});
