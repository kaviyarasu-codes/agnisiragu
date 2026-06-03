// src/components/BreakingNewsCarousel.tsx

import React, { useRef, useEffect, useState } from 'react';
import { View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { COLORS, STRINGS } from '@/constants';
import type { Article, Language } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface BreakingNewsCarouselProps {
  articles: Article[];
  language: Language;
}

function timeAgo(dateString: string): string {
  const diffMins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (diffMins < 1) return 'இப்போது';
  if (diffMins < 60) return `${diffMins} நிமிடம் முன்`;
  return `${Math.floor(diffMins / 60)} மணி முன்`;
}

export default function BreakingNewsCarousel({ articles, language }: BreakingNewsCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (articles.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % articles.length;
      scrollRef.current?.scrollTo({ x: nextIndex * CARD_WIDTH, animated: true });
      setCurrentIndex(nextIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentIndex, articles.length]);

  if (!articles.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.headerText}>
          {STRINGS.BREAKING_NEWS_TA} / {STRINGS.BREAKING_NEWS_EN}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
          setCurrentIndex(index);
        }}
      >
        {articles.map((article) => {
          const title = language === 'ta' ? article.titleTa : article.titleEn;
          return (
            <TouchableOpacity
              key={article.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push(`/article/${article.id}`)}
            >
              {article.thumbnailUrl && (
                <Image
                  source={{ uri: article.thumbnailUrl }}
                  style={styles.image}
                  contentFit="cover"
                />
              )}
              <View style={styles.overlay}>
                <View style={styles.breakingBadge}>
                  <Text style={styles.breakingText}>BREAKING</Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>
                  {title}
                </Text>
                <Text style={styles.time}>{timeAgo(article.publishedAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {articles.length > 1 && (
        <View style={styles.dotsRow}>
          {articles.map((_, i) => (
            <View
              key={i}
              style={[styles.indicatorDot, i === currentIndex && styles.activeDot]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  headerText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  card: {
    width: CARD_WIDTH,
    height: 200,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
    padding: 14,
    justifyContent: 'flex-end',
  },
  breakingBadge: {
    backgroundColor: COLORS.accent,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  breakingText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  time: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  activeDot: {
    backgroundColor: COLORS.accent,
    width: 18,
  },
});
