// src/components/feed/ActionBar.tsx
// Compact action row under the active feed card — redesigned per the
// way2news reference screenshot and the hand-drawn mockup: like+count and
// dislike+count and comment+count grouped on the left, then a dedicated
// WhatsApp icon, a three-dot overflow menu, and a forward/share icon on the
// right. Replaces the earlier 4-equal-cells bordered bar.
//
// Like/dislike counts come from Article.likeCount/dislikeCount (real
// Prisma columns — see schema.prisma), bumped optimistically here and
// reconciled server-side via PATCH /news/:id/react. Comment count reflects
// Article.commentCount, which currently stays at 0 for every article: the
// article detail screen's comment box is still local/UI-only (no
// /articles/:id/comments endpoint yet) — see ArticleDetailScreen.tsx's own
// header note. Wiring a real comments backend is a separate follow-up.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import Icon from '@/components/icons/Icon';

export interface ActionBarProps {
  liked: boolean;
  disliked: boolean;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  onLike: () => void;
  onDislike: () => void;
  onComment: () => void;
  onWhatsapp: () => void;
  onShare: () => void;
  onMore: () => void;
}

function formatCount(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function ActionBar({
  liked, disliked, likeCount, dislikeCount, commentCount,
  onLike, onDislike, onComment, onWhatsapp, onShare, onMore,
}: ActionBarProps) {
  const t = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: t.surface, borderTopColor: t.border }]}>
      <View style={styles.group}>
        <TouchableOpacity style={styles.item} onPress={onLike} hitSlop={8}>
          <Icon name="thumbUp" size={16} color={liked ? t.red : t.inkSub} active={liked} />
          <Text style={[styles.count, { color: liked ? t.red : t.inkMuted }]}>{formatCount(likeCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={onDislike} hitSlop={8}>
          <Icon name="thumbDown" size={16} color={disliked ? t.red : t.inkSub} active={disliked} />
          <Text style={[styles.count, { color: disliked ? t.red : t.inkMuted }]}>{formatCount(dislikeCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={onComment} hitSlop={8}>
          <Icon name="comment" size={16} color={t.inkSub} />
          <Text style={[styles.count, { color: t.inkMuted }]}>{formatCount(commentCount)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.group}>
        <TouchableOpacity style={styles.iconOnly} onPress={onWhatsapp} hitSlop={8}>
          <Icon name="whatsapp" size={18} color={t.inkSub} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconOnly} onPress={onMore} hitSlop={8}>
          <Icon name="more" size={16} color={t.inkSub} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconOnly} onPress={onShare} hitSlop={8}>
          <Icon name="forward" size={17} color={t.inkSub} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingHorizontal: 12,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  count: {
    fontFamily: FONT_FAMILIES.uiSemiBold,
    fontSize: 11,
  },
  iconOnly: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
