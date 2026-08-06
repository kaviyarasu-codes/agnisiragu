// src/components/BreakingNewsCarousel.tsx

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { COLORS } from '@/constants';
import type { Article, Language } from '@/types';

const { width: W } = Dimensions.get('window');
const CARD_W = W - 28;

function timeAgo(dateString: string): string {
  const m = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (m < 1) return 'இப்போது';
  if (m < 60) return `${m} நிமிடம் முன்`;
  return `${Math.floor(m / 60)} மணி முன்`;
}

interface Props { articles: Article[]; language: Language; }

export default function BreakingNewsCarousel({ articles, language }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (articles.length <= 1) return;
    const t = setInterval(() => {
      const next = (idx + 1) % articles.length;
      scrollRef.current?.scrollTo({ x: next * CARD_W, animated: true });
      setIdx(next);
    }, 4500);
    return () => clearInterval(t);
  }, [idx, articles.length]);

  if (!articles.length) return null;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.liveRow}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>BREAKING NEWS</Text>
        </View>
        <Text style={s.headerRight}>முக்கிய செய்திகள்</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / CARD_W))}
        decelerationRate="fast"
        snapToInterval={CARD_W}
      >
        {articles.map((article) => {
          const title = language === 'ta' ? article.titleTa : article.titleEn;
          return (
            <TouchableOpacity
              key={article.id}
              style={s.card}
              activeOpacity={0.9}
              onPress={() => router.push(`/article/${article.id}`)}
            >
              {article.thumbnailUrl ? (
                <Image source={{ uri: article.thumbnailUrl }} style={s.img} contentFit="cover" />
              ) : (
                <View style={[s.img, { backgroundColor: COLORS.primaryDark }]} />
              )}
              <View style={s.imgOverlay} />
              <View style={s.accentBar} />
              <View style={s.textBlock}>
                <Text style={s.title} numberOfLines={3}>{title}</Text>
                <Text style={s.time}>{timeAgo(article.publishedAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {articles.length > 1 && (
        <View style={s.dots}>
          {articles.map((_, i) => (
            <View key={i} style={[s.dot, i === idx && s.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 6 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  liveText: { color: COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  headerRight: { color: COLORS.inkLight, fontSize: 11, fontWeight: '500' },
  card: {
    width: CARD_W, height: 130,
    marginHorizontal: 14, borderRadius: 3,
    overflow: 'hidden', backgroundColor: '#1A1410',
  },
  img: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  imgOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,10,5,0.65)',
  },
  accentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 3, backgroundColor: COLORS.primary,
  },
  textBlock: { flex: 1, padding: 14, paddingLeft: 16, justifyContent: 'center', gap: 8 },
  title: { color: '#FFF', fontSize: 15, fontWeight: '700', lineHeight: 22, letterSpacing: -0.2 },
  time: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8, marginBottom: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary, width: 16 },
});
