// src/screens/ProfileScreen.tsx
// Screen 2j — profile with Saved/History segmented tabs. Saved reuses
// bookmarks.store; History reads history.store (see that file — it's a
// local-only read log since there's no server read-history endpoint).

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { useHistoryStore } from '@/store/history.store';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { FONT_FAMILIES, STRINGS } from '@/constants';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Icon from '@/components/icons/Icon';
import EmptyState from '@/components/ui/EmptyState';
import ArticleCard from '@/components/ArticleCard';
import LogoutConfirmSheet from '@/components/sheets/LogoutConfirmSheet';
import type { Article } from '@/types';

type Tab = 'saved' | 'history';

export default function ProfileScreen() {
  const t = useTheme();
  const { user, isAuthenticated, articleReadCount } = useAuthStore();
  const { language } = useAppStore();
  const { logout } = useAuth();
  const { bookmarks } = useBookmarksStore();
  const { history, hydrate: hydrateHistory } = useHistoryStore();
  const [tab, setTab] = useState<Tab>('saved');
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);

  useEffect(() => { hydrateHistory(); }, [hydrateHistory]);

  function handlePress(article: Article) {
    router.push(`/article/${article.id}`);
  }

  async function confirmLogout() {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    setShowLogoutSheet(false);
    router.replace('/');
  }

  const listData = tab === 'saved' ? bookmarks : history;

  return (
    <>
    <FlatList
      style={{ backgroundColor: t.bg }}
      data={listData}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ArticleCard article={item} onPress={handlePress} language={language} />}
      ListHeaderComponent={
        <>
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            {isAuthenticated ? (
              <>
                <Avatar name={user?.name || user?.phone} size={68} />
                <Text style={[styles.name, { color: t.ink }]}>{user?.name ?? (language === 'ta' ? 'பயனர்' : 'User')}</Text>
                <Text style={[styles.phone, { color: t.inkMuted }]}>{user?.phone}</Text>
                <View style={styles.rowButtons}>
                  <Button
                    label={language === 'ta' ? 'சுயவிவரம் திருத்த' : 'Edit Profile'}
                    variant="outline"
                    onPress={() => router.push('/edit-profile')}
                    style={{ flex: 1 }}
                  />
                </View>
                <Text style={[styles.readCount, { color: t.inkMuted }]}>
                  {articleReadCount} {language === 'ta' ? 'செய்திகள் படிக்கப்பட்டன' : 'articles read'}
                </Text>
              </>
            ) : (
              <>
                <Avatar size={68} />
                <Text style={[styles.name, { color: t.ink }]}>{language === 'ta' ? 'விருந்தினர்' : 'Guest'}</Text>
                <Button
                  label={STRINGS.LOGIN_WITH_PHONE_TA}
                  onPress={() => router.push('/login')}
                  style={{ width: '100%', marginTop: 14 }}
                />
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.settingsRow, { borderColor: t.border, backgroundColor: t.surface }]}
            onPress={() => router.push('/settings')}
          >
            <Text style={[styles.settingsLabel, { color: t.ink }]}>{STRINGS.SETTINGS_TA} / {STRINGS.SETTINGS_EN}</Text>
            <Icon name="chevronRight" size={11} color={t.inkMuted} />
          </TouchableOpacity>

          <View style={styles.tabRow}>
            <Chip
              label={STRINGS.BOOKMARKS_TA}
              active={tab === 'saved'}
              onPress={() => setTab('saved')}
              activeStyle="outline"
              style={styles.tabChip}
            />
            <Chip
              label={language === 'ta' ? 'வரலாறு' : 'History'}
              active={tab === 'history'}
              onPress={() => setTab('history')}
              activeStyle="outline"
              style={styles.tabChip}
            />
          </View>
        </>
      }
      ListEmptyComponent={
        <EmptyState
          icon="bookmarkLarge"
          title={tab === 'saved'
            ? (language === 'ta' ? 'சேமிக்கப்பட்ட செய்திகள் இல்லை' : 'No saved articles')
            : (language === 'ta' ? 'வரலாறு இல்லை' : 'No reading history')}
          description={tab === 'saved'
            ? (language === 'ta' ? 'செய்தி அட்டையிலுள்ள சேமி பொத்தானை தொட்டு சேமிக்கலாம்' : 'Tap Save on any article to keep it here')
            : (language === 'ta' ? 'படித்த செய்திகள் இங்கு தோன்றும்' : 'Articles you read will show up here')}
          ctaLabel={language === 'ta' ? 'செய்திகளை படிக்க' : 'Browse Articles'}
          onCta={() => router.replace('/')}
        />
      }
      ListFooterComponent={
        isAuthenticated ? (
          <TouchableOpacity style={[styles.logoutBtn, { borderColor: t.border }]} onPress={() => setShowLogoutSheet(true)}>
            <Text style={[styles.logoutText, { color: t.red }]}>{STRINGS.LOGOUT_TA} / {STRINGS.LOGOUT_EN}</Text>
          </TouchableOpacity>
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 40 }}
    />
    <LogoutConfirmSheet
      visible={showLogoutSheet}
      onDismiss={() => setShowLogoutSheet(false)}
      onConfirm={confirmLogout}
      loading={loggingOut}
      language={language}
    />
    </>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, borderRadius: 14, borderWidth: 1, padding: 22, alignItems: 'center' },
  name: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 18, marginTop: 12 },
  phone: { fontFamily: FONT_FAMILIES.uiRegular, fontSize: 13, marginTop: 2 },
  rowButtons: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
  readCount: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 11.5, marginTop: 10 },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 18,
  },
  settingsLabel: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 14.5 },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 6 },
  tabChip: { flex: 1, alignItems: 'center' },
  logoutBtn: { margin: 16, marginTop: 24, borderWidth: 1.5, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  logoutText: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 14.5 },
});
