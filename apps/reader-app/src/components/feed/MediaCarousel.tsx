// src/components/feed/MediaCarousel.tsx
// Swipeable "photo 1/3"-style gallery for an article's extra media
// (Article.mediaUrls) — used in the fixed image zone of a feed card and in
// the Full Story hero. Falls back to a single static image (thumbnailUrl)
// when there's no gallery, so every existing article with just one photo
// renders exactly as before. Video items play inline via expo-video with a
// small custom control bar (play/pause, mute, fullscreen) — previously
// these just opened in the device's own video app/browser, which is what
// this replaces.
//
// Swiping through the gallery is a horizontal drag *inside* this
// component's own inner FlatList, which is a nested gesture region — it
// doesn't fight the outer feed's left/right story-navigation swipe because
// the outer FlatList only reacts once this inner list has already
// bottomed out at its first/last item (standard nested-horizontal-list
// behavior in React Native).

import React, { useRef, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import Icon from '@/components/icons/Icon';
import ImageWatermark from './ImageWatermark';

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|m3u8)(\?|$)/i.test(url);
}

// In-app player for a single video item — tap the tile to play/pause, plus
// a small persistent control strip (play/pause, mute, fullscreen) so it
// never depends on remembering the tap-to-toggle gesture. Starts muted
// (typical feed/social convention for autoplay-adjacent video, and it never
// actually autoplays here — playback only starts on a real tap) so a reader
// scrolling through the feed is never surprised by sudden audio.
function VideoTile({ uri, style }: { uri: string; style: object }) {
  const videoViewRef = useRef<React.ElementRef<typeof VideoView>>(null);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = true;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const [muted, setMuted] = useState(true);

  const togglePlay = () => {
    if (isPlaying) player.pause();
    else player.play();
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    player.muted = next;
  };
  const goFullscreen = () => {
    videoViewRef.current?.enterFullscreen();
  };

  return (
    <View style={style}>
      <VideoView
        ref={videoViewRef}
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={false}
        contentFit="cover"
        allowsFullscreen
      />
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={togglePlay} />
      {!isPlaying && (
        <View pointerEvents="none" style={styles.centerPlayGlyph}>
          <Icon name="play" size={22} color="#fff" />
        </View>
      )}
      <View pointerEvents="box-none" style={styles.videoControlsRow}>
        <TouchableOpacity style={styles.videoControlBtn} onPress={togglePlay} hitSlop={10}>
          <Icon name={isPlaying ? 'pause' : 'play'} size={13} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.videoControlBtn} onPress={toggleMute} hitSlop={10}>
          <Icon name={muted ? 'volumeOff' : 'volumeOn'} size={13} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.videoControlBtn} onPress={goFullscreen} hitSlop={10}>
          <Icon name="fullscreen" size={12} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
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
          <VideoTile uri={items[0]} style={[StyleSheet.absoluteFill, styles.videoTile, { backgroundColor: t.bgAlt }]} />
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
              <VideoTile uri={item} style={[styles.videoTile, { width, backgroundColor: t.bgAlt }]} />
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
  centerPlayGlyph: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  videoControlsRow: {
    position: 'absolute', right: 8, bottom: 8,
    flexDirection: 'row', gap: 6,
  },
  videoControlBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
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
