// src/components/feed/SwipeHintOverlay.tsx
// One-time hint shown the first time a new user lands on the feed, teaching
// the page-flip gesture — per the high-fidelity design spec, a small
// floating pill bottom-right over the page stack (prev/next chevrons + a
// "flip" label), pointer-events none so it never blocks touches, with a
// gentle side-to-side nudge to draw the eye. Auto-dismisses after a few
// seconds, or the instant the user performs their own first flip (see
// SwipeFeed's go() calling dismiss()). "Shown once" state persists via
// SecureStore, same pattern as the notification/location permission
// screens (STORAGE_KEYS.*_ASKED).

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import Icon from '@/components/icons/Icon';
import type { Language } from '@/types';

interface Props {
  visible: boolean;
  language: Language;
  onDismiss: () => void;
}

export default function SwipeHintOverlay({ visible, language, onDismiss }: Props) {
  const t = useTheme();
  const shift = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return undefined;

    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shift, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(shift, { toValue: 0, duration: 550, useNativeDriver: true }),
        Animated.delay(500),
      ]),
    );
    loop.start();

    const timer = setTimeout(onDismiss, 4200);
    return () => {
      loop.stop();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const shiftDistance = shift.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  // pointerEvents="none" — this hint never captures touch itself, so a real
  // flip gesture anywhere on the page stack still reaches SwipeFeed's
  // PanResponder and dismisses the hint via go() calling dismissSwipeHint().
  return (
    <Animated.View style={[styles.wrap, { opacity: fade }]} pointerEvents="none">
      <Animated.View style={[styles.pill, { backgroundColor: 'rgba(28,25,23,0.82)', transform: [{ translateX: shiftDistance }] }]}>
        <Icon name="back" size={11} color="rgba(255,255,255,0.75)" />
        <Text style={styles.label}>{language === 'ta' ? 'புரட்டவும்' : 'flip'}</Text>
        <View style={styles.chevronRight}>
          <Icon name="chevronRight" size={11} color="#fff" />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    zIndex: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  label: {
    color: '#fff',
    fontFamily: FONT_FAMILIES.uiSemiBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  chevronRight: { marginLeft: 1 },
});
