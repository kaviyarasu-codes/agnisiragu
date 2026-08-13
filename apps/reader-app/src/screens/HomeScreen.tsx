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
import { useTheme } from '@/hooks/useTheme';
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
  const { language, remoteConfig } = useAppStore();
  const freeArticleLimit = remoteConfig.loginGate
    ? (remoteConfig.freeArticleLimit || FREE_ARTICLE_LIMIT)
    : Infinity;
  const theme = useTheme();

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
  const { data: categoriesRaw } = useCategories();

  // Pinned categories (from App Config) are moved to the front, in the
  // configured order; everything else keeps its normal displayOrder.
  const categories = useMemo(() => {
    if (!categoriesRaw) return categoriesRaw;
    const pinned = remoteConfig.pinnedCategorySlugs ?? [];
    if (pinned.length === 0) return categoriesRaw;
    const bySlug = new Map(categoriesRaw.map((c) => [c.slug, c]));
    const pinnedCats = pinned.map((slug) => bySlug.get(slug)).filter(Boolean) as typeof categoriesRaw;
    const rest = categoriesRaw.filter((c) => !pinned.includes(c.slug));
    return [...pinnedCats, ...rest];
  }, [categoriesRaw, remoteConfig.pinnedCategorySlugs]);

  const showBreakingCarousel = remoteConfig.homeShowBreakingBar && remoteConfig.widgetBreakingBanner
    && breakingNews && breakingNews.length > 0;
  const showCategoryTabs = remoteConfig.widgetCategoryTabs && !!categories;
  const sectionOrder = remoteConfig.homeSectionOrder?.length ? remoteConfig.homeSectionOrder : ['breaking', 'categories'];

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
      if (!isAuthenticated && articleReadCount >= freeArticleLimit) {
        setShowLoginGate(true);
        return;
      }
      router.push(`/article/${article.id}`);
    },
    [isAuthenticated, articleReadCount, freeArticleLimit],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ListItem; index: number }) => {
      if (item.type === 'ad') return <AdBanner />;
      return (
        <ArticleCard
          article={item.article}
          onPress={handleArticlePress}
          language={language}
          index={index}
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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
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
            {sectionOrder.map((sectionKey) => {
              if (sectionKey === 'breaking' && showBreakingCarousel) {
                return (
                  <BreakingNewsCarousel
                    key="breaking"
                    articles={breakingNews!}
                    language={language}
                    mode={remoteConfig.homeHeroStyle}
                  />
                );
              }
              if (sectionKey === 'categories' && showCategoryTabs) {
                return (
                  <CategoryTab
                    key="categories"
                    categories={categories!}
                    selectedId={selectedCategoryId}
                    onSelect={setSelectedCategoryId}
                    language={language}
                    showSeeAll={remoteConfig.newsShowSeeAll}
                  />
                );
              }
              return null;
            })}
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
