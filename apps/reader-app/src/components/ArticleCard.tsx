// src/components/ArticleCard.tsx
// The list-row card used by Search, Archive, Bookmarks, Profile, and
// Reporter Profile — restyled to match the Home feed's minimal, edge-to-
// edge look (no rounded corners/shadow/margins, no meta line, no reporter
// byline, no like/share/save action row) instead of the old boxed-card-
// with-shadow style. Just image, category/breaking badges, and headline —
// tapping opens the full story. Rows are separated by a hairline border,
// stacked directly against the screen edges like the feed's own cards.
//
// The previous version had separate Hero/Standard variants selected via an
// `index` prop, but no caller ever actually passed index={0} — every screen
// just renders a plain list of these — so that split is gone; there's one
// consistent row style now.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { CAT_COLORS } from '@/theme';
import { FONT_FAMILIES } from '@/constants';
import type { Article, Language } from '@/types';
import ImageWatermark from '@/components/feed/ImageWatermark';
import Icon from '@/components/icons/Icon';
import { isVideoUrl, posterOrImage } from '@/lib/media';

interface ArticleCardProps {
  article: Article;
  onPress: (article: Article) => void;
  language: Language;
}

function getCatColor(slug: string) {
  return CAT_COLORS[slug] ?? CAT_COLORS.default;
}

export default function ArticleCard({ article, onPress, language }: ArticleCardProps) {
  const t = useTheme();
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const catName = language === 'ta' ? article.category.nameTa : article.category.nameEn;
  const catColor = getCatColor(article.category.slug);

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: t.surface, borderBottomColor: t.border }]}
      onPress={() => onPress(article)}
      activeOpacity={0.9}
    >
      {article.thumbnailUrl ? (
        <View style={styles.imgWrap}>
          <Image source={{ uri: posterOrImage(article.thumbnailUrl) }} style={styles.img} contentFit="cover" transition={250} />
          {isVideoUrl(article.thumbnailUrl) && (
            <View style={styles.playBadge}>
              <Icon name="play" size={11} color="#fff" />
            </View>
          )}
          <ImageWatermark size="xs" />
        </View>
      ) : (
        <View style={[styles.img, { backgroundColor: t.bgAlt }]} />
      )}

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.catChip, { backgroundColor: catColor + '15' }]}>
            <Text style={[styles.catText, { color: catColor }]}>{catName.toUpperCase()}</Text>
          </View>
          {article.isBreaking && (
            <View style={[styles.breakingChip, { backgroundColor: t.red }]}>
              <Text style={styles.breakingText}>BREAKING</Text>
            </View>
          )}
        </View>
        <Text style={[styles.title, { color: t.ink }]} numberOfLines={3}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  imgWrap: { width: 110, height: 88, position: 'relative' },
  img: { width: 110, height: 88 },
  playBadge: {
    position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1, padding: 12, gap: 7, justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  catText: { fontSize: 9.5, fontFamily: FONT_FAMILIES.uiBold, letterSpacing: 0.7 },
  breakingChip: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 20 },
  breakingText: { color: '#fff', fontSize: 8.5, fontFamily: FONT_FAMILIES.uiBold, letterSpacing: 0.7 },
  title: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 14.5, lineHeight: 20, letterSpacing: -0.1 },
});
