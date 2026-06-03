// src/screens/HomeScreen.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useArticles, useBreakingNews } from '@/hooks/useArticles';
import { useCategories } from '@/hooks/useCategories';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { FREE_ARTICLE_LIMIT, COLORS } from '@/constants';
import ArticleCard from '@/components/ArticleCard';
import BreakingNewsCarousel from '@/components/BreakingNewsCarousel';
import CategoryTab from '@/components/CategoryTab';
import LoginGateModal from '@/components/LoginGateModal';
import AdBanner from '@/components/AdBanner';
import type { Article } from '@/types';

const AD_EVERY = 5;

type ListItem =
  | { type: 'article'; article: Article; key: string }
  | { type: 'ad'; key: string };

export default function HomeScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (params.categoryId) setSelectedCategoryId(params.categoryId);
  }, [params.categoryId]);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { isAuthenticated, articleReadCount } = useAuthStore();
  const { language } = useAppStore();

  const {
    data: articlesData,
    isLoading: articlesLoading,
    isError: articlesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useArticles(selectedCategoryId ?? undefined);

  const { data: breakingNews } = useBreakingNews();
  const { data: categories } = useCategories();

  const articles = useMemo(
    () => articlesData?.pages.flatMap((p) => p.data) ?? [],
    [articlesData],
  );

  const listData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];
    articles.forEach((article, i) => {
      items.push({ type: 'article', article, key: article.id });
      if ((i + 1) % AD_EVERY === 0) {
        items.push({ type: 'ad', key: `ad-${i}` });
      }
    });
    return items;
  }, [articles]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleArticlePress = useCallback(
    (article: Article) => {
      if (!isAuthenticated && articleReadCount >= FREE_ARTICLE_LIMIT) {
        setShowLoginGate(true);
        return;
      }
      router.push(`/article/${article.id}`);
    },
    [isAuthenticated, articleReadCount],
  );

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'ad') return <AdBanner />;
      return (
        <ArticleCard
          article={item.article}
          onPress={handleArticlePress}
          language={language}
        />
      );
    },
    [handleArticlePress, language],
  );

  if (articlesLoading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (articlesError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          செய்திகளை ஏற்ற முடியவில்லை{'\n'}Unable to load articles
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <>
            {breakingNews && breakingNews.length > 0 && (
              <BreakingNewsCarousel articles={breakingNews} language={language} />
            )}
            {categories && (
              <CategoryTab
                categories={categories}
                selectedId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
                language={language}
              />
            )}
          </>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              style={styles.footer}
              size="small"
              color={COLORS.primary}
            />
          ) : null
        }
        contentContainerStyle={styles.list}
      />

      <LoginGateModal
        visible={showLoginGate}
        onDismiss={() => setShowLoginGate(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingVertical: 20,
  },
});
