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
  style?: ViewStyle;
}

export default function ImageWatermark({ corner = 'bottom-right', style }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[styles.chip, corner === 'top-right' ? styles.topRight : styles.bottomRight, style]}
    >
      <Image
        source={require('../../../assets/logo.png')}
        style={styles.logo}
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
    width: 50,
    height: 22,
    opacity: 0.95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
});
