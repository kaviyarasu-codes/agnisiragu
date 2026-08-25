// src/components/feed/EdgeRail.tsx
// Structure A from the design (screen 1d) — a persistent 56px dark rail on
// the thumb edge carrying like/comment/share/more, a page counter, progress
// dots, and a quick-post FAB. Replaces the bottom tab bar entirely: primary
// navigation (Jobs / Saved / Archive / Categories / Settings…) now lives in
// the side menu (see SideMenu.tsx), reached from the header's ☰.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Icon from '@/components/icons/Icon';
import { FONT_FAMILIES } from '@/constants';

interface EdgeRailProps {
  width: number;
  liked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMore: () => void;
  index: number;
  total: number;
}

export default function EdgeRail({ width, liked, onLike, onComment, onShare, onMore, index, total }: EdgeRailProps) {
  return (
    <View style={[styles.rail, { width }]}>
      <TouchableOpacity style={styles.iconBtn} onPress={onLike} hitSlop={8}>
        <Icon name="like" size={19} color={liked ? '#CC1F2D' : '#fff'} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={onComment} hitSlop={8}>
        <Icon name="comment" size={19} color="#8a8480" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={onShare} hitSlop={8}>
        <Icon name="share" size={19} color="#8a8480" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={onMore} hitSlop={8}>
        <Icon name="more" size={19} color="#8a8480" />
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <Text style={styles.counter}>{index + 1} / {total}</Text>

      <View style={styles.dots}>
        <View style={styles.dotActive} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/post')} hitSlop={6}>
        <Icon name="postPlus" size={18} color="#CC1F2D" strokeWidth={1.9} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    backgroundColor: '#1C1917',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 20,
  },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  counter: {
    fontFamily: FONT_FAMILIES.uiSemiBold,
    fontSize: 9,
    color: '#57534E',
    letterSpacing: 1.5,
    transform: [{ rotate: '90deg' }],
    width: 40,
    textAlign: 'center',
  },
  dots: { flexDirection: 'column', gap: 5, alignItems: 'center', paddingTop: 8 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#3a3532' },
  dotActive: { width: 5, height: 16, borderRadius: 3, backgroundColor: '#CC1F2D' },
  fab: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 10,
  },
});
