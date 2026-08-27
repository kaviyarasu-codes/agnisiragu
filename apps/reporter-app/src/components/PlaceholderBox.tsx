// src/components/PlaceholderBox.tsx
// The design's .ph diagonal-stripe placeholder, used for media thumbnails
// until real photo/video capture is wired up (Phase 2).

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FONT_FAMILIES } from '@/constants';

export default function PlaceholderBox({ label, style }: { label?: string; style?: ViewStyle }) {
  return (
    <View style={[styles.box, style]}>
      {label ? (
        <View style={styles.labelWrap}>
          <Text style={styles.label}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#E9E5DF',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  labelWrap: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    margin: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  label: {
    fontFamily: FONT_FAMILIES.uiMedium,
    fontSize: 9,
    color: '#6b6560',
  },
});
