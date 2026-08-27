// app/(tabs)/_layout.tsx — bottom nav (design 1e's .nav: Home / Upload / Reports / Rewards)

import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILIES } from '@/constants';

function TabIcon({ focused, shape }: { focused: boolean; shape: 'home' | 'upload' | 'reports' | 'rewards' }) {
  const color = focused ? COLORS.primary : COLORS.inkLight;
  if (shape === 'upload') {
    return (
      <View style={[styles.uploadDot, { backgroundColor: COLORS.dark }]}>
        <View style={styles.plusV} />
        <View style={styles.plusH} />
      </View>
    );
  }
  return <View style={[styles.dot, { borderColor: color, backgroundColor: focused ? color : 'transparent' }]} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inkLight,
        tabBarStyle: { height: 58, borderTopColor: COLORS.border },
        tabBarLabelStyle: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.6 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon focused={focused} shape="home" /> }} />
      <Tabs.Screen name="upload" options={{ title: 'Upload', tabBarIcon: ({ focused }) => <TabIcon focused={focused} shape="upload" /> }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: ({ focused }) => <TabIcon focused={focused} shape="reports" /> }} />
      <Tabs.Screen name="rewards" options={{ title: 'Rewards', tabBarIcon: ({ focused }) => <TabIcon focused={focused} shape="rewards" /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dot: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5 },
  uploadDot: { width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  plusV: { position: 'absolute', width: 1.7, height: 9, backgroundColor: '#fff' },
  plusH: { position: 'absolute', width: 9, height: 1.7, backgroundColor: '#fff' },
});
