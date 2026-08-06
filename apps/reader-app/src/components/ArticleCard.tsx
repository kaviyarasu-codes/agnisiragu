// src/components/ArticleCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '@/constants';
import { useBookmarksStore } from '@/store/bookmarks.store';
import type { Article, Language } from '@/types';

interface ArticleCardProps {
  article: Article;
  onPress: (article: Article) => void;
  language: Language;
  index?: number; // 0=hero, 1-9=feature, 10+=compact
}

function timeAgo(dateString: string): string {
  const diffMins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (diffMins < 1) return 'இப்போது';
  if (diffMins < 60) return `${diffMins}m`;
  const h = Math.floor(diffMins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function getCatColor(slug: string): string {
  const map: Record<string, string> = {
    politics: '#2563EB', sports: '#16A34A', entertainment: '#7C3AED',
    business: '#D97706', technology: '#0891B2', health: '#DC2626',
  };
  return map[slug] ?? COLORS.primary;
}

// ── HERO (index 0) ────────────────────────────────────────────────────
function HeroCard({ article, onPress, language }: Omit<ArticleCardProps, 'index'>) {
  const { isBookmarked, toggleBookmark } = useBookmarksStore();
  const saved = isBookmarked(article.id);
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const catName = language === 'ta' ? article.category.nameTa : article.category.nameEn;
  const catColor = getCatColor(article.category.slug);
  return (
    <TouchableOpacity style={H.card} onPress={() => onPress(article)} activeOpacity={0.92}>
      <View style={H.imageWrap}>
        {article.thumbnailUrl
          ? <Image source={{ uri: article.thumbnailUrl }} style={H.image} contentFit="cover" transition={300} />
          : <View style={[H.image, { backgroundColor: COLORS.surfaceWarm }]} />}
        <View style={[H.catPill, { backgroundColor: catColor }]}>
          <Text style={H.catPillText}>{catName.toUpperCase()}</Text>
        </View>
        {article.isBreaking && (
          <View style={H.livePill}>
            <View style={H.liveDot} /><Text style={H.liveText}>LIVE</Text>
          </View>
        )}
      </View>
      <View style={H.content}>
        <Text style={H.title} numberOfLines={3}>{title}</Text>
        <View style={H.meta}>
          <Text style={H.time}>{timeAgo(article.publishedAt)}</Text>
          <TouchableOpacity onPress={() => toggleBookmark(article)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[H.bm, saved && H.bmSaved]}>{saved ? '🔖' : '🏷️'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── FEATURE (index 1–9) ───────────────────────────────────────────────
function FeatureCard({ article, onPress, language }: ArticleCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarksStore();
  const saved = isBookmarked(article.id);
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const catName = language === 'ta' ? article.category.nameTa : article.category.nameEn;
  const catColor = getCatColor(article.category.slug);
  return (
    <TouchableOpacity style={F.card} onPress={() => onPress(article)} activeOpacity={0.88}>
      <View style={[F.strip, { backgroundColor: catColor }]} />
      <View style={F.body}>
        <View style={F.topRow}>
          <Text style={[F.cat, { color: catColor }]}>{catName.toUpperCase()}</Text>
          <Text style={F.time}>{timeAgo(article.publishedAt)}</Text>
        </View>
        <Text style={F.title} numberOfLines={2}>{title}</Text>
        <TouchableOpacity onPress={() => toggleBookmark(article)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ alignSelf: 'flex-start', marginTop: 6 }}>
          <Text style={[F.bm, saved && F.bmSaved]}>{saved ? '🔖' : '🏷️'}</Text>
        </TouchableOpacity>
      </View>
      {article.thumbnailUrl
        ? <Image source={{ uri: article.thumbnailUrl }} style={F.thumb} contentFit="cover" transition={200} />
        : <View style={[F.thumb, { backgroundColor: COLORS.surfaceWarm }]} />}
    </TouchableOpacity>
  );
}

// ── COMPACT (index 10+) ───────────────────────────────────────────────
function CompactCard({ article, onPress, language }: Omit<ArticleCardProps, 'index'>) {
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const catColor = getCatColor(article.category.slug);
  return (
    <TouchableOpacity style={C.card} onPress={() => onPress(article)} activeOpacity={0.85}>
      <View style={[C.dot, { backgroundColor: catColor }]} />
      <Text style={C.title} numberOfLines={2}>{title}</Text>
      <Text style={C.time}>{timeAgo(article.publishedAt)}</Text>
    </TouchableOpacity>
  );
}

// ── EXPORT ────────────────────────────────────────────────────────────
export default function ArticleCard({ article, onPress, language, index = 1 }: ArticleCardProps) {
  if (index === 0) return <HeroCard article={article} onPress={onPress} language={language} />;
  if (index >= 10) return <CompactCard article={article} onPress={onPress} language={language} />;
  return <FeatureCard article={article} onPress={onPress} language={language} index={index} />;
}

// ── STYLE BLOCKS ──────────────────────────────────────────────────────

const H = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface, marginHorizontal: 14, marginTop: 14,
    marginBottom: 2, borderRadius: 3, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09, shadowRadius: 8, elevation: 3,
  },
  imageWrap: { height: 220, position: 'relative' },
  image: { width: '100%', height: '100%' },
  catPill: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 2,
  },
  catPillText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  livePill: {
    position: 'absolute', top: 12, right: 12, flexDirection: 'row',
    alignItems: 'center', backgroundColor: COLORS.primary,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2, gap: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  content: { padding: 14, paddingTop: 13 },
  title: {
    fontSize: 20, fontWeight: '800', color: COLORS.ink,
    lineHeight: 28, marginBottom: 10, letterSpacing: -0.4,
  },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontSize: 12, color: COLORS.inkLight, fontWeight: '500' },
  bm: { fontSize: 17, opacity: 0.3 },
  bmSaved: { opacity: 1 },
});

const F = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    marginHorizontal: 14, marginVertical: 1,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  strip: { width: 4, alignSelf: 'stretch' },
  body: { flex: 1, paddingVertical: 12, paddingLeft: 11, paddingRight: 8, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  cat: { fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  time: { fontSize: 11, color: COLORS.inkLight },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.ink, lineHeight: 20, flex: 1 },
  bm: { fontSize: 14, opacity: 0.3 },
  bmSaved: { opacity: 1 },
  thumb: { width: 90, height: 90, alignSelf: 'center', marginRight: 12, marginVertical: 10, borderRadius: 2 },
});

const C = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    marginHorizontal: 14, paddingVertical: 11, paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border, gap: 10,
  },
  dot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  title: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.inkSecondary, lineHeight: 18 },
  time: { fontSize: 11, color: COLORS.inkLight, flexShrink: 0 },
});
