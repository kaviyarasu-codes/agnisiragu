// src/components/ArticleCard.tsx
// Restyled onto theme tokens + FONT_FAMILIES; hero/standard card split,
// like/share/bookmark action row, and bookmarks-store wiring are unchanged
// from the original. Still used by the general list screens (Archive,
// Search, Bookmarks, Profile) — the swipe-card Home feed uses its own
// FeedCard component instead.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { Image } from 'expo-image';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { useTheme } from '@/hooks/useTheme';
import { CAT_COLORS } from '@/theme';
import { FONT_FAMILIES } from '@/constants';
import Icon from '@/components/icons/Icon';
import type { Article, Language } from '@/types';

interface ArticleCardProps {
  article: Article;
  onPress: (article: Article) => void;
  language: Language;
  index?: number;
}

function timeAgo(dateString: string): string {
  const m = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (m < 1) return 'இப்போது';
  if (m < 60) return `${m} நிமிடம் முன்`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} மணி முன்`;
  return `${Math.floor(h / 24)} நாள் முன்`;
}

function getCatColor(slug: string) {
  return CAT_COLORS[slug] ?? CAT_COLORS.default;
}

// ── ACTION ROW ──────────────────────────────────────────────────────────────
function ActionRow({ article, language }: { article: Article; language: Language }) {
  const t = useTheme();
  const { isBookmarked, toggleBookmark } = useBookmarksStore();
  const saved = isBookmarked(article.id);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 120 + 10));
  const [liked, setLiked] = useState(false);

  function handleLike() {
    setLiked((p) => !p);
    setLikes((p) => (liked ? p - 1 : p + 1));
  }

  async function handleShare() {
    const title = language === 'ta' ? article.titleTa : article.titleEn;
    await Share.share({ title, message: `${title}\nhttps://agnisiragu.com/article/${article.id}` });
  }

  return (
    <View style={[ar.row, { borderTopColor: t.border }]}>
      <TouchableOpacity style={ar.btn} onPress={handleLike}>
        <Icon name="like" size={14} color={liked ? t.red : t.inkMuted} />
        <Text style={[ar.label, { color: liked ? t.red : t.inkMuted }]}>{likes}</Text>
      </TouchableOpacity>
      <View style={[ar.divider, { backgroundColor: t.border }]} />
      <TouchableOpacity style={ar.btn} onPress={handleShare}>
        <Icon name="share" size={14} color={t.inkMuted} />
        <Text style={[ar.label, { color: t.inkMuted }]}>{language === 'ta' ? 'பகிர்' : 'Share'}</Text>
      </TouchableOpacity>
      <View style={[ar.divider, { backgroundColor: t.border }]} />
      <TouchableOpacity style={ar.btn} onPress={() => toggleBookmark(article)}>
        <Icon name="bookmarkNav" size={14} color={saved ? t.red : t.inkMuted} />
        <Text style={[ar.label, { color: saved ? t.red : t.inkMuted }]}>
          {language === 'ta' ? (saved ? 'சேமிக்கப்பட்டது' : 'சேமி') : (saved ? 'Saved' : 'Save')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── HERO CARD (index 0) — tall, prominent ────────────────────────────────────
function HeroCard({ article, onPress, language }: ArticleCardProps) {
  const t = useTheme();
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const catName = language === 'ta' ? article.category.nameTa : article.category.nameEn;
  const catColor = getCatColor(article.category.slug);

  return (
    <TouchableOpacity style={[hero.card, { backgroundColor: t.card }]} onPress={() => onPress(article)} activeOpacity={0.95}>
      <View style={hero.imgWrap}>
        {article.thumbnailUrl
          ? <Image source={{ uri: article.thumbnailUrl }} style={hero.img} contentFit="cover" transition={300} />
          : <View style={[hero.img, { backgroundColor: t.bgAlt }]} />}
        <View style={hero.scrim} />
        {article.isBreaking && (
          <View style={[hero.liveBadge, { backgroundColor: t.red }]}>
            <View style={hero.liveDot} />
            <Text style={hero.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      <View style={hero.body}>
        <View style={[hero.catChip, { backgroundColor: catColor + '18' }]}>
          <Text style={[hero.catText, { color: catColor }]}>{catName.toUpperCase()}</Text>
        </View>
        <Text style={[hero.title, { color: t.ink }]} numberOfLines={3}>{title}</Text>
        <Text style={[hero.time, { color: t.inkMuted }]}>
          அக்னிசிறகு • {timeAgo(article.publishedAt)}
        </Text>
      </View>

      <ActionRow article={article} language={language} />
    </TouchableOpacity>
  );
}

// ── STANDARD CARD (index 1+) ─────────────────────────────────────────────────
function StandardCard({ article, onPress, language, index = 1 }: ArticleCardProps) {
  const t = useTheme();
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const catName = language === 'ta' ? article.category.nameTa : article.category.nameEn;
  const catColor = getCatColor(article.category.slug);
  const isSmall = index >= 10;

  return (
    <TouchableOpacity style={[sc.card, { backgroundColor: t.card }]} onPress={() => onPress(article)} activeOpacity={0.95}>
      {article.thumbnailUrl ? (
        <Image
          source={{ uri: article.thumbnailUrl }}
          style={[sc.img, isSmall && sc.imgSmall]}
          contentFit="cover"
          transition={250}
        />
      ) : (
        <View style={[sc.img, isSmall && sc.imgSmall, { backgroundColor: t.bgAlt }]} />
      )}

      <View style={sc.body}>
        <View style={sc.topRow}>
          <View style={[sc.catChip, { backgroundColor: catColor + '15' }]}>
            <Text style={[sc.catText, { color: catColor }]}>{catName.toUpperCase()}</Text>
          </View>
          {article.isBreaking && (
            <View style={[sc.breakingChip, { backgroundColor: t.red }]}>
              <Text style={sc.breakingText}>BREAKING</Text>
            </View>
          )}
        </View>
        <Text style={[sc.title, { color: t.ink }, isSmall && sc.titleSmall]} numberOfLines={isSmall ? 2 : 3}>
          {title}
        </Text>
        <Text style={[sc.meta, { color: t.inkMuted }]}>
          அக்னிசிறகு • {timeAgo(article.publishedAt)}
        </Text>
      </View>

      <ActionRow article={article} language={language} />
    </TouchableOpacity>
  );
}

// ── EXPORT ───────────────────────────────────────────────────────────────────
export default function ArticleCard({ article, onPress, language, index = 1 }: ArticleCardProps) {
  if (index === 0) return <HeroCard article={article} onPress={onPress} language={language} index={index} />;
  return <StandardCard article={article} onPress={onPress} language={language} index={index} />;
}

// ── STYLES ───────────────────────────────────────────────────────────────────

const hero = StyleSheet.create({
  card: {
    marginHorizontal: 12, marginTop: 12, marginBottom: 4,
    borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  imgWrap: { width: '100%', height: 240, position: 'relative' },
  img: { width: '100%', height: '100%' },
  scrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(0,0,0,0.15)' },
  liveBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 10, fontFamily: FONT_FAMILIES.uiBold, letterSpacing: 1 },
  body: { padding: 14, paddingBottom: 10 },
  catChip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  catText: { fontSize: 10, fontFamily: FONT_FAMILIES.uiBold, letterSpacing: 1 },
  title: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 20, lineHeight: 28, marginBottom: 8, letterSpacing: -0.3 },
  time: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12 },
});

const sc = StyleSheet.create({
  card: {
    marginHorizontal: 12, marginVertical: 5,
    borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  img: { width: '100%', height: 200 },
  imgSmall: { height: 160 },
  body: { padding: 12, paddingBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  catChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catText: { fontSize: 10, fontFamily: FONT_FAMILIES.uiBold, letterSpacing: 0.8 },
  breakingChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  breakingText: { color: '#fff', fontSize: 9, fontFamily: FONT_FAMILIES.uiBold, letterSpacing: 0.8 },
  title: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, lineHeight: 23, marginBottom: 7, letterSpacing: -0.2 },
  titleSmall: { fontSize: 14, lineHeight: 20 },
  meta: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12 },
});

const ar = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6 },
  divider: { width: StyleSheet.hairlineWidth, height: 20 },
  label: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 12 },
});
