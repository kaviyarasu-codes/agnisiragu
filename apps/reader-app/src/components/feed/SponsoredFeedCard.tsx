// src/components/feed/SponsoredFeedCard.tsx
// Design screen "1c" — Card B: newsprint order (headline first, photo
// second, body, byline pinned bottom). Per an explicit product decision,
// this is the layout reserved for sponsored / ad slides in the feed — the
// reversed reading order is what makes a sponsored slot visually distinct
// from a normal ArticleFeedCard at a glance. Wraps the existing local-ads
// impression/click tracking so behavior is unchanged, only the frame is new.

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import { trackLocalAdImpression, trackLocalAdClick, type LocalAd } from '@/hooks/useLocalAds';
import { CTA_LABEL, resolveUrl } from '@/components/LocalAdCard';

interface Props {
  ad: LocalAd;
  language: 'ta' | 'en';
  width: number;
}

export default function SponsoredFeedCard({ ad, language, width }: Props) {
  const t = useTheme();

  useEffect(() => {
    trackLocalAdImpression(ad.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad.id]);

  const handlePress = () => {
    trackLocalAdClick(ad.id);
    Linking.openURL(resolveUrl(ad)).catch(() => {});
  };

  const cta = CTA_LABEL[ad.ctaType] ?? CTA_LABEL.WEBSITE;

  return (
    <TouchableOpacity
      activeOpacity={0.96}
      onPress={handlePress}
      style={[styles.card, { width, backgroundColor: t.bg, borderColor: t.border }]}
    >
      <Text style={[styles.sponsorLabel, { color: t.inkMuted }]}>
        {language === 'ta' ? 'விளம்பரம்' : 'SPONSORED'}
      </Text>
      <Text style={[styles.title, { color: t.ink }]} numberOfLines={2}>{ad.title}</Text>

      {ad.mediaUrl ? (
        <Image source={{ uri: ad.mediaUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, { backgroundColor: t.bgAlt }]} />
      )}

      {!!ad.description && (
        <Text style={[styles.desc, { color: t.inkSub }]} numberOfLines={5}>{ad.description}</Text>
      )}

      <View style={{ flex: 1 }} />

      <View style={[styles.footer, { borderTopColor: t.border }]}>
        <Text style={[styles.byline, { color: t.inkMuted }]} numberOfLines={1}>Agnisiragu</Text>
        <View style={[styles.ctaButton, { backgroundColor: t.red }]}>
          <Text style={styles.ctaText}>{language === 'ta' ? cta.ta : cta.en}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 15,
  },
  sponsorLabel: {
    fontFamily: FONT_FAMILIES.condensedBold,
    fontSize: 10.5,
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontFamily: FONT_FAMILIES.displayBold,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.2,
  },
  image: { width: '100%', height: 130, borderRadius: 8, marginTop: 12 },
  desc: {
    fontFamily: FONT_FAMILIES.bodyRegular,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  byline: { flex: 1, fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12 },
  ctaButton: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  ctaText: { color: '#fff', fontFamily: FONT_FAMILIES.uiBold, fontSize: 11.5 },
});
