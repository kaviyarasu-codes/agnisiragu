// src/components/feed/SwipeFeed.tsx
// The Home experience: a full-bleed, horizontal one-story-at-a-time feed
// (design 1a step 03 "Feed") — swipe left/right to move between stories,
// like turning a page in a book, edge-to-edge with no gaps (Way2News-style
// full-bleed cards). A separate swipe-DOWN gesture (pull-to-refresh style)
// reloads the feed for new news — see the PanResponder wiring below. That
// gesture is only armed over the fixed image region of the card (the top
// FEED_IMAGE_HEIGHT_FRACTION of the screen — see FeedCard.tsx), since each
// card's article text now scrolls in its own ScrollView underneath the
// image; scoping the refresh gesture to just the non-scrolling image area
// keeps it from fighting that ScrollView for vertical drags, and a
// horizontal drag anywhere still passes straight through to the FlatList's
// own paging. A rate ticker and the persistent bottom nav (Archive/Jobs/
// Post/Lives/Saved) sit below the feed.
//
// Page-turn transition: each card rotates around its left/right edge
// (rotateY, anchored via the standard translate/rotate/translate-back
// trick) as it scrolls past center, with a shadow overlay that darkens
// toward the fold — a hand-rolled Animated-only effect (no extra native
// dependency; an earlier attempt used the react-native-page-flipper
// library but it carried an unresolved Reanimated version mismatch and was
// reverted). A vertical variant of this same transform briefly replaced
// this one for a vertical-swipe experiment; reverted back to horizontal
// per an explicit request for the book-page-turn feel specifically.
//
// Each card renders its own ActionBar (like+count/dislike+count/comment+
// count, then WhatsApp/more/share icons) INSIDE the card itself, so the
// action row turns/flips together with the card — see buildActionBarProps
// below, which computes one card's reaction state on demand instead of
// assuming a single shared "active" card.
//
// Card selection: every article renders as the single standard
// ArticleFeedCard now — per an explicit product decision, the feed no
// longer varies its layout per article (no more automatic Full-bleed for
// breaking news, the Cinema peeking-deck for that category, or an admin's
// old explicit cardStyle choice). resolveCardStyle() below always returns
// 'STANDARD'. The old BreakingNewsCard/CinemaFeedCard/NewsprintArticleCard
// components and the Article.cardStyle field stay in the codebase in case
// they're reused elsewhere later — e.g. a category banner or a breaking-
// news takeover screen — just no longer wired into the main feed.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, FlatList, Animated, Dimensions, NativeSyntheticEvent, NativeScrollEvent, StyleSheet, Linking, Share, PanResponder, Text,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useArticles } from '@/hooks/useArticles';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { useReactionsStore } from '@/store/reactions.store';
import { FREE_ARTICLE_LIMIT, STORAGE_KEYS, FONT_FAMILIES } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { ArticleFeedCard, AdFeedCard, FEED_IMAGE_HEIGHT_FRACTION } from './FeedCard';
import BreakingNewsCard from './BreakingNewsCard';
import CinemaFeedCard from './CinemaFeedCard';
import NewsprintArticleCard from './NewsprintArticleCard';
import type { ActionBarProps } from './ActionBar';
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
const SNAP = SCREEN_W;

