// src/components/LocalAdCard.tsx
// Renders one Local Ad (admin-created, e.g. a local business promo) inside
// the feed's ad slot. Tracks impression on mount and click on CTA press.

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '@/constants';
import { trackLocalAdImpression, trackLocalAdClick, type LocalAd } from '@/hooks/useLocalAds';

const CTA_LABEL: Record<LocalAd['ctaType'], { ta: string; en: string }> = {
  WHATSAPP: { ta: 'வாட்ஸ்அப்', en: 'WhatsApp' },
  PHONE:    { ta: 'அழைக்க',    en: 'Call' },
  WEBSITE:  { ta: 'பார்வையிட', en: 'Visit' },
  EMAIL:    { ta: 'மின்னஞ்சல்', en: 'Email' },
  MAPS:     { ta: 'வழி',        en: 'Directions' },
  FORM:     { ta: 'படிவம்',     en: 'Open' },
};

function resolveUrl(ad: LocalAd): string {
  const v = ad.ctaValue?.trim() ?? '';
  switch (ad.ctaType) {
    case 'WHATSAPP': {
      const digits = v.replace(/\D/g, '');
      const withCountry = digits.length === 10 ? `91${digits}` : digits;
      return `https://wa.me/${withCountry}`;
    }
    case 'PHONE':
      return `tel:${v.replace(/\s/g, '')}`;
    case 'EMAIL':
      return `mailto:${v}`;
    case 'MAPS':
      return /^https?:\/\//i.test(v)
        ? v
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`;
    case 'WEBSITE':
    case 'FORM':
    default:
      return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  }
}

interface Props {
  ad: LocalAd;
  language: 'ta' | 'en';
  style?: object;
}

export default function LocalAdCard({ ad, language, style }: Props) {
  useEffect(() => {
    trackLocalAdImpression(ad.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad.id]);

  const handlePress = () => {
    trackLocalAdClick(ad.id);
    const url = resolveUrl(ad);
    Linking.openURL(url).catch(() => {});
  };

  const cta = CTA_LABEL[ad.ctaType] ?? CTA_LABEL.WEBSITE;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{language === 'ta' ? 'விளம்பரம்' : 'AD'}</Text>
      </View>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.body}>
        {ad.mediaUrl ? (
          <Image source={{ uri: ad.mediaUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={2}>{ad.title}</Text>
          {!!ad.description && (
            <Text style={styles.desc} numberOfLines={2}>{ad.description}</Text>
          )}
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>
              {language === 'ta' ? cta.ta : cta.en}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  body: {
    flexDirection: 'row',
  },
  image: {
    width: 90,
    height: 90,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.border,
  },
  textWrap: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  desc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  ctaButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ctaText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: '700',
  },
});
