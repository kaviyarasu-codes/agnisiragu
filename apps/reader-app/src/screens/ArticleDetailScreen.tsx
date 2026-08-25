// src/screens/ArticleDetailScreen.tsx
// Full story screen — design 2c / 1a's "full story" card: hero media,
// reporter row with follow, full body, related stories, and a comments
// section. Comments are UI-only for now (no `/articles/:id/comments`
// endpoint exists yet on the backend) — same pattern ArticleCard.tsx
// already uses for its like counter.

import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Share, StyleSheet, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useArticle, useRelatedArticles } from '@/hooks/useArticles';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { patch } from '@/lib/api';
import { FREE_ARTICLE_LIMIT, FONT_FAMILIES } from '@/constants';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { useHistoryStore } from '@/store/history.store';
import ArticleCard from '@/components/ArticleCard';
import AdBanner from '@/components/AdBanner';
import LoginGateModal from '@/components/LoginGateModal';
import ShareSheet from '@/components/sheets/ShareSheet';
import EmptyState from '@/components/ui/EmptyState';
import { FeedSkeleton } from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/icons/Icon';
import type { Article } from '@/types';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ta-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface LocalComment { id: string; name: string; text: string }

export default function ArticleDetailScreen() {
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const { data: article, isLoading, isError } = useArticle(id);
  const { isAuthenticated, articleReadCount, incrementReadCount } = useAuthStore();
  const { language, remoteConfig } = useAppStore();
  const { isBookmarked, toggleBookmark } = useBookmarksStore();
  const addToHistory = useHistoryStore((s) => s.addToHistory);
  const t = useTheme();
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [draft, setDraft] = useState('');
  const [following, setFollowing] = useState(false);
  const commentsRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);

  const freeArticleLimit = remoteConfig.loginGate
    ? (remoteConfig.freeArticleLimit || FREE_ARTICLE_LIMIT)
    : Infinity;
  const shouldGate = !isAuthenticated && articleReadCount >= freeArticleLimit;

  const { data: related } = useRelatedArticles(article?.category.id ?? '', article?.id ?? '');

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
  const saved = isBookmarked(article.id);

  async function handleShare() {
    setShowShare(true);
  }

  function postComment() {
    if (!draft.trim()) return;
    setComments((prev) => [{ id: String(Date.now()), name: 'நீங்கள்', text: draft.trim() }, ...prev]);
    setDraft('');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} style={[styles.container, { backgroundColor: t.surface }]} showsVerticalScrollIndicator={false}>
        {article.thumbnailUrl ? (
          <Image source={{ uri: article.thumbnailUrl }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: t.bgAlt }]} />
        )}

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
              onPress={() => setFollowing((v) => !v)}
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
            <Text style={[styles.body, { color: t.inkSub }]}>{body}</Text>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: t.red }]} onPress={handleShare}>
              <Icon name="share" size={16} color={t.red} />
              <Text style={[styles.actionText, { color: t.red }]}>பகிர் / Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: saved ? t.red : t.border, backgroundColor: saved ? t.redSoft : t.surface }]}
              onPress={() => toggleBookmark(article)}
            >
              <Icon name="bookmarkNav" size={16} color={saved ? t.red : t.ink} />
              <Text style={[styles.actionText, { color: saved ? t.red : t.ink }]}>{saved ? 'சேமிக்கப்பட்டது' : 'சேமி'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!shouldGate && (
          <>
            <AdBanner />

            {related && related.length > 0 && (
              <View style={styles.relatedSection}>
                <Text style={[styles.sectionHeading, { color: t.ink }]}>தொடர்புடைய செய்திகள் / Related</Text>
                {related.map((rel) => (
                  <ArticleCard key={rel.id} article={rel} onPress={(a: Article) => router.push(`/article/${a.id}`)} language={language} />
                ))}
              </View>
            )}

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroImage: { width: '100%', height: 210 },
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
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionBtn: {
    flex: 1, flexDirection: 'row', gap: 7, borderWidth: 1.5, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  actionText: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 13.5 },
  sectionHeading: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 15, paddingHorizontal: 16, paddingVertical: 12 },
  relatedSection: { paddingTop: 8, paddingBottom: 12 },
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