// Always STANDARD now — see the header comment above. The FULL_BLEED/
// NEWSPRINT/CINEMA branches below are unreachable in the feed itself but
// stay in place since ArticleFeedCard/BreakingNewsCard/etc. are still
// valid components that could power a different screen later.
type ResolvedCardStyle = 'FULL_BLEED' | 'NEWSPRINT' | 'CINEMA' | 'STANDARD';
function resolveCardStyle(_article: Article): ResolvedCardStyle {
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
    data, isLoading, isError, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage,
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

  const [showLoginGate, setShowLoginGate] = useState(false);
  const [moreArticle, setMoreArticle] = useState<Article | null>(null);
  const [shareArticle, setShareArticle] = useState<Article | null>(null);
  const listRef = useRef<FlatList<ListItem>>(null);

  // Measures the feed area's on-screen position/height so the swipe-down-
  // to-refresh gesture (below) can tell whether a drag started inside the
  // fixed image zone at the top of the current card, vs. lower down in the
  // card's own scrollable text — refs, not state, since they only feed a
  // PanResponder callback and don't need to trigger re-renders.
  const feedAreaRef = useRef<View>(null);
  const feedAreaTopRef = useRef(0);
  const feedAreaHeightRef = useRef(0);
  const measureFeedArea = useCallback(() => {
    feedAreaRef.current?.measure((_x, _y, _w, h, _pageX, pageY) => {
      feedAreaTopRef.current = pageY;
      feedAreaHeightRef.current = h;
    });
  }, []);

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

  // Tracks the centered card purely to know when the user has swiped at
  // least once (to dismiss the one-time hint) — each card owns its own
  // ActionBar/state, so this no longer needs to be React state driving a
  // render.
  const activeIndexRef = useRef(0);
  const onMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SNAP);
    const next = Math.max(0, Math.min(idx, listData.length - 1));
    if (next !== activeIndexRef.current) dismissSwipeHint(); // the user just discovered the gesture themselves
    activeIndexRef.current = next;
  }, [listData.length, dismissSwipeHint]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Swipe-DOWN-to-refresh: a pull-to-refresh-style gesture armed only over
  // the fixed image region at the top of each card (see the imageRefreshZone
  // View in the JSX below, sized to FEED_IMAGE_HEIGHT_FRACTION) — since the
  // article text scrolls in its own ScrollView now, scoping this to the
  // non-scrolling image keeps the two gestures from fighting over the same
  // vertical drag. A horizontal drag over that same zone still falls through
  // to the FlatList's own paging untouched (only dy-dominant, downward
  // movement is captured here).
  const [refreshHintOpacity] = useState(() => new Animated.Value(0));
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_evt, gesture) => {
      if (Math.abs(gesture.dy) <= 18 || Math.abs(gesture.dy) <= Math.abs(gesture.dx) * 1.5 || gesture.dy <= 0) {
        return false;
      }
      const imageZoneHeight = feedAreaHeightRef.current * FEED_IMAGE_HEIGHT_FRACTION;
      const startY = gesture.y0 - feedAreaTopRef.current;
      return startY >= 0 && startY <= imageZoneHeight;
    },
    onPanResponderMove: (_evt, gesture) => {
      const progress = Math.min(1, Math.abs(gesture.dy) / 90);
      refreshHintOpacity.setValue(progress);
    },
    onPanResponderRelease: (_evt, gesture) => {
      Animated.timing(refreshHintOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      if (gesture.dy > 70 && !isRefetching) refetch();
    },
    onPanResponderTerminate: () => {
      Animated.timing(refreshHintOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    },
  }), [refetch, isRefetching, refreshHintOpacity]);

  const openArticle = useCallback((article: Article) => {
    if (!isAuthenticated && articleReadCount >= freeLimit) {
      setShowLoginGate(true);
      return;
    }
    router.push(`/article/${article.id}`);
  }, [isAuthenticated, articleReadCount, freeLimit]);

  // These used to only act on the single "active" (centered) card, feeding
  // one ActionBar rendered outside the FlatList. Now that every card carries
  // its own ActionBar (so it swipes/flips together with the card — see
  // withPageFlip and buildActionBarProps below), each handler takes the
  // specific article it was invoked for instead of assuming "active".
  const applyReaction = useCallback(async (article: Article, type: 'LIKE' | 'DISLIKE') => {
    const id = article.id;
    const { likeDelta, dislikeDelta } = await react(id, type);
    setCountDeltas((prev) => {
      const current = prev[id] ?? { like: 0, dislike: 0 };
      return {
        ...prev,
        [id]: { like: current.like + likeDelta, dislike: current.dislike + dislikeDelta },
      };
    });
  }, [react]);

  const handleComment = useCallback((article: Article) => {
    router.push(`/article/${article.id}?focus=comments`);
  }, []);

  const handleShare = useCallback((article: Article) => {
    setShareArticle(article);
  }, []);

  const handleWhatsapp = useCallback(async (article: Article) => {
    const title = language === 'ta' ? article.titleTa : article.titleEn;
    const url = `https://agnisiragu.com/a/${article.id}`;
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
  }, [language]);

  const handleMore = useCallback((article: Article) => {
    setMoreArticle(article);
  }, []);

  // Builds this specific card's ActionBar props from its own likeCount/
  // dislikeCount plus this device's local reaction + optimistic delta —
  // each card now owns its own action row instead of sharing one global bar.
  const buildActionBarProps = useCallback((article: Article): ActionBarProps => {
    const reaction = getReaction(article.id);
    const delta = countDeltas[article.id] || { like: 0, dislike: 0 };
    return {
      liked: reaction === 'LIKE',
      disliked: reaction === 'DISLIKE',
      likeCount: Math.max(0, (article.likeCount ?? 0) + delta.like),
      dislikeCount: Math.max(0, (article.dislikeCount ?? 0) + delta.dislike),
      commentCount: article.commentCount ?? 0,
      onLike: () => applyReaction(article, 'LIKE'),
      onDislike: () => applyReaction(article, 'DISLIKE'),
      onComment: () => handleComment(article),
      onWhatsapp: () => handleWhatsapp(article),
      onShare: () => handleShare(article),
      onMore: () => handleMore(article),
    };
  }, [getReaction, countDeltas, applyReaction, handleComment, handleWhatsapp, handleShare, handleMore]);

  // Book-page-flip transition: each card hinges like an actual paper page
  // instead of just tilting on its own center. Real pages pivot at the
  // spine, so the pivot point itself moves from the card's LEFT edge (while
  // it's still "ahead", easing in from the right, unread) to its RIGHT edge
  // (once it's "behind", easing out to the left, turned) — using the
  // standard translate/rotate/translate-back anchor-point trick, since RN
  // transforms always pivot on the view's own center by default. A soft
  // shadow overlay darkens toward the spine as the angle increases, and a
  // subtle scale-down sells the perspective foreshortening.
  const withPageFlip = useCallback((node: React.ReactNode, index: number) => {
    const inputRange = [(index - 1) * SNAP, index * SNAP, (index + 1) * SNAP];

    const pivot = scrollX.interpolate({
      inputRange, outputRange: [-SCREEN_W / 2, 0, SCREEN_W / 2], extrapolate: 'clamp',
    });
    const negPivot = Animated.multiply(pivot, -1);

    const rotateY = scrollX.interpolate({
      inputRange, outputRange: ['72deg', '0deg', '-72deg'], extrapolate: 'clamp',
    });
    const scale = scrollX.interpolate({
      inputRange, outputRange: [0.92, 1, 0.92], extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange, outputRange: [0.8, 1, 0.8], extrapolate: 'clamp',
    });
    const foldShadow = scrollX.interpolate({
      inputRange, outputRange: [0.45, 0, 0.45], extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={{
          height: '100%',
          width: SCREEN_W,
          opacity,
          transform: [
            { perspective: 1200 },
            { translateX: pivot },
            { rotateY },
            { scale },
            { translateX: negPivot },
          ],
        }}
      >
        {node}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.foldShadow, { opacity: foldShadow }]}
        />
      </Animated.View>
    );
  }, [scrollX]);

  const renderItem = useCallback(({ item, index }: { item: ListItem; index: number }) => {
    if (item.type === 'ad') return withPageFlip(<AdFeedCard width={SCREEN_W} />, index);

    const { article } = item;
    const style = resolveCardStyle(article);

    if (style === 'FULL_BLEED') {
      return withPageFlip(
        <BreakingNewsCard
          article={article}
          language={language}
          width={SCREEN_W}
          onOpen={() => openArticle(article)}
          actionBar={buildActionBarProps(article)}
        />,
        index,
      );
    }
    if (style === 'NEWSPRINT') {
      return withPageFlip(
        <NewsprintArticleCard
          article={article}
          language={language}
          width={SCREEN_W}
          onOpen={() => openArticle(article)}
          actionBar={buildActionBarProps(article)}
        />,
        index,
      );
    }
    if (style === 'CINEMA') {
      return withPageFlip(
        <CinemaFeedCard
          article={article}
          language={language}
          width={SCREEN_W}
          onOpen={() => openArticle(article)}
          actionBar={buildActionBarProps(article)}
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
        width={SCREEN_W}
        onOpen={() => openArticle(article)}
        actionBar={buildActionBarProps(article)}
      />,
      index,
    );
  }, [language, articles.length, openArticle, withPageFlip, buildActionBarProps]);

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
      <View
        ref={feedAreaRef}
        style={styles.feedArea}
        onLayout={measureFeedArea}
        {...panResponder.panHandlers}
      >
        <Animated.FlatList
          ref={listRef}
          data={listData}
          horizontal
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumEnd}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          style={{ flex: 1 }}
          getItemLayout={(_, index) => ({ length: SNAP, offset: SNAP * index, index })}
          renderToHardwareTextureAndroid
        />
        <SwipeHintOverlay visible={showSwipeHint} language={language} onDismiss={dismissSwipeHint} />

        {/* "Pull down for new news" indicator — fades in as the user drags
            down from the image area, and while a refresh is in flight. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.refreshBadge,
            { top: insets.top + 8, opacity: isRefetching ? 1 : refreshHintOpacity, backgroundColor: t.ink },
          ]}
        >
          <Text style={styles.refreshBadgeText}>
            {isRefetching
              ? (language === 'ta' ? 'புதிய செய்திகள் ஏற்றப்படுகிறது…' : 'Loading new news…')
              : (language === 'ta' ? 'விடுவித்து புதுப்பிக்கவும்' : 'Release to refresh')}
          </Text>
        </Animated.View>
      </View>

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
  feedArea: { flex: 1 },
  foldShadow: { backgroundColor: '#000' },
  refreshBadge: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refreshBadgeText: {
    color: '#fff',
    fontFamily: FONT_FAMILIES.uiSemiBold,
    fontSize: 12,
  },
});
