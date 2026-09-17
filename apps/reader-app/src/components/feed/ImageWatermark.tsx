// src/components/feed/ImageWatermark.tsx
// Small brand watermark overlaid on every article photo (feed cards + the
// full article hero image) — per the design's "logo watermark" callout on
// the feed card sketch. Sits directly on the photo with a transparent
// background (a soft drop shadow keeps it legible instead of a pill chip).
// Purely decorative: pointerEvents "none" so it never intercepts the
// card's own tap/swipe gestures.

import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  corner?: 'top-right' | 'bottom-right';
  // 'xs' added for small list-row thumbnails (ArticleCard.tsx's 110×88 —
  // the default 50×22 logo reads as oversized there). Default unchanged so
  // every existing caller (feed cards, hero carousel) keeps its look.
  size?: 'xs' | 'md';
  style?: ViewStyle;
}

const LOGO_SIZES = {
  xs: { width: 30, height: 13 },
  md: { width: 50, height: 22 },
};

export default function ImageWatermark({ corner = 'bottom-right', size = 'md', style }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[styles.chip, corner === 'top-right' ? styles.topRight : styles.bottomRight, style]}
    >
      <Image
        source={require('../../../assets/logo.png')}
        style={[styles.logo, LOGO_SIZES[size]]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { position: 'absolute' },
  topRight: { top: 10, right: 10 },
  bottomRight: { bottom: 10, right: 10 },
  logo: {
    opacity: 0.95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
});
