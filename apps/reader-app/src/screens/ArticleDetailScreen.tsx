// src/screens/ArticleDetailScreen.tsx
// Full story screen — design 2c / 1a's "full story" card: hero media,
// reporter row with follow, full body, and a comments section. Uses the
// same ActionBar component as the feed cards (like/dislike counts,
// comment, whatsapp/more/share) instead of its own separate button set,
// for visual consistency between the feed and the full-story read. The
// "Related" section has been removed per product decision. Comments are
// UI-only for now (no `/articles/:id/comments` endpoint exists yet on the
// backend) — same pattern ArticleCard.tsx already uses for its like
// counter.

import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Share, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useArticle } from '@/hooks/useArticles';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { useReactionsStore } from '@/store/reactions.store';
import { useTheme } from '@/hooks/useTheme';
import { patch } from '@/lib/api';
import { FREE_ARTICLE_LIMIT, FONT_FAMILIES } from '@/constants';
import { useHistoryStore } from '@/store/history.store';
import ArticleBody from '@/components/ArticleBody';
import AdBanner from '@/components/AdBanner';
import LoginGateModal from '@/components/LoginGateModal';
import ShareSheet from '@/components/sheets/ShareSheet';
import MoreActionsSheet from '@/components/sheets/MoreActionsSheet';
import EmptyState from '@/components/ui/EmptyState';
import { FeedSkeleton } from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/icons/Icon';
import ActionBar from '@/components/feed/ActionBar';
import MediaCarousel from '@/components/feed/MediaCarousel';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ta-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface LocalComment { id: string; name: string; text: string }

