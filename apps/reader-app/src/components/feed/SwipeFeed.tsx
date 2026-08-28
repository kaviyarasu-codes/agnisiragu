// src/components/feed/SwipeFeed.tsx
// The Home experience: stories stack like physical newspaper pages (design
// spec "1a" step 03, "Feed — flip through stories") — swiping left/right
// flips to the next/previous story with a real page-turn rotation, not a
// slide. Replaces the earlier FlatList-based continuous-drag paging with
// the spec's exact mechanic:
//
//   - Every page (article or ad slide) is an absolutely-positioned sibling,
//     stacked with inset:0, pivoting around its LEFT edge (the standard
//     translate/rotateY/translate-back anchor trick, since RN transforms
//     always pivot on the view's own center by default).
//   - Resting (not yet flipped): rotateY(0deg). Flipped-past (pages before
//     the current index): rotateY(-178deg) — not -180, so a hairline sliver
//     stays visible, matching the spec's "never fully edge-on" note.
//   - zIndex: total - i, so unflipped pages stack correctly above later
//     ones; only the current page is touchable (pointerEvents), and only it
//     gets a left-edge drop shadow (simulating the stack behind it).
//   - A gesture is a simple release-time X-delta check (not a live-follow
//     drag): |dx| > 34px triggers a flip, animated over 620ms with the
//     spec's exact cubic-bezier easing, plus a light-sweep/curl overlay
//     (an SVG gradient, since expo-linear-gradient isn't installed and
//     react-native-svg already is) that fades in and back out on whichever
//     page is mid-flip.
//   - Only pages within RENDER_WINDOW of the current index are mounted, so
//     a long feed (73+ stories) doesn't hold dozens of images/ScrollViews
//     in memory at once.
//
// The SAME top-level gesture handler also still runs the swipe-DOWN-to-
// refresh gesture (pull-to-refresh style), armed only when a drag starts
// inside the fixed image zone at the top of the current page (the top
// FEED_IMAGE_HEIGHT_FRACTION of the card — see FeedCard.tsx) and is clearly
// vertical — so it never fights the new horizontal flip gesture, or a
// page's own inner text ScrollView / media carousel for the same touch.
//
// Each page renders its own ActionBar (like+count/dislike+count/comment+
// count, then WhatsApp/more/share icons) INSIDE the page itself, so the
// action row turns with the page — see buildActionBarProps below.
//
// Card selection: every article renders as the single standard
// ArticleFeedCard — the feed no longer varies layout per article (no more
// automatic Full-bleed/Cinema/Newsprint). The BreakingNewsCard/
// CinemaFeedCard/NewsprintArticleCard components and Article.cardStyle stay
// in the codebase in case they're reused elsewhere later; this file just no
// longer calls them.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Animated, Dimensions, StyleSheet, Linking, Share, PanResponder, Text, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useArticles } from '@/hooks/useArticles';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { useReactionsStore } from '@/store/reactions.store';
import { FREE_ARTICLE_LIMIT, STORAGE_KEYS, FONT_FAMILIES } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { ArticleFeedCard, AdFeedCard, FEED_IMAGE_HEIGHT_FRACTION } from './FeedCard';
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
const RENDER_WINDOW = 2; // how many pages either side of the current index stay mounted
const SWIPE_THRESHOLD = 34; // px, matches the design spec exactly
const FLIP_DURATION = 620; // ms, matches the design spec's .62s transform transition
const FLIP_EASING = Easing.bezier(0.55, 0.06, 0.4, 0.98);

type ListItem =
  | { type: 'article'; key: string; article: Article; articleIndex: number }
  | { type: 'ad'; key: string; articleIndex: number };

interface SwipeFeedProps {
  categoryId?: string;
}

