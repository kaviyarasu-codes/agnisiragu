// src/screens/ProfileScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { patch } from '@/lib/api';
import { COLORS, STRINGS } from '@/constants';
import type { Language } from '@/types';

export default function ProfileScreen() {
  const { user, isAuthenticated, articleReadCount } = useAuthStore();
  const { language, setLanguage } = useAppStore();
  const { logout } = useAuth();
  const { data: categories } = useCategories();
  const [notifCategories, setNotifCategories] = useState<string[]>(
    user?.preferredLang ? [] : [],
  );
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isAuthenticated) {
    return (
      <View style={styles.guestContainer}>
        <Text style={styles.guestTitle}>
          சுயவிவரம் பார்க்க உள்நுழையவும்{'\n'}Login to view profile
        </Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
          <Text style={styles.loginButtonText}>
            {STRINGS.LOGIN_TA} / {STRINGS.LOGIN_EN}
          </Text>
        </TouchableOpacity>
        <View style={styles.readCountBox}>
          <Text style={styles.readCountLabel}>இலவச செய்திகள் படிக்கப்பட்டன / Free articles read</Text>
          <Text style={styles.readCountValue}>{articleReadCount} / 10</Text>
        </View>
      </View>
    );
  }

  async function handleLanguageToggle(lang: Language) {
    setLanguage(lang);
    try {
      await patch('/users/preferences', { preferredLang: lang });
    } catch {
      // best effort
    }
  }

  function toggleNotifCategory(id: string) {
    setNotifCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function handleLogout() {
    Alert.alert(
      `${STRINGS.LOGOUT_TA} / ${STRINGS.LOGOUT_EN}`,
      'வெளியேற விரும்புகிறீர்களா? / Are you sure you want to logout?',
      [
        { text: 'ரத்து / Cancel', style: 'cancel' },
        {
          text: `${STRINGS.LOGOUT_TA} / ${STRINGS.LOGOUT_EN}`,
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await logout();
            setLoggingOut(false);
            router.replace('/');
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Info */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name[0].toUpperCase() : user?.phone.slice(-2) ?? 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name ?? 'பயனர் / User'}</Text>
        <Text style={styles.userPhone}>{user?.phone}</Text>
        <View style={styles.readCountPill}>
          <Text style={styles.readCountPillText}>
            {articleReadCount} செய்திகள் படிக்கப்பட்டன / articles read
          </Text>
        </View>
      </View>

      {/* Language Preference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>மொழி / Language</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'ta' && styles.activeLangBtn]}
            onPress={() => handleLanguageToggle('ta')}
          >
            <Text style={[styles.langBtnText, language === 'ta' && styles.activeLangBtnText]}>
              தமிழ்
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.activeLangBtn]}
            onPress={() => handleLanguageToggle('en')}
          >
            <Text style={[styles.langBtnText, language === 'en' && styles.activeLangBtnText]}>
              English
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Preferences */}
      {categories && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            அறிவிப்பு விருப்பங்கள் / Notification Preferences
          </Text>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.notifRow}>
              <Text style={styles.notifLabel}>
                {language === 'ta' ? cat.nameTa : cat.nameEn}
              </Text>
              <Switch
                value={notifCategories.includes(cat.id)}
                onValueChange={() => toggleNotifCategory(cat.id)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          ))}
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color={COLORS.surface} />
        ) : (
          <Text style={styles.logoutButtonText}>
            {STRINGS.LOGOUT_TA} / {STRINGS.LOGOUT_EN}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: COLORS.background,
    gap: 20,
  },
  guestTitle: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  readCountBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  readCountLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  readCountValue: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    padding: 28,
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: COLORS.surface,
    fontSize: 28,
    fontWeight: '700',
  },
  userName: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  userPhone: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
  },
  readCountPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 6,
  },
  readCountPillText: {
    color: COLORS.surface,
    fontSize: 12,
  },
  section: {
    backgroundColor: COLORS.surface,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  activeLangBtn: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  langBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeLangBtnText: {
    color: COLORS.surface,
  },
  notifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notifLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  logoutButton: {
    margin: 16,
    marginTop: 20,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutButtonText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 15,
  },
});
