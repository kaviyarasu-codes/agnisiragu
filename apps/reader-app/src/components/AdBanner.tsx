// src/components/AdBanner.tsx
// Ad slot rendered below the article body on the Article Detail screen.
// The OTHER app-wide ad placement — a full-screen interstitial card
// inserted every `adInFeedFrequency` articles in the Home swipe feed — is
// SwipeFeed.tsx's own ad slide (see FeedCard.tsx's second export /
// SponsoredFeedCard), not this component.
//
// Both placements show a Local Ad (admin-created, from Admin Panel →
// Local Ads) when one is active; otherwise they fall back to this dashed
// placeholder box. AdMob itself isn't wired into the app yet — banner/
// interstitial/native unit IDs are already saved in App Config →
// Advertisement Placement so they're ready the moment
// react-native-google-mobile-ads is added in a future native build (that
// build is a separate, deliberate step — see remoteConfig.admobEnable /
// admobBannerUnitId etc. in app.store.ts). Restyled onto theme tokens +
// FONT_FAMILIES.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import { useAppStore } from '@/store/app.store';
import { useLocalAds } from '@/hooks/useLocalAds';
import LocalAdCard from './LocalAdCard';

interface Props {
  style?: object;
  index?: number; // used to rotate between multiple active local ads
}

export default function AdBanner({ style, index = 0 }: Props) {
  const t = useTheme();
  const { language, remoteConfig } = useAppStore();
  const { data: ads } = useLocalAds();

  if (remoteConfig.localAdsEnable && ads && ads.length > 0) {
    const ad = ads[index % ads.length];
    return <LocalAdCard ad={ad} language={language} style={style} />;
  }

  return (
    <View style={[styles.container, { borderColor: t.borderStrong, backgroundColor: t.bgAlt }, style]}>
      <Text style={[styles.label, { color: t.inkMuted }]}>ADVERTISEMENT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  label: {
    fontFamily: FONT_FAMILIES.condensedBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
