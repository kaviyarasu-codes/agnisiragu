// src/navigation/AppNavigator.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { COLORS, STRINGS } from '@/constants';
import { useAppStore } from '@/store/app.store';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[ti.wrap, focused && ti.wrapActive]}>
      <Text style={[ti.emoji, focused && ti.emojiActive]}>{emoji}</Text>
    </View>
  );
}

export default function AppNavigator() {
  const { language } = useAppStore();
  const ta = language === 'ta';

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 62,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.inkLight,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.1,
          marginTop: 1,
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          elevation: 0,
          shadowOpacity: 0,
        } as any,
        headerTintColor: COLORS.ink,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: COLORS.primary,
          letterSpacing: -0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: ta ? STRINGS.HOME_TA : STRINGS.HOME_EN,
          headerTitle: STRINGS.APP_NAME_TA,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: ta ? STRINGS.CATEGORIES_TA : STRINGS.CATEGORIES_EN,
          headerTitle: ta ? STRINGS.CATEGORIES_TA : STRINGS.CATEGORIES_EN,
          tabBarIcon: ({ focused }) => <TabIcon emoji="📂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: ta ? STRINGS.SEARCH_TA : STRINGS.SEARCH_EN,
          headerTitle: ta ? STRINGS.SEARCH_TA : STRINGS.SEARCH_EN,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: ta ? 'சேமிப்பு' : 'Saved',
          headerTitle: ta ? 'சேமிக்கப்பட்டவை' : 'Saved',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: ta ? STRINGS.PROFILE_TA : STRINGS.PROFILE_EN,
          headerTitle: ta ? STRINGS.PROFILE_TA : STRINGS.PROFILE_EN,
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const ti = StyleSheet.create({
  wrap: {
    width: 38, height: 28,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 14,
  },
  wrapActive: { backgroundColor: '#FFE8E9' },
  emoji: { fontSize: 19, opacity: 0.4 },
  emojiActive: { opacity: 1 },
});
