// src/components/BreakingNewsCarousel.tsx
// Style: Tamil Samayam / Dailyhunt — red LIVE ticker + full-width card carousel

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import type { Article, Language } from '@/types';

const { width: W } = Dimensions.get('window');

function timeAgo(dateString: string): string {
  const m = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (m < 1) return 'இப்போது';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

interface Props { articles: Article[]; language: Language; mode?: 'slider' | 'single'; }

export default function BreakingNewsCarousel({ articles, language, mode = 'slider' }: Props) {
  const t = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [idx, setIdx] = useState(0);
  const items = mode === 'single' ? articles.slice(0, 1) : articles;

  useEffect(() => {
    if (mode === 'single' || articles.length <= 1) return;
    const timer = setInterval(() => {
      const next = (idx + 1) % articles.length;
      scrollRef.current?.scrollTo({ x: next * W, animated: true });
      setIdx(next);
    }, 5000);
    return () => clearInterval(timer);
  }, [idx, articles.length, mode]);

  if (!articles.length) return null;

  return (
    <View>
      {/* RED TICKER STRIP */}
      <View style={[s.ticker, { backgroundColor: t.red }]}>
        <View style={s.tickerLeft}>
          <View style={s.liveDot} />
          <Text style={s.tickerLabel}>LIVE</Text>
        </View>
        <Text style={s.tickerText} numberOfLines={1}>
          {(() => {
            const a = articles[idx];
            return language === 'ta' ? a.titleTa : a.titleEn;
          })()}
        </Text>
      </View>

      {/* FULL-WIDTH CAROUSEL (or single hero card when mode="single") */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={mode !== 'single'}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
        decelerationRate="fast"
      >
        {items.map((article) => {
          const title = language === 'ta' ? article.titleTa : article.titleEn;
          return (
            <TouchableOpacity
              key={article.id}
              style={[s.card, { width: W }]}
              activeOpacity={0.92}
              onPress={() => router.push(`/article/${article.id}`)}
            >
              {article.thumbnailUrl
                ? <Image source={{ uri: article.thumbnailUrl }} style={s.img} contentFit="cover" />
                : <View style={[s.img, { backgroundColor: t.bgAlt }]} />}
              {/* Dark gradient overlay */}
              <View style={s.overlay} />
              {/* Title on image */}
              <View style={s.textWrap}>
                <Text style={s.cardTitle} numberOfLines={2}>{title}</Text>
                <Text style={s.cardTime}>{timeAgo(article.publishedAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* DOT INDICATORS */}
      {mode !== 'single' && articles.length > 1 && (
        <View style={[s.dots, { backgroundColor: t.bg }]}>
          {articles.map((_, i) => (
            <View key={i} style={[s.dot, { backgroundColor: i === idx ? t.red : t.border }, i === idx && s.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  ticker: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, gap: 10,
  },
  tickerLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  tickerLabel: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tickerText: { flex: 1, color: '#fff', fontSize: 12, fontWeight: '600' },

  card: { height: 220 },
  img: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  textWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, gap: 4,
  },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '800', lineHeight: 24, letterSpacing: -0.2 },
  cardTime: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },

  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 20, height: 4, borderRadius: 2 },
});
