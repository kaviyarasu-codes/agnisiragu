// src/components/feed/BottomNav.tsx
// Persistent bottom bar shown on the Home feed. Per an explicit product
// decision, the order is Archive / Jobs / Post / Lives / Saved (not the
// design file's original Jobs/Post/Saved/Archive order) — Post stays the
// visually-highlighted center-ish action, "Lives" reuses the existing
// reels/shorts stub screen.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import Icon, { IconName } from '@/components/icons/Icon';

export type NavTab = 'home' | 'jobs' | 'post' | 'lives' | 'archive';

interface BottomNavProps {
  active?: NavTab;
}

// Order per product owner: Home / Jobs / Post / Lives / Archive.
// (Saved articles remain reachable from the side menu.)
const ITEMS: { key: NavTab; label: string; route: string; icon: IconName }[] = [
  { key: 'home', label: 'Home', route: '/', icon: 'home' },
  { key: 'jobs', label: 'Jobs', route: '/jobs', icon: 'jobsBriefcase' },
  { key: 'post', label: 'Post', route: '/post', icon: 'postPlus' },
  { key: 'lives', label: 'Lives', route: '/reels', icon: 'live' },
  { key: 'archive', label: 'Archive', route: '/archive', icon: 'archiveBox' },
];

export default function BottomNav({ active = 'home' }: BottomNavProps) {
  const t = useTheme();

  return (
    <View style={[styles.nav, { backgroundColor: t.surface, borderTopColor: t.border }]}>
      {ITEMS.map((item) => {
        const isPost = item.key === 'post';
        const isActive = active === item.key;
        const color = isPost || isActive ? t.red : t.inkMuted;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navi}
            onPress={() => router.push(item.route)}
            hitSlop={4}
          >
            <Icon name={item.icon} size={isPost ? 22 : 17} color={color} />
            <Text style={[styles.label, { color }]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: 52,
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  navi: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontFamily: FONT_FAMILIES.uiSemiBold,
    fontSize: 9.5,
    letterSpacing: 0.3,
  },
});
