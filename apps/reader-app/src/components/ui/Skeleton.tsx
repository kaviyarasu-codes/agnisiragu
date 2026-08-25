// src/components/ui/Skeleton.tsx
// The design's `.sk` pulsing placeholder blocks, plus a composed
// `FeedSkeleton` matching screen 2r (loading skeleton — feed).

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const t = useTheme();
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, { backgroundColor: t.bgAlt, opacity }, style]} />;
}

export function FeedSkeleton() {
  const t = useTheme();
  return (
    <View style={[styles.feed, { backgroundColor: t.bg }]}>
      <View style={styles.chipsRow}>
        <SkeletonBlock style={{ width: 70, height: 26, borderRadius: 20 }} />
        <SkeletonBlock style={{ width: 58, height: 26, borderRadius: 20 }} />
        <SkeletonBlock style={{ width: 76, height: 26, borderRadius: 20 }} />
      </View>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <SkeletonBlock style={{ height: 148, borderRadius: 6 }} />
        <SkeletonBlock style={{ height: 15, width: '92%', marginTop: 12 }} />
        <SkeletonBlock style={{ height: 15, width: '64%', marginTop: 7 }} />
        <SkeletonBlock style={{ height: 10, width: '38%', marginTop: 12 }} />
      </View>
      {[0, 1].map((i) => (
        <View key={i} style={[styles.rowCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <SkeletonBlock style={{ width: 96, height: 72, borderRadius: 6 }} />
          <View style={{ flex: 1 }}>
            <SkeletonBlock style={{ height: 14 }} />
            <SkeletonBlock style={{ height: 14, width: '72%', marginTop: 7 }} />
            <SkeletonBlock style={{ height: 10, width: '44%', marginTop: 11 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: 4 },
  feed: { flex: 1, padding: 12, gap: 10 },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  card: { borderWidth: 1, borderRadius: 10, padding: 12 },
  rowCard: { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', gap: 11 },
});
