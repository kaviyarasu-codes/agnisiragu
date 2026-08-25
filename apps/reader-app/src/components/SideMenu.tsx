// src/components/SideMenu.tsx
// Slide-out drawer — the redesign's primary navigation surface now that the
// bottom tab bar is gone (see AppNavigator.tsx, which Task 10 retires).
// Core links (Home/Categories/Search/Archive/Jobs/Post/Notifications/
// Settings) always show; Profile/Bookmarks/Contact stay gated behind their
// existing App Config → Side Menu toggles so the admin's existing settings
// keep working unchanged.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/hooks/useTheme';
import { STRINGS, FONT_FAMILIES } from '@/constants';
import Avatar from '@/components/ui/Avatar';
import Switch from '@/components/ui/Switch';
import Icon, { IconName } from '@/components/icons/Icon';

interface NavItem { icon: IconName; labelTa: string; labelEn: string; path: string }

const CORE_ITEMS: NavItem[] = [
  { icon: 'home', labelTa: STRINGS.HOME_TA, labelEn: STRINGS.HOME_EN, path: '/' },
  { icon: 'grid', labelTa: STRINGS.CATEGORIES_TA, labelEn: STRINGS.CATEGORIES_EN, path: '/categories' },
  { icon: 'search', labelTa: STRINGS.SEARCH_TA, labelEn: STRINGS.SEARCH_EN, path: '/search' },
  { icon: 'archiveBox', labelTa: STRINGS.ARCHIVE_TA, labelEn: STRINGS.ARCHIVE_EN, path: '/archive' },
  { icon: 'jobsBriefcase', labelTa: STRINGS.JOBS_TA, labelEn: STRINGS.JOBS_EN, path: '/jobs' },
  { icon: 'postPlus', labelTa: STRINGS.POST_TA, labelEn: STRINGS.POST_EN, path: '/post' },
  { icon: 'bell', labelTa: STRINGS.NOTIFICATIONS_TA, labelEn: STRINGS.NOTIFICATIONS_EN, path: '/notifications' },
];

export default function SideMenu() {
  const { sideMenuOpen, setSideMenuOpen, remoteConfig, language, setLanguage, colorScheme, setColorScheme } = useAppStore();
  const { isAuthenticated, user } = useAuthStore();
  const t = useTheme();
  const ta = language === 'ta';

  const close = () => setSideMenuOpen(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const go = (path: string) => { close(); router.push(path as any); };

  if (!remoteConfig.sideMenuEnabled) return null;

  return (
    <Modal visible={sideMenuOpen} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View style={[styles.panel, { backgroundColor: t.surface }]}>
          <TouchableOpacity
            style={[styles.header, { backgroundColor: t.red }]}
            activeOpacity={0.9}
            onPress={() => go(remoteConfig.sideMenuShowProfile ? '/profile' : '/login')}
          >
            <Avatar uri={undefined} name={isAuthenticated ? (user?.name || user?.phone) : undefined} size={52} />
            <View style={{ marginTop: 12 }}>
              {isAuthenticated && user ? (
                <>
                  <Text style={styles.userName}>{user.name ?? user.phone}</Text>
                  <Text style={styles.userSub}>{ta ? 'சுயவிவரத்தை காண' : 'View profile'}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.userName}>{ta ? 'விருந்தினர்' : 'Guest'}</Text>
                  <Text style={styles.userSub}>{ta ? 'உள்நுழைய தட்டவும்' : 'Tap to login'}</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <ScrollView style={styles.items} showsVerticalScrollIndicator={false}>
            {CORE_ITEMS.map((item) => (
              <TouchableOpacity key={item.path} style={styles.item} onPress={() => go(item.path)}>
                <Icon name={item.icon} size={16} color={t.inkSub} />
                <Text style={[styles.itemLabel, { color: t.ink }]}>{ta ? item.labelTa : item.labelEn}</Text>
              </TouchableOpacity>
            ))}

            {remoteConfig.sideMenuShowBookmarks && (
              <TouchableOpacity style={styles.item} onPress={() => go('/bookmarks')}>
                <Icon name="bookmarkNav" size={16} color={t.inkSub} />
                <Text style={[styles.itemLabel, { color: t.ink }]}>{ta ? STRINGS.BOOKMARKS_TA : STRINGS.BOOKMARKS_EN}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.item} onPress={() => go('/settings')}>
              <Icon name="more" size={16} color={t.inkSub} />
              <Text style={[styles.itemLabel, { color: t.ink }]}>{ta ? STRINGS.SETTINGS_TA : STRINGS.SETTINGS_EN}</Text>
            </TouchableOpacity>

            {remoteConfig.sideMenuShowContact && (
              <TouchableOpacity style={styles.item} onPress={() => go('/contact')}>
                <Icon name="comment" size={16} color={t.inkSub} />
                <Text style={[styles.itemLabel, { color: t.ink }]}>{ta ? 'எங்களை தொடர்பு கொள்ள' : 'Contact Us'}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {(remoteConfig.sideMenuShowDarkMode || remoteConfig.sideMenuShowLanguage) && (
            <View style={[styles.footer, { borderTopColor: t.border }]}>
              {remoteConfig.sideMenuShowLanguage && (
                <View style={styles.footerRow}>
                  <Text style={[styles.footerLabel, { color: t.inkMuted }]}>{ta ? 'மொழி' : 'Language'}</Text>
                  <View style={styles.langToggle}>
                    <TouchableOpacity
                      style={[styles.langBtn, { borderColor: t.border }, language === 'ta' && { backgroundColor: t.red, borderColor: t.red }]}
                      onPress={() => setLanguage('ta')}
                    >
                      <Text style={[styles.langBtnText, { color: t.inkSub }, language === 'ta' && { color: '#fff' }]}>தமிழ்</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.langBtn, { borderColor: t.border }, language === 'en' && { backgroundColor: t.red, borderColor: t.red }]}
                      onPress={() => setLanguage('en')}
                    >
                      <Text style={[styles.langBtnText, { color: t.inkSub }, language === 'en' && { color: '#fff' }]}>EN</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {remoteConfig.sideMenuShowDarkMode && (
                <View style={styles.footerRow}>
                  <Text style={[styles.footerLabel, { color: t.inkMuted }]}>{ta ? 'இருண்ட தீம்' : 'Dark Mode'}</Text>
                  <Switch
                    value={colorScheme === 'dark'}
                    onValueChange={(v) => setColorScheme(v ? 'dark' : 'light')}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(28,25,23,0.5)' },
  panel: { width: '80%', maxWidth: 320, height: '100%' },
  header: { padding: 22, paddingTop: 54 },
  userName: { color: '#fff', fontFamily: FONT_FAMILIES.displayBold, fontSize: 16 },
  userSub: { color: 'rgba(255,255,255,0.75)', fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12, marginTop: 2 },
  items: { flex: 1, paddingVertical: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 22, paddingVertical: 13 },
  itemLabel: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 14.5 },
  footer: { borderTopWidth: 1, padding: 20, gap: 14 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 11, letterSpacing: 1 },
  langToggle: { flexDirection: 'row', gap: 6 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  langBtnText: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 12 },
});
