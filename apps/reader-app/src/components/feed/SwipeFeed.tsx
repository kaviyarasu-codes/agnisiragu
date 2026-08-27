// src/components/feed/SwipeFeed.tsx
// The Home experience: a horizontally swipeable, one-card-at-a-time deck
// (design 1a step 03 "Feed"), with a compact action bar (like+count/
// dislike+count/comment+count, then WhatsApp/more/share icons), a rate
// ticker, and the persistent bottom nav (Archive/Jobs/Post/Lives/Saved)
// below it.
//
// Card selection: most articles render as the standard ArticleFeedCard.
// See resolveCardStyle() below — an admin's explicit Card Style choice
// (Article.cardStyle, set via checkboxes in the admin panel) always wins;
// otherwise these legacy automatic rules apply:
//   - isBreaking articles      -> BreakingNewsCard (1b, full-bleed photo)
//   - Cinema/Entertainment cat -> CinemaFeedCard (1e, peeking-deck)
//   - sponsored/local-ad slots -> SponsoredFeedCard (1c, newsprint order)
// An admin can also force any article into 1b (BreakingNewsCard) or 1c
// (NewsprintArticleCard) regardless of isBreaking/category.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, FlatList, Animated, Dimensions, NativeSyntheticEvent, NativeScrollEvent, StyleSheet, Linking, Share,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useArticles } from '@/hooks/useArticles';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { useReactionsStore } from '@/store/reactions.store';
import { FREE_ARTICLE_LIMIT, STORAGE_KEYS } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { ArticleFeedCard, AdFeedCard } from './FeedCard';
import BreakingNewsCard from './BreakingNewsCard';
import CinemaFeedCard from './CinemaFeedCard';
import NewsprintArticleCard from './NewsprintArticleCard';
import ActionBar from './ActionBar';
import BottomNav from './BottomNav';
import SwipeHintOverlay from './SwipeHintOverlay';
import RateTicker from '@/components/ui/RateTicker';
import { FeedSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import LoginGateModal from '@/components/LoginGateModal';
import MoreActionsSheet from '@/components/sheets/MoreActionsSheet';
import ShareSheet from '@/components/sheets/ShareSheet';
import type { Article } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE_PAD = 12;
const CARD_W = SCREEN_W - SIDE_PAD * 2;
const SNAP = CARD_W + SIDE_PAD * 2;

const CINEMA_SLUGS = new Set(['cinema', 'entertainment']);

// Admin's explicit Card Style choice (Article.cardStyle) always wins. When
// left at the default ("STANDARD" = no explicit choice made), fall back to
// the legacy automatic rules so every already-published article keeps
// rendering exactly as it did before this admin control existed.
type ResolvedCardStyle = 'FULL_BLEED' | 'NEWSPRINT' | 'CINEMA' | 'STANDARD';
function resolveCardStyle(article: Article): ResolvedCardStyle {
  if (article.cardStyle === 'FULL_BLEED') return 'FULL_BLEED';
  if (article.cardStyle === 'NEWSPRINT') return 'NEWSPRINT';
  if (article.isBreaking) return 'FULL_BLEED';
  if (CINEMA_SLUGS.has(article.category?.slug)) return 'CINEMA';
  return 'STANDARD';
}

type ListItem =
  | { type: 'article'; key: string; article: Article; articleIndex: number }
  | { type: 'ad'; key: string; articleIndex: number };

interface SwipeFeedProps {
  categoryId?: string;
}

export default function SwipeFeed({ categoryId }: SwipeFeedProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { language, remoteConfig } = useAppStore();
  const { isAuthenticated, articleReadCount } = useAuthStore();

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
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [moreArticle, setMoreArticle] = useState<Article | null>(null);
  const [shareArticle, setShareArticle] = useState<Article | null>(null);
  const listRef = useRef<FlatList<ListItem>>(null);

  // Drives the book-page-flip swipe transition (see withPageFlip below) and
  // the one-time new-user swipe hint (SwipeHintOverlay). scrollX is native-
  // driven so the rotateY/translateX card transform stays smooth at 60fps.
  const scrollX = useRef(new Animated.Value(0)).current;
  const onScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true }),
    [scrollX],
  );
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEYS.SWIPE_HINT_SHOWN)
      .then((val) => { if (!val) setShowSwipeHint(true); })
      .catch(() => {});
  }, []);

  const dismissSwipeHint = useCallback(() => {
    setShowSwipeHint(false);
    SecureStore.setItemAsync(STORAGE_KEYS.SWIPE_HINT_SHOWN, '1').catch(() => {});
  }, []);

  // Per-device reaction state (AsyncStorage-backed, no login required) plus
  // an in-memory delta applied on top of the server-fetched likeCount/
  // dislikeCount so the tap feels instant without waiting on a refetch.
  const { hydrate: hydrateReactions, getReaction, react } = useReactionsStore();
  const [countDeltas, setCountDeltas] = useState<Record<string, { like: number; dislike: number }>>({});

  useEffect(() => { hydrateReactions(); }, [hydrateReactions]);

  const activeItem = listData[activeIndex];
  const activeArticle = activeItem?.type === 'article' ? activeItem.article : null;

  const activeReaction = activeArticle ? getReaction(activeArticle.id) : undefined;
  const activeDelta = (activeArticle && countDeltas[activeArticle.id]) || { like: 0, dislike: 0 };
  const displayLikeCount = Math.max(0, (activeArticle?.likeCount ?? 0) + activeDelta.like);
  const displayDislikeCount = Math.max(0, (activeArticle?.dislikeCount ?? 0) + activeDelta.dislike);
  const displayCommentCount = activeArticle?.commentCount ?? 0;

  const onMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP);
    setActiveIndex((prev) => {
      const next = Math.max(0, Math.min(idx, listData.length - 1));
      if (next !== prev) dismissSwipeHint(); // the user just discovered the gesture themselves
      return next;
    });
  }, [listData.length, dismissSwipeHint]);

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

  const applyReaction = useCallback(async (type: 'LIKE' | 'DISLIKE') => {
    if (!activeArticle) return;
    const id = activeArticle.id;
    const { likeDelta, dislikeDelta } = await react(id, type);
    setCountDeltas((prev) => {
      const current = prev[id] ?? { like: 0, dislike: 0 };
      return {
        ...prev,
        [id]: { like: current.like + likeDelta, dislike: current.dislike + dislikeDelta },
      };
    });
  }, [activeArticle, react]);

  const toggleLike = useCallback(() => applyReaction('LIKE'), [applyReaction]);
  const toggleDislike = useCallback(() => applyReaction('DISLIKE'), [applyReaction]);

  const handleComment = useCallback(() => {
    if (activeArticle) router.push(`/article/${activeArticle.id}?focus=comments`);
  }, [activeArticle]);

  const handleShare = useCallback(async () => {
    if (activeArticle) setShareArticle(activeArticle);
  }, [activeArticle]);

  const handleWhatsapp = useCallback(async () => {
    if (!activeArticle) return;
    const title = language === 'ta' ? activeArticle.titleTa : activeArticle.titleEn;
    const url = `https://agnisiragu.com/a/${activeArticle.id}`;
    const text = `${title}\n${url}`;
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    try {
      const canOpen = await Linking.canOpenURL(waUrl);
      if (canOpen) {
        await Linking.openURL(waUrl);
        return;
      }
    } catch {
      // fall through to generic share below
    }
    Share.share({ message: text }).catch(() => {});
  }, [activeArticle, language]);

  const handleMore = useCallback(() => {
    if (activeArticle) setMoreArticle(activeArticle);
  }, [activeArticle]);

  // Book-page-flip transition (item #3 of the redesign brief): as a card
  // scrolls away from center it rotates around its vertical axis and
  // slides slightly, like a page turning, instead of a flat slide — applied
  // to every card in the feed, ad slots included, so the whole deck reads
  // as one flip-book.
  const withPageFlip = useCallback((node: React.ReactNode, index: number) => {
    const inputRange = [(index - 1) * SNAP, index * SNAP, (index + 1) * SNAP];
    const rotateY = scrollX.interpolate({
      inputRange, outputRange: ['55deg', '0deg', '-55deg'], extrapolate: 'clamp',
    });
    const translateX = scrollX.interpolate({
      inputRange, outputRange: [-CARD_W * 0.22, 0, CARD_W * 0.22], extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange, outputRange: [0.55, 1, 0.55], extrapolate: 'clamp',
    });
    return (
      <Animated.View style={{ opacity, transform: [{ perspective: 900 }, { translateX }, { rotateY }] }}>
        {node}
      </Animated.View>
    );
  }, [scrollX]);

  const renderItem = useCallback(({ item, index }: { item: ListItem; index: number }) => {
    if (item.type === 'ad') return withPageFlip(<AdFeedCard width={CARD_W} />, index);

    const { article } = item;
    const style = resolveCardStyle(article);

    if (style === 'FULL_BLEED') {
      return withPageFlip(
        <BreakingNewsCard
          article={article}
          language={language}
          width={CARD_W}
          onOpen={() => openArticle(article)}
        />,
        index,
      );
    }
    if (style === 'NEWSPRINT') {
      return withPageFlip(
        <NewsprintArticleCard
          article={article}
          language={language}
          width={CARD_W}
          onOpen={() => openArticle(article)}
        />,
        index,
      );
    }
    if (style === 'CINEMA') {
      return withPageFlip(
        <CinemaFeedCard
          article={article}
          language={language}
          width={CARD_W}
          onOpen={() => openArticle(article)}
        />,
        index,
      );
    }
    return withPageFlip(
      <ArticleFeedCard
        article={article}
        language={language}
        index={item.articleIndex}
        total={articles.length}
        width={CARD_W}
        onOpen={() => openArticle(article)}
      />,
      index,
    );
  }, [language, articles.length, openArticle, withPageFlip]);

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
    <View style={[styles.col, { backgroundColor: t.bg }]}>
      <View style={styles.feedArea}>
        <Animated.FlatList
          ref={listRef}
          data={listData}
          horizontal
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumEnd}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => <View style={{ width: SIDE_PAD * 2 }} />}
          contentContainerStyle={{ paddingHorizontal: SIDE_PAD }}
          style={{ flex: 1 }}
          getItemLayout={(_, index) => ({ length: SNAP, offset: SNAP * index, index })}
          renderToHardwareTextureAndroid
        />
        <SwipeHintOverlay visible={showSwipeHint} language={language} onDismiss={dismissSwipeHint} />
      </View>

      <ActionBar
        liked={activeReaction === 'LIKE'}
        disliked={activeReaction === 'DISLIKE'}
        likeCount={displayLikeCount}
        dislikeCount={displayDislikeCount}
        commentCount={displayCommentCount}
        onLike={toggleLike}
        onDislike={toggleDislike}
        onComment={handleComment}
        onWhatsapp={handleWhatsapp}
        onShare={handleShare}
        onMore={handleMore}
      />
      {remoteConfig.rateTickerEnabled && (
        <RateTicker
          sponsorName={remoteConfig.rateTickerSponsorName}
          goldRate={remoteConfig.rateTickerGoldRate}
          silverRate={remoteConfig.rateTickerSilverRate}
        />
      )}
      <BottomNav />
      <View style={{ height: insets.bottom, backgroundColor: t.surface }} />

      <LoginGateModal visible={showLoginGate} onDismiss={() => setShowLoginGate(false)} />
      <MoreActionsSheet visible={!!moreArticle} onDismiss={() => setMoreArticle(null)} article={moreArticle} />
      <ShareSheet visible={!!shareArticle} onDismiss={() => setShareArticle(null)} article={shareArticle} language={language} />
    </View>
  );
}

const styles = StyleSheet.create({
  col: { flex: 1 },
  feedArea: { flex: 1, paddingVertical: 10 },
});
