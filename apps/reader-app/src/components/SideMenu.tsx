// src/components/SideMenu.tsx
// Slide-out drawer controlled by App Config → Side Menu (admin can toggle
// which links appear). Triggered from the hamburger icon on the Home header.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { COLORS, STRINGS } from '@/constants';

export default function SideMenu() {
  const { sideMenuOpen, setSideMenuOpen, remoteConfig, language, setLanguage, colorScheme, setColorScheme } = useAppStore();
  const { isAuthenticated, user } = useAuthStore();
  const ta = language === 'ta';

  const close = () => setSideMenuOpen(false);
  const go = (path: string) => { close(); router.push(path as any); };

  if (!remoteConfig.sideMenuEnabled) return null;

  return (
    <Modal visible={sideMenuOpen} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{STRINGS.APP_NAME_TA}</Text>
            <Text style={styles.headerSubtitle}>{STRINGS.APP_NAME_EN}</Text>
            {isAuthenticated && user && (
              <Text style={styles.userName}>{user.name ?? user.phone}</Text>
            )}
          </View>

          <View style={styles.items}>
            {remoteConfig.sideMenuShowProfile && (
              <TouchableOpacity style={styles.item} onPress={() => go('/(tabs)/profile')}>
                <Text style={styles.itemEmoji}>👤</Text>
                <Text style={styles.itemLabel}>{ta ? STRINGS.PROFILE_TA : STRINGS.PROFILE_EN}</Text>
              </TouchableOpacity>
            )}
            {remoteConfig.sideMenuShowBookmarks && (
              <TouchableOpacity style={styles.item} onPress={() => go('/(tabs)/bookmarks')}>
                <Text style={styles.itemEmoji}>🔖</Text>
                <Text style={styles.itemLabel}>{ta ? STRINGS.BOOKMARKS_TA : STRINGS.BOOKMARKS_EN}</Text>
              </TouchableOpacity>
            )}
            {remoteConfig.sideMenuShowContact && (
              <TouchableOpacity style={styles.item} onPress={() => go('/contact')}>
                <Text style={styles.itemEmoji}>✉️</Text>
                <Text style={styles.itemLabel}>{ta ? 'எங்களை தொடர்பு கொள்ள' : 'Contact Us'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {(remoteConfig.sideMenuShowDarkMode || remoteConfig.sideMenuShowLanguage) && (
            <View style={styles.footer}>
              {remoteConfig.sideMenuShowLanguage && (
                <View style={styles.footerRow}>
                  <Text style={styles.footerLabel}>{ta ? 'மொழி' : 'Language'}</Text>
                  <View style={styles.langToggle}>
                    <TouchableOpacity
                      style={[styles.langBtn, language === 'ta' && styles.langBtnActive]}
                      onPress={() => setLanguage('ta')}>
                      <Text style={[styles.langBtnText, language === 'ta' && styles.langBtnTextActive]}>தமிழ்</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                      onPress={() => setLanguage('en')}>
                      <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>EN</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {remoteConfig.sideMenuShowDarkMode && (
                <View style={styles.footerRow}>
                  <Text style={styles.footerLabel}>{ta ? 'இருண்ட தீம்' : 'Dark Mode'}</Text>
                  <TouchableOpacity
                    style={[styles.langBtn, colorScheme === 'dark' && styles.langBtnActive]}
                    onPress={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}>
                    <Text style={[styles.langBtnText, colorScheme === 'dark' && styles.langBtnTextActive]}>
                      {colorScheme === 'dark' ? (ta ? 'ஆன்' : 'On') : (ta ? 'ஆஃப்' : 'Off')}
                    </Text>
                  </TouchableOpacity>
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
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    width: '78%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: COLORS.surface,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 24,
    paddingTop: 56,
  },
  headerTitle: {
    color: COLORS.surface,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 2,
  },
  userName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
  },
  items: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  itemEmoji: {
    fontSize: 18,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 20,
    gap: 14,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  langToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  langBtnTextActive: {
    color: COLORS.surface,
  },
});
