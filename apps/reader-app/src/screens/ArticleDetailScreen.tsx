// src/screens/ArticleDetailScreen.tsx

import React, { useEffect, useState } from 'react';
import { ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useArticle, useRelatedArticles } from '@/hooks/useArticles';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { patch } from '@/lib/api';
import { FREE_ARTICLE_LIMIT, COLORS } from '@/constants';
import ArticleCard from '@/components/ArticleCard';
import AdBanner from '@/components/AdBanner';
import LoginGateModal from '@/components/LoginGateModal';
import type { Article } from '@/types';
import { router } from 'expo-router';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ta-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: article, isLoading, isError } = useArticle(id);
  const { isAuthenticated, articleReadCount, incrementReadCount } = useAuthStore();
  const { language } = useAppStore();
  const [showLoginGate, setShowLoginGate] = useState(false);

  const shouldGate = !isAuthenticated && articleReadCount >= FREE_ARTICLE_LIMIT;

  const { data: related } = useRelatedArticles(
    article?.category.id ?? '',
    article?.id ?? '',
  );

  useEffect(() => {
    if (article && isAuthenticated) {
      patch('/articles/read', { articleId: article.id }).catch(() => {});
      incrementReadCount();
    } else if (article && !isAuthenticated) {
      incrementReadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id]);

  useEffect(() => {
    if (shouldGate) {
      setShowLoginGate(true);
    }
  }, [shouldGate]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isError || !article) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          செய்தியை ஏற்ற முடியவில்லை{'\n'}Unable to load article
        </Text>
      </View>
    );
  }

  const title = language === 'ta' ? article.titleTa : article.titleEn;
  const body = language === 'ta' ? article.bodyTa : article.bodyEn;
  const categoryName = language === 'ta' ? article.category.nameTa : article.category.nameEn;

  async function handleShare() {
    await Share.share({
      title,
      message: `${title}\n\nhttps://agnisiragu.com/article/${article!.id}`,
    });
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {article.thumbnailUrl && (
          <Image
            source={{ uri: article.thumbnailUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
        )}

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{categoryName}</Text>
            </View>
            <Text style={styles.date}>{formatDate(article.publishedAt)}</Text>
          </View>

          <Text style={styles.title}>{title}</Text>

          {shouldGate ? (
            <View style={styles.gateOverlay}>
              <Text style={styles.gateText}>
                மேலும் படிக்க உள்நுழையவும்{'\n'}Login to continue reading
              </Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => setShowLoginGate(true)}
              >
                <Text style={styles.loginButtonText}>உள்நுழைய / Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.body}>{body}</Text>
          )}

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>பகிர் / Share</Text>
          </TouchableOpacity>
        </View>

        {!shouldGate && (
          <>
            <AdBanner />

            {related && related.length > 0 && (
              <View style={styles.relatedSection}>
                <Text style={styles.relatedHeading}>
                  தொடர்புடைய செய்திகள் / Related Articles
                </Text>
                {related.map((rel) => (
                  <ArticleCard
                    key={rel.id}
                    article={rel}
                    onPress={(a: Article) => router.push(`/article/${a.id}`)}
                    language={language}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <LoginGateModal
        visible={showLoginGate}
        onDismiss={() => setShowLoginGate(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  heroImage: {
    width: '100%',
    height: 240,
  },
  content: {
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 32,
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 28,
    marginBottom: 20,
  },
  gateOverlay: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  gateText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  loginButtonText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  shareButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  shareButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  relatedSection: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  relatedHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
