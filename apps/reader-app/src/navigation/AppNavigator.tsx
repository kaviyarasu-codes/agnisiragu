// src/navigation/AppNavigator.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { COLORS, STRINGS } from '@/constants';
import { useAppStore } from '@/store/app.store';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>{name}</Text>
  );
}

export default function AppNavigator() {
  const { language } = useAppStore();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.primary,
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: COLORS.surface,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.surface,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: language === 'ta' ? STRINGS.HOME_TA : STRINGS.HOME_EN,
          headerTitle: `${STRINGS.APP_NAME_TA} | ${STRINGS.APP_NAME_EN}`,
          tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: language === 'ta' ? STRINGS.CATEGORIES_TA : STRINGS.CATEGORIES_EN,
          headerTitle: `${STRINGS.CATEGORIES_TA} / ${STRINGS.CATEGORIES_EN}`,
          tabBarIcon: ({ focused }) => <TabIcon name="📂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: language === 'ta' ? STRINGS.SEARCH_TA : STRINGS.SEARCH_EN,
          headerTitle: `${STRINGS.SEARCH_TA} / ${STRINGS.SEARCH_EN}`,
          tabBarIcon: ({ focused }) => <TabIcon name="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: language === 'ta' ? STRINGS.PROFILE_TA : STRINGS.PROFILE_EN,
          headerTitle: `${STRINGS.PROFILE_TA} / ${STRINGS.PROFILE_EN}`,
          tabBarIcon: ({ focused }) => <TabIcon name="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
