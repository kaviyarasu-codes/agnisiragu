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
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'இப்போது / Just now';
  if (diffMins < 60) return `${diffMins} நிமிடம் / ${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} மணி / ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} நாள் / ${diffDays}d ago`;
}

const CATEGORY_COLORS: Record<string, string> = {
  politics: '#3B82F6',
  sports: '#10B981',
  entertainment: '#8B5CF6',
  business: '#F59E0B',
  technology: '#06B6D4',
  health: '#EF4444',
};

export default function ArticleCard({ article, onPress, language }: ArticleCardProps) {
  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const categoryName = language === 'ta' ? article.category.nameTa : article.category.nameEn;
  const categoryColor = CATEGORY_COLORS[article.category.slug] ?? COLORS.primary;

  const { isBookmarked, toggleBookmark } = useBookmarksStore();
  const saved = isBookmarked(article.id);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(article)} activeOpacity={0.85}>
      {article.thumbnailUrl ? (
        <Image
          source={{ uri: article.thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumb]} />
      )}

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{categoryName}</Text>
          </View>
          {article.isBreaking && (
            <View style={styles.breakingBadge}>
              <Text style={styles.breakingText}>BREAKING</Text>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={3}>
          {title}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.time}>{timeAgo(article.publishedAt)}</Text>
          <TouchableOpacity
            onPress={() => toggleBookmark(article)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.bookmarkBtn}
          >
            <Text style={[styles.bookmarkIcon, saved && styles.bookmarkIconSaved]}>
              {saved ? '🔖' : '🏷️'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 110,
    height: 110,
  },
  placeholderThumb: {
    backgroundColor: COLORS.border,
  },
  content: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  breakingBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  breakingText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  time: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  bookmarkBtn: {
    padding: 2,
  },
  bookmarkIcon: {
    fontSize: 14,
    opacity: 0.4,
  },
  bookmarkIconSaved: {
    opacity: 1,
  },
});
