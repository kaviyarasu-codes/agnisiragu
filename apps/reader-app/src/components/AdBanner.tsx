// src/components/AdBanner.tsx
// AdMob placeholder — works in Expo Go.
// For production, integrate react-native-google-mobile-ads in a dev build.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants';

export default function AdBanner({ style }: { style?: object }) {
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
