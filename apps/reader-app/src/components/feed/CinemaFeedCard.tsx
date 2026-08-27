// src/components/feed/CinemaFeedCard.tsx
// Design screen "1e" — Structure: a stacked-deck look where the next
// story's edge peeks out, so the swipe gesture reads as discoverable. Per
// an explicit product decision, this is NOT the default feed card — it's
// reserved for the Cinema / Entertainment category, where the "browse the
// stack" feel fits scrolling through reviews and celebrity stories.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import Icon from '@/components/icons/Icon';
import { stripHtmlToPlainText } from '@/lib/richText';
import type { Article, Language } from '@/types';

interface Props {
  article: Article;
  language: Language;
  width: number;
  onOpen: () => void;
}

const SLIVER_W = 26;

export default function CinemaFeedCard({ article, language, width, onOpen }: Props) {
  const t = useTheme();
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const rawBody = language === 'ta' ? article.bodyTa : article.bodyEn;
  const body = article.excerpt || stripHtmlToPlainText(rawBody);

  return (
    <View style={[styles.outer, { width, backgroundColor: '#E5E0D9' }]}>
      {/* Sliver hinting at the next card in the stack */}
      <View style={[styles.sliver, { backgroundColor: 'rgba(255,255,255,0.55)' }]} />

      <TouchableOpacity
        activeOpacity={0.96}
        onPress={onOpen}
        style={[styles.card, { backgroundColor: t.surface, width: width - SLIVER_W - 10 }]}
      >
        {article.thumbnailUrl ? (
          <Image source={{ uri: article.thumbnailUrl }} style={styles.image} contentFit="cover" transition={250} />
        ) : (
          <View style={[styles.image, { backgroundColor: t.bgAlt }]} />
        )}
        <View style={styles.body}>
          <Text style={[styles.cat, { color: '#6C3483' }]} numberOfLines={1}>
            {(language === 'ta' ? article.category.nameTa : article.category.nameEn)?.toUpperCase()}
          </Text>
          <Text style={[styles.title, { color: t.ink }]} numberOfLines={3}>{title}</Text>
          <Text style={[styles.excerpt, { color: t.inkSub }]} numberOfLines={3}>{body}</Text>
          <View style={{ flex: 1 }} />
          <View style={[styles.iconRow, { borderTopColor: t.border }]}>
            <Icon name="like" size={16} color={t.inkMuted} />
            <Icon name="comment" size={16} color={t.inkMuted} />
            <Icon name="share" size={16} color={t.inkMuted} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  sliver: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    right: 0,
    width: SLIVER_W,
    borderRadius: 10,
  },
  card: {
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  image: { width: '100%', height: '40%' },
  body: { flex: 1, padding: 14 },
  cat: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 11, letterSpacing: 0.5, marginBottom: 6 },
  title: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 19, lineHeight: 25, letterSpacing: -0.2 },
  excerpt: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13.5, lineHeight: 21, marginTop: 8 },
  iconRow: {
    flexDirection: 'row', gap: 18,
    borderTopWidth: 1, paddingTop: 10, marginTop: 8,
  },
});