export default function ArticleDetailScreen() {
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const { data: article, isLoading, isError } = useArticle(id);
  const { isAuthenticated, articleReadCount, incrementReadCount } = useAuthStore();
  const { language, remoteConfig } = useAppStore();
  const addToHistory = useHistoryStore((s) => s.addToHistory);
  const { hydrate: hydrateReactions, getReaction, react } = useReactionsStore();
  const t = useTheme();
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [draft, setDraft] = useState('');
  const [following, setFollowing] = useState(false);
  const [countDelta, setCountDelta] = useState({ like: 0, dislike: 0 });
  const commentsRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);

  const freeArticleLimit = remoteConfig.loginGate
    ? (remoteConfig.freeArticleLimit || FREE_ARTICLE_LIMIT)
    : Infinity;
  const shouldGate = !isAuthenticated && articleReadCount >= freeArticleLimit;

  useEffect(() => { hydrateReactions(); }, [hydrateReactions]);

  useEffect(() => {
    if (article && isAuthenticated) {
      patch('/articles/read', { articleId: article.id }).catch(() => {});
      incrementReadCount();
    } else if (article && !isAuthenticated) {
      incrementReadCount();
    }
    if (article) addToHistory(article);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id]);

  useEffect(() => {
    if (shouldGate) setShowLoginGate(true);
  }, [shouldGate]);

  // Follow status — persisted the same way ReporterProfileScreen does
  // (AsyncStorage, keyed by byline), so following a reporter here stays in
  // sync with their profile screen instead of resetting on every visit.
  const byline = article?.byline?.trim() || 'அக்னிசிறகு டெஸ்க்';
  const followKey = `followed_reporter_${byline}`;
  useEffect(() => {
    AsyncStorage.getItem(followKey).then((v) => setFollowing(v === '1'));
  }, [followKey]);

  async function toggleFollow() {
    const next = !following;
    setFollowing(next);
    await AsyncStorage.setItem(followKey, next ? '1' : '0');
  }

  useEffect(() => {
    if (focus === 'comments' && article) {
      setTimeout(() => commentsRef.current?.measure((_x, y) => scrollRef.current?.scrollTo({ y, animated: true })), 300);
    }
  }, [focus, article]);

  if (isLoading) return <FeedSkeleton />;

  if (isError || !article) {
    return (
      <EmptyState
        icon="warningTriangle"
        title="ஏதோ தவறு நடந்தது"
        description="சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்."
        ctaLabel="மீண்டும் முயற்சி"
        onCta={() => router.back()}
      />
    );
  }

  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const body = language === 'ta' ? article.bodyTa : article.bodyEn;
  const categoryName = language === 'ta' ? article.category.nameTa : article.category.nameEn;

  function handleShare() {
    setShowShare(true);
  }

  function handleMore() {
    setShowMore(true);
  }

  function scrollToComments() {
    commentsRef.current?.measure((_x, y) => scrollRef.current?.scrollTo({ y, animated: true }));
  }

  async function handleWhatsapp() {
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
  }

  async function applyReaction(type: 'LIKE' | 'DISLIKE') {
    const { likeDelta, dislikeDelta } = await react(article.id, type);
    setCountDelta((prev) => ({ like: prev.like + likeDelta, dislike: prev.dislike + dislikeDelta }));
  }

  function postComment() {
    if (!draft.trim()) return;
    setComments((prev) => [{ id: String(Date.now()), name: 'நீங்கள்', text: draft.trim() }, ...prev]);
    setDraft('');
  }

  const reaction = getReaction(article.id);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} style={[styles.container, { backgroundColor: t.surface }]} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <MediaCarousel mediaUrls={article.mediaUrls} thumbnailUrl={article.thumbnailUrl} />
        </View>

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <Text style={[styles.category, { color: t.red }]}>{categoryName}</Text>
            <View style={[styles.dot, { backgroundColor: t.border }]} />
            <Text style={[styles.date, { color: t.inkMuted }]}>{formatDate(article.publishedAt)}</Text>
          </View>

          <Text style={[styles.title, { color: t.ink }]}>{title}</Text>

          <View style={[styles.reporterRow, { borderTopColor: t.border, borderBottomColor: t.border }]}>
            <Avatar name={article.byline || 'Agnisiragu'} size={26} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.reporterName, { color: t.ink }]}>
                {article.byline?.trim() ? article.byline : 'அக்னிசிறகு டெஸ்க்'}
              </Text>
              <Text style={[styles.reporterTag, { color: t.inkMuted }]}>CITIZEN REPORTER</Text>
            </View>
            <TouchableOpacity
              onPress={toggleFollow}
              style={[styles.followBtn, { borderColor: t.red, backgroundColor: following ? t.red : 'transparent' }]}
            >
              <Text style={[styles.followText, { color: following ? '#fff' : t.red }]}>
                {following ? 'பின்தொடர்கிறீர்கள்' : 'பின்தொடர்'}
              </Text>
            </TouchableOpacity>
          </View>

          {shouldGate ? (
            <View style={styles.gateOverlay}>
              <Text style={[styles.gateText, { color: t.inkSub }]}>
                மேலும் படிக்க உள்நுழையவும்{'\n'}Login to continue reading
              </Text>
              <TouchableOpacity style={[styles.loginButton, { backgroundColor: t.red }]} onPress={() => setShowLoginGate(true)}>
                <Text style={styles.loginButtonText}>உள்நுழைய / Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ArticleBody html={body} textStyle={[styles.body, { color: t.inkSub }]} linkColor={t.red} />
          )}
        </View>

        {!shouldGate && (
          <>
            <View style={[styles.actionBarWrap, { borderTopColor: t.border, borderBottomColor: t.border }]}>
              <ActionBar
                liked={reaction === 'LIKE'}
                disliked={reaction === 'DISLIKE'}
                likeCount={Math.max(0, (article.likeCount ?? 0) + countDelta.like)}
                dislikeCount={Math.max(0, (article.dislikeCount ?? 0) + countDelta.dislike)}
                commentCount={article.commentCount ?? comments.length}
                onLike={() => applyReaction('LIKE')}
                onDislike={() => applyReaction('DISLIKE')}
                onComment={scrollToComments}
                onWhatsapp={handleWhatsapp}
                onShare={handleShare}
                onMore={handleMore}
              />
            </View>

            <AdBanner />

            <View ref={commentsRef} style={styles.commentsSection}>
              <Text style={[styles.sectionHeading, { color: t.ink }]}>கருத்துகள் · {comments.length}</Text>
              {comments.length === 0 ? (
                <Text style={[styles.noComments, { color: t.inkMuted }]}>முதலில் கருத்து தெரிவியுங்கள்</Text>
              ) : (
                comments.map((c) => (
                  <View key={c.id} style={styles.commentRow}>
                    <Avatar name={c.name} size={24} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.commentName, { color: t.ink }]}>{c.name}</Text>
                      <Text style={[styles.commentText, { color: t.inkSub }]}>{c.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {!shouldGate && (
        <View style={[styles.composerBar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
          <TextInput
            style={[styles.composerInput, { backgroundColor: t.bg, color: t.ink }]}
            placeholder="கருத்து எழுதுங்கள்…"
            placeholderTextColor={t.inkMuted}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={postComment}
          />
          <TouchableOpacity onPress={postComment} hitSlop={10}>
            <Icon name="share" size={19} color={t.ink} strokeWidth={1.7} />
          </TouchableOpacity>
        </View>
      )}

      <LoginGateModal visible={showLoginGate} onDismiss={() => setShowLoginGate(false)} />
      <ShareSheet visible={showShare} onDismiss={() => setShowShare(false)} article={article} language={language} />
      <MoreActionsSheet visible={showMore} onDismiss={() => setShowMore(false)} article={article} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroImage: { width: '100%', height: 210 },
  heroWrap: { width: '100%', height: 210, position: 'relative' },
  content: { padding: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  category: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 11, letterSpacing: 0.6 },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
  date: { fontFamily: FONT_FAMILIES.uiRegular, fontSize: 11 },
  title: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 23, lineHeight: 30, letterSpacing: -0.2 },
  reporterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    marginTop: 13, paddingVertical: 9, borderTopWidth: 1, borderBottomWidth: 1,
  },
  reporterName: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 13 },
  reporterTag: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 9.5, letterSpacing: 0.7, marginTop: 1 },
  followBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  followText: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 11.5 },
  gateOverlay: { alignItems: 'center', paddingVertical: 32, gap: 16 },
  gateText: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 15, textAlign: 'center', lineHeight: 24 },
  loginButton: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  loginButtonText: { color: '#fff', fontFamily: FONT_FAMILIES.uiBold, fontSize: 15 },
  body: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 15, lineHeight: 27, marginTop: 14 },
  actionBarWrap: { borderTopWidth: 1, borderBottomWidth: 1, marginTop: 6 },
  sectionHeading: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 15, paddingHorizontal: 16, paddingVertical: 12 },
  commentsSection: { paddingBottom: 100 },
  noComments: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13, paddingHorizontal: 16 },
  commentRow: { flexDirection: 'row', gap: 9, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'flex-start' },
  commentName: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12 },
  commentText: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12.5, lineHeight: 19, marginTop: 1 },
  composerBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 52, paddingHorizontal: 14, borderTopWidth: 1,
  },
  composerInput: { flex: 1, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9, fontSize: 12.5 },
});
