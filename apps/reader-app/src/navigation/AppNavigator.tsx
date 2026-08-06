// src/navigation/AppNavigator.tsx
// Style: Dailyhunt / Tamil Samayam — white tab bar, red active, icon + label

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { STRINGS } from '@/constants';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

function TabIcon({ emoji, label, focused }: TabIconProps) {
  const t = useTheme();
  return (
    <View style={ti.wrap}>
      {focused && <View style={[ti.indicator, { backgroundColor: t.red }]} />}
      <Text style={[ti.emoji, { opacity: focused ? 1 : 0.4 }]}>{emoji}</Text>
      <Text style={[ti.label, { color: focused ? t.red : t.inkMuted }]}>{label}</Text>
    </View>
  );
}

export default function AppNavigator() {
  const { language } = useAppStore();
  const t = useTheme();
  const ta = language === 'ta';

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
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label={ta ? STRINGS.HOME_TA : STRINGS.HOME_EN} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          headerTitle: ta ? STRINGS.CATEGORIES_TA : STRINGS.CATEGORIES_EN,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" label={ta ? STRINGS.CATEGORIES_TA : STRINGS.CATEGORIES_EN} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          headerTitle: ta ? STRINGS.SEARCH_TA : STRINGS.SEARCH_EN,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" label={ta ? STRINGS.SEARCH_TA : STRINGS.SEARCH_EN} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          headerTitle: ta ? 'சேமிக்கப்பட்டவை' : 'Saved',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔖" label={ta ? 'சேமிப்பு' : 'Saved'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerTitle: ta ? STRINGS.PROFILE_TA : STRINGS.PROFILE_EN,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label={ta ? STRINGS.PROFILE_TA : STRINGS.PROFILE_EN} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

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
