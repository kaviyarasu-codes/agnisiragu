// src/navigation/AppNavigator.tsx
// Style: Dailyhunt / Tamil Samayam — white tab bar, red active, icon + label

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { STRINGS } from '@/constants';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
  showLabel: boolean;
}

function TabIcon({ emoji, label, focused, showLabel }: TabIconProps) {
  const t = useTheme();
  return (
    <View style={ti.wrap}>
      {focused && <View style={[ti.indicator, { backgroundColor: t.red }]} />}
      <Text style={[ti.emoji, { opacity: focused ? 1 : 0.4 }]}>{emoji}</Text>
      {showLabel && <Text style={[ti.label, { color: focused ? t.red : t.inkMuted }]}>{label}</Text>}
    </View>
  );
}

const TAB_ICONS: Record<string, string> = {
  home: '🏠',
  categories: '📋',
  search: '🔍',
  bookmarks: '🔖',
  profile: '👤',
};

export default function AppNavigator() {
  const { language, remoteConfig, setSideMenuOpen } = useAppStore();
  const t = useTheme();
  const ta = language === 'ta';
  const showLabels = remoteConfig.navShowLabels ?? true;
  const menuEnabled = remoteConfig.sideMenuEnabled ?? true;

  // navTabs from admin config (key/labelTa/labelEn/visible); falls back to
  // showing every tab with its built-in default label when unset.
  const tabMeta = (key: string, fallbackTa: string, fallbackEn: string) => {
    const cfg = remoteConfig.navTabs?.find((tItem: any) => tItem.key === key);
    return {
      visible: cfg?.visible ?? true,
      label: ta ? (cfg?.labelTa || fallbackTa) : (cfg?.labelEn || fallbackEn),
    };
  };

  const home = tabMeta('home', STRINGS.HOME_TA, STRINGS.HOME_EN);
  const categories = tabMeta('categories', STRINGS.CATEGORIES_TA, STRINGS.CATEGORIES_EN);
  const search = tabMeta('search', STRINGS.SEARCH_TA, STRINGS.SEARCH_EN);
  const bookmarks = tabMeta('bookmarks', 'சேமிப்பு', 'Saved');
  const profile = tabMeta('profile', STRINGS.PROFILE_TA, STRINGS.PROFILE_EN);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopWidth: 1,
          borderTopColor: t.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 0,
        },
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: t.surface,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
          elevation: 0,
          shadowOpacity: 0,
        } as any,
        headerTintColor: t.ink,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
          color: t.red,
          letterSpacing: -0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: 'அக்னிசிறகு',
          href: home.visible ? undefined : null,
          headerLeft: menuEnabled
            ? () => (
                <TouchableOpacity
                  onPress={() => setSideMenuOpen(true)}
                  style={hb.button}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={hb.icon}>☰</Text>
                </TouchableOpacity>
              )
            : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={TAB_ICONS.home} label={home.label} focused={focused} showLabel={showLabels} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          headerTitle: categories.label,
          href: categories.visible ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={TAB_ICONS.categories} label={categories.label} focused={focused} showLabel={showLabels} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          headerTitle: search.label,
          href: search.visible ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={TAB_ICONS.search} label={search.label} focused={focused} showLabel={showLabels} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          headerTitle: ta ? 'சேமிக்கப்பட்டவை' : 'Saved',
          href: bookmarks.visible ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={TAB_ICONS.bookmarks} label={bookmarks.label} focused={focused} showLabel={showLabels} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: profile.label,
          href: profile.visible ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={TAB_ICONS.profile} label={profile.label} focused={focused} showLabel={showLabels} />
          ),
        }}
      />
    </Tabs>
  );
}

const hb = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  icon: {
    fontSize: 22,
  },
});

const ti = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    width: 64,
    gap: 3,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  emoji: { fontSize: 20 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.1, textAlign: 'center' },
});
