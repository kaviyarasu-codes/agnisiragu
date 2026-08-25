// src/components/feed/SwipeFeed.tsx
// The Home experience: a horizontally swipeable card deck (design 1a),
// with the actions moved to a persistent edge rail (1d) and the next card
// peeking at the trailing edge so the swipe gesture reads as discoverable
// (1e). Tapping a card opens the full article (ArticleDetailScreen); the
// free-article login gate and ad-in-feed frequency both carry over from
// the previous list-based HomeScreen so remote-config behavior is unchanged.

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useArticles } from '@/hooks/useArticles';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { FREE_ARTICLE_LIMIT } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { ArticleFeedCard, AdFeedCard } from './FeedCard';
import EdgeRail from './EdgeRail';
import RateTicker from '@/components/ui/RateTicker';
import { FeedSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import LoginGateModal from '@/components/LoginGateModal';
import MoreActionsSheet from '@/components/sheets/MoreActionsSheet';
import ShareSheet from '@/components/sheets/ShareSheet';
import type { Article } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const RAIL_W = 56;
const PEEK = 26;
const GAP = 10;
const CONTAINER_W = SCREEN_W - RAIL_W;
const CARD_W = CONTAINER_W - PEEK;
const SNAP = CARD_W + GAP;

type ListItem =
  | { type: 'article'; key: string; article: Article; articleIndex: number }
  | { type: 'ad'; key: string; articleIndex: number };

interface SwipeFeedProps {
  categoryId?: string;
}

export default function SwipeFeed({ categoryId }: SwipeFeedProps) {
  const t = useTheme();
  const { language, remoteConfig } = useAppStore();
  const { isAuthenticated, articleReadCount } = useAuthStore();
  const { isBookmarked, toggleBookmark } = useBookmarksStore();

  const freeLimit = remoteConfig.loginGate ? (remoteConfig.freeArticleLimit || FREE_ARTICLE_LIMIT) : Infinity;

  const {
    data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch,
  } = useArticles(categoryId);

  const articles = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const adFrequency = Math.max(2, remoteConfig.adInFeedFrequency || 5);

  const listData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];
    articles.forEach((article, i) => {
      items.push({ type: 'article', key: article.id, article, articleIndex: i });
      if ((i + 1) % adFrequency === 0) {
        items.push({ type: 'ad', key: `ad-${i}`, articleIndex: i });
      }
    });
    return items;
  }, [articles, adFrequency]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [moreArticle, setMoreArticle] = useState<Article | null>(null);
  const [shareArticle, setShareArticle] = useState<Article | null>(null);
  const listRef = useRef<FlatList<ListItem>>(null);

  const activeItem = listData[activeIndex];
  const activeArticle = activeItem?.type === 'article' ? activeItem.article : null;

  const onMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP);
    setActiveIndex(Math.max(0, Math.min(idx, listData.length - 1)));
  }, [listData.length]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const openArticle = useCallback((article: Article) => {
    if (!isAuthenticated && articleReadCount >= freeLimit) {
      setShowLoginGate(true);
      return;
    }
    router.push(`/article/${article.id}`);
  }, [isAuthenticated, articleReadCount, freeLimit]);

  const toggleLike = useCallback(() => {
    if (!activeArticle) return;
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(activeArticle.id)) next.delete(activeArticle.id);
      else next.add(activeArticle.id);
      return next;
    });
  }, [activeArticle]);

  const handleComment = useCallback(() => {
    if (activeArticle) router.push(`/article/${activeArticle.id}?focus=comments`);
  }, [activeArticle]);

  const handleShare = useCallback(async () => {
    if (activeArticle) setShareArticle(activeArticle);
  }, [activeArticle]);

  const handleMore = useCallback(() => {
    if (activeArticle) setMoreArticle(activeArticle);
  }, [activeArticle]);

  const renderItem = useCallback(({ item, index }: { item: ListItem; index: number }) => {
    if (item.type === 'ad') return <AdFeedCard width={CARD_W} />;
    return (
      <ArticleFeedCard
        article={item.article}
        language={language}
        index={item.articleIndex}
        total={articles.length}
        width={CARD_W}
        onOpen={() => openArticle(item.article)}
      />
    );
  }, [language, articles.length, openArticle]);

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (isError) {
    return (
      <EmptyState
        icon="offlineCircle"
        title="இணைப்பு இல்லை"
        description="உங்கள் இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்."
        ctaLabel="மீண்டும் முயற்சி"
        onCta={() => refetch()}
      />
    );
  }

  return (
    <View style={[styles.row, { backgroundColor: t.bg }]}>
      <View style={{ width: CONTAINER_W }}>
        <FlatList
          ref={listRef}
          data={listData}
          horizontal
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP}
          decelerationRate="fast"
          onMomentumScrollEnd={onMomentumEnd}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
          contentContainerStyle={{ paddingRight: PEEK }}
          style={{ flex: 1 }}
          getItemLayout={(_, index) => ({ length: SNAP, offset: SNAP * index, index })}
        />
        <RateTicker sponsorName="ஸ்ரீ லக்ஷ்மி நகைமாளிகை" />
      </View>

      <EdgeRail
        width={RAIL_W}
        liked={!!activeArticle && likedIds.has(activeArticle.id)}
        onLike={toggleLike}
        onComment={handleComment}
        onShare={handleShare}
        onMore={handleMore}
        index={activeItem?.articleIndex ?? 0}
        total={articles.length}
      />

      <LoginGateModal visible={showLoginGate} onDismiss={() => setShowLoginGate(false)} />
      <MoreActionsSheet visible={!!moreArticle} onDismiss={() => setMoreArticle(null)} article={moreArticle} />
      <ShareSheet visible={!!shareArticle} onDismiss={() => setShareArticle(null)} article={shareArticle} language={language} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row' },
});
