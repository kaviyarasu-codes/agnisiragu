// src/components/feed/MediaCarousel.tsx
// Swipeable "photo 1/3"-style gallery for an article's extra media
// (Article.mediaUrls) — used in the fixed image zone of a feed card and in
// the Full Story hero. Falls back to a single static image (thumbnailUrl)
// when there's no gallery, so every existing article with just one photo
// renders exactly as before. Video items don't have an in-app player yet
// (that needs a native video dependency, deliberately not added here to
// avoid destabilizing the current native build) — tapping one opens it in
// the device's own video app/browser instead of playing inline.
//
// Swiping through the gallery is a horizontal drag *inside* this
// component's own inner FlatList, which is a nested gesture region — it
// doesn't fight the outer feed's left/right story-navigation swipe because
// the outer FlatList only reacts once this inner list has already
// bottomed out at its first/last item (standard nested-horizontal-list
// behavior in React Native).

import React, { useRef, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Linking, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import ImageWatermark from './ImageWatermark';

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|m3u8)(\?|$)/i.test(url);
}

interface Props {
  mediaUrls?: string[];
  thumbnailUrl?: string;
  watermarkCorner?: 'top-right' | 'bottom-right';
}

export default function MediaCarousel({ mediaUrls, thumbnailUrl, watermarkCorner = 'bottom-right' }: Props) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  const items = mediaUrls && mediaUrls.length > 0 ? mediaUrls : (thumbnailUrl ? [thumbnailUrl] : []);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(next, items.length - 1)));
  };

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {items.length === 0 ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bgAlt }]} />
      ) : items.length === 1 ? (
        isVideoUrl(items[0]) ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[StyleSheet.absoluteFill, styles.videoTile, { backgroundColor: t.bgAlt }]}
            onPress={() => Linking.openURL(items[0]).catch(() => {})}
          >
            <Text style={styles.playGlyph}>▶</Text>
          </TouchableOpacity>
        ) : (
          <Image source={{ uri: items[0] }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        )
      ) : width > 0 ? (
        <FlatList
          ref={listRef}
          data={items}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(url, i) => `${url}-${i}`}
          onMomentumScrollEnd={onScrollEnd}
          renderItem={({ item }) => (
            isVideoUrl(item) ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.videoTile, { width, backgroundColor: t.bgAlt }]}
                onPress={() => Linking.openURL(item).catch(() => {})}
              >
                <Text style={styles.playGlyph}>▶</Text>
              </TouchableOpacity>
            ) : (
              <Image source={{ uri: item }} style={{ width, height: '100%' }} contentFit="cover" transition={250} />
            )
          )}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        />
      ) : null}

      {items.length > 1 && (
        <>
          <View pointerEvents="none" style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{isVideoUrl(items[index]) ? 'video' : 'photo'} · {index + 1}/{items.length}</Text>
          </View>
          <View pointerEvents="none" style={styles.dotsRow}>
            {items.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.4)' }]} />
            ))}
          </View>
        </>
      )}

      <ImageWatermark corner={watermarkCorner} />
    </View>
  );
}

const styles = StyleSheet.create({
  videoTile: { alignItems: 'center', justifyContent: 'center' },
  playGlyph: { fontSize: 34, color: '#fff' },
  countBadge: {
    position: 'absolute', left: 10, top: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  countBadgeText: { color: '#fff', fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 10.5 },
  dotsRow: {
    position: 'absolute', bottom: 8, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
});
