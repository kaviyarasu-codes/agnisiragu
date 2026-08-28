// src/components/ui/Skeleton.tsx
// The design's `.sk` pulsing placeholder blocks, plus a composed
// `FeedSkeleton` matching screen 2r (loading skeleton — feed). Mirrors the
// real ArticleFeedCard layout (see FeedCard.tsx) — fixed image at the top
// (same FEED_IMAGE_HEIGHT_FRACTION), then a byline row, meta row, headline,
// and a few body lines underneath — so the loading-to-loaded transition
// doesn't visibly jump.

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, StyleProp, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { FEED_IMAGE_HEIGHT_FRACTION } from '@/components/feed/FeedCard';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
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
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.feed, { backgroundColor: t.bg }]}>
      {/* Fixed image placeholder — same height fraction as the real card's
          image, so nothing visibly resizes once the real content loads. */}
      <SkeletonBlock style={[styles.image, { borderRadius: 0 }]} />

      <View style={styles.body}>
        <View style={styles.bylineRow}>
          <SkeletonBlock style={styles.avatar} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBlock style={{ height: 12, width: '38%' }} />
            <SkeletonBlock style={{ height: 9, width: '26%' }} />
          </View>
        </View>

        <View style={styles.metaRow}>
          <SkeletonBlock style={{ width: 64, height: 10 }} />
          <SkeletonBlock style={{ width: 44, height: 10 }} />
        </View>

        <SkeletonBlock style={{ height: 20, width: '94%', marginTop: 4 }} />
        <SkeletonBlock style={{ height: 20, width: '70%', marginTop: 8 }} />

        <SkeletonBlock style={{ height: 14, width: '100%', marginTop: 16 }} />
        <SkeletonBlock style={{ height: 14, width: '100%', marginTop: 8 }} />
        <SkeletonBlock style={{ height: 14, width: '88%', marginTop: 8 }} />
        <SkeletonBlock style={{ height: 14, width: '95%', marginTop: 8 }} />
      </View>

      <View style={[styles.actionBar, { borderTopColor: t.border, paddingBottom: insets.bottom ? 0 : 8 }]}>
        <View style={styles.actionGroup}>
          <SkeletonBlock style={{ width: 30, height: 14 }} />
          <SkeletonBlock style={{ width: 30, height: 14 }} />
          <SkeletonBlock style={{ width: 30, height: 14 }} />
        </View>
        <View style={styles.actionGroup}>
          <SkeletonBlock style={{ width: 18, height: 14 }} />
          <SkeletonBlock style={{ width: 18, height: 14 }} />
          <SkeletonBlock style={{ width: 18, height: 14 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: 4 },
  feed: { flex: 1, height: SCREEN_H },
  image: { width: SCREEN_W, height: `${FEED_IMAGE_HEIGHT_FRACTION * 100}%` },
  body: { flex: 1, padding: 15, paddingTop: 13 },
  bylineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  avatar: { width: 22, height: 22, borderRadius: 11 },
  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  actionBar: { height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingHorizontal: 12 },
  actionGroup: { flexDirection: 'row', gap: 16 },
});