// The curl/light-sweep overlay — a horizontal 5-stop gradient that fades in
// then out over whichever page is actively mid-flip, simulating the light
// catching a turning page. Built with react-native-svg (already a project
// dependency) instead of expo-linear-gradient to avoid adding a new native
// module mid-way through a fragile EAS build history.
function CurlOverlay({ opacity }: { opacity: Animated.Value }) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.curl, { opacity }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="curl" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#000000" stopOpacity={0.32} />
            <Stop offset="18%" stopColor="#000000" stopOpacity={0.06} />
            <Stop offset="45%" stopColor="#000000" stopOpacity={0} />
            <Stop offset="78%" stopColor="#ffffff" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0.12} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#curl)" />
      </Svg>
    </Animated.View>
  );
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

  // The current page index in listData — this IS React state (not a ref)
  // since zIndex/pointerEvents per page depend on it and need a re-render.
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [categoryId]);
  useEffect(() => {
    if (idx >= listData.length && listData.length > 0) setIdx(listData.length - 1);
  }, [idx, listData.length]);

  // Measures the feed area's on-screen position/height so the swipe-down-
  // to-refresh gesture can tell whether a drag started inside the fixed
  // image zone at the top of the current page (the top
  // FEED_IMAGE_HEIGHT_FRACTION of the card).
  const feedAreaRef = useRef<View>(null);
  const feedAreaTopRef = useRef(0);
  const feedAreaHeightRef = useRef(0);
  const measureFeedArea = useCallback(() => {
    feedAreaRef.current?.measure((_x, _y, _w, h, _pageX, pageY) => {
      feedAreaTopRef.current = pageY;
      feedAreaHeightRef.current = h;
    });
  }, []);

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

  // Per-page Animated.Values, keyed by the page's stable listData key and
  // kept alive in refs (not state) for the whole feed's lifetime — so a
  // page's flipped/unflipped angle survives it scrolling in and out of the
  // render window (see RENDER_WINDOW below). Each go() call animates
  // exactly one boundary page's value; every other page's value is already
  // sitting at its correct resting (0) or flipped (-178) angle from a
  // previous flip, so nothing needs re-syncing on remount.
  const rotateValuesRef = useRef<Map<string, Animated.Value>>(new Map());
  const curlValuesRef = useRef<Map<string, Animated.Value>>(new Map());
  const getRotateValue = useCallback((key: string) => {
    let v = rotateValuesRef.current.get(key);
    if (!v) { v = new Animated.Value(0); rotateValuesRef.current.set(key, v); }
    return v;
  }, []);
  const getCurlValue = useCallback((key: string) => {
    let v = curlValuesRef.current.get(key);
    if (!v) { v = new Animated.Value(0); curlValuesRef.current.set(key, v); }
    return v;
  }, []);

  // There's no "open the full story" tap left in the feed anymore — a card
  // IS the full story, read via scrolling right here (see FeedCard.tsx).
  // Comments are still a dedicated screen (no inline comment UI in the
  // feed), so that's the one remaining place the feed navigates away to —
  // and the free-article-limit login gate now lives on THAT trigger instead
  // of on a "read full story" tap.
  const openArticle = useCallback((article: Article, focus?: 'comments') => {
    if (!isAuthenticated && articleReadCount >= freeLimit) {
      setShowLoginGate(true);
      return;
    }
    router.push(focus ? `/article/${article.id}?focus=${focus}` : `/article/${article.id}`);
  }, [isAuthenticated, articleReadCount, freeLimit]);

  // These act on the specific article they were invoked for — each page
  // carries its own ActionBar (so it turns/flips together with the page),
  // rather than a single shared bar for one "active" card.
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
    openArticle(article, 'comments');
  }, [openArticle]);

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

  // Builds this specific page's ActionBar props from its own likeCount/
  // dislikeCount plus this device's local reaction + optimistic delta.
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

  // Flip to the next (dir=1) or previous (dir=-1) page, animating exactly
  // the one boundary page whose flipped state changes.
  const go = useCallback((dir: 1 | -1) => {
    const nextIdx = Math.max(0, Math.min(idx + dir, listData.length - 1));
    if (nextIdx === idx) return;

    const flipKey = dir > 0 ? listData[idx].key : listData[nextIdx].key;
    const rotateVal = getRotateValue(flipKey);
    const curlVal = getCurlValue(flipKey);

    Animated.timing(rotateVal, {
      toValue: dir > 0 ? -178 : 0,
      duration: FLIP_DURATION,
      easing: FLIP_EASING,
      useNativeDriver: true,
    }).start();

    Animated.timing(curlVal, {
      toValue: 1, duration: FLIP_DURATION, easing: Easing.ease, useNativeDriver: true,
    }).start(() => {
      Animated.timing(curlVal, {
        toValue: 0, duration: 320, easing: Easing.ease, useNativeDriver: true,
      }).start();
    });

    setIdx(nextIdx);
    dismissSwipeHint();

    if (nextIdx >= listData.length - 3 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [idx, listData, getRotateValue, getCurlValue, dismissSwipeHint, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Single top-level gesture handler for both the horizontal flip and the
  // swipe-down-to-refresh. Decides the axis once per touch (on first real
  // movement) so it never fights a page's own vertical text ScrollView or
  // the media carousel's own inner swipe.
  const [refreshHintOpacity] = useState(() => new Animated.Value(0));
  const gestureAxisRef = useRef<'none' | 'horizontal' | 'vertical'>('none');

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_evt, gesture) => {
      if (gestureAxisRef.current !== 'none') return false;
      const { dx, dy } = gesture;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return false;

      if (Math.abs(dx) > Math.abs(dy) * 1.3) {
        gestureAxisRef.current = 'horizontal';
        return true;
      }
      if (dy > 0 && Math.abs(dy) > Math.abs(dx) * 1.5) {
        const imageZoneHeight = feedAreaHeightRef.current * FEED_IMAGE_HEIGHT_FRACTION;
        const startY = gesture.y0 - feedAreaTopRef.current;
        if (startY >= 0 && startY <= imageZoneHeight) {
          gestureAxisRef.current = 'vertical';
          return true;
        }
      }
      return false;
    },
    onPanResponderMove: (_evt, gesture) => {
      if (gestureAxisRef.current === 'vertical') {
        const progress = Math.min(1, Math.abs(gesture.dy) / 90);
        refreshHintOpacity.setValue(progress);
      }
    },
    onPanResponderRelease: (_evt, gesture) => {
      if (gestureAxisRef.current === 'horizontal') {
        if (gesture.dx <= -SWIPE_THRESHOLD) go(1);
        else if (gesture.dx >= SWIPE_THRESHOLD) go(-1);
      } else if (gestureAxisRef.current === 'vertical') {
        Animated.timing(refreshHintOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        if (gesture.dy > 70 && !isRefetching) refetch();
      }
      gestureAxisRef.current = 'none';
    },
    onPanResponderTerminate: () => {
      Animated.timing(refreshHintOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      gestureAxisRef.current = 'none';
    },
  }), [go, refetch, isRefetching, refreshHintOpacity]);

  const renderPageContent = useCallback((item: ListItem) => {
    if (item.type === 'ad') return <AdFeedCard width={SCREEN_W} />;
    const { article } = item;
    return (
      <ArticleFeedCard
        article={article}
        language={language}
        index={item.articleIndex}
        total={articles.length}
        width={SCREEN_W}
        actionBar={buildActionBarProps(article)}
      />
    );
  }, [language, articles.length, buildActionBarProps]);

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
        {listData.map((item, i) => {
          if (Math.abs(i - idx) > RENDER_WINDOW) return null;

          const rotateVal = getRotateValue(item.key);
          const curlVal = getCurlValue(item.key);
          const rotateY = rotateVal.interpolate({ inputRange: [-178, 0], outputRange: ['-178deg', '0deg'] });
          const isCurrent = i === idx;
          const zIndex = listData.length - i;

          return (
            <Animated.View
              key={item.key}
              pointerEvents={isCurrent ? 'auto' : 'none'}
              style={[
                styles.page,
                { zIndex, backgroundColor: t.surface },
                isCurrent && idx > 0 ? styles.pageShadow : null,
                {
                  transform: [
                    { perspective: 1400 },
                    { translateX: -SCREEN_W / 2 },
                    { rotateY },
                    { translateX: SCREEN_W / 2 },
                  ],
                },
              ]}
            >
              {renderPageContent(item)}
              <CurlOverlay opacity={curlVal} />
            </Animated.View>
          );
        })}

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
          sensexValue={remoteConfig.rateTickerSensexValue}
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
  feedArea: { flex: 1, position: 'relative', overflow: 'hidden' },
  page: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'column',
    backfaceVisibility: 'hidden',
  },
  pageShadow: {
    shadowColor: '#000',
    shadowOffset: { width: -14, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 10,
  },
  curl: { zIndex: 3 },
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
