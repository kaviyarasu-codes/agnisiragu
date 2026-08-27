// src/components/feed/SwipeHintOverlay.tsx
// One-time animated hint shown the first time a new user lands on the feed,
// teaching the left/right swipe-to-turn-page gesture (item #3 of the redesign
// brief). Auto-dismisses after a few loops, on tap, or the instant the user
// performs their own first swipe (see SwipeFeed's onMomentumEnd calling
// dismiss()). "Shown once" state persists via SecureStore, same pattern as
// the notification/location permission screens (STORAGE_KEYS.*_ASKED).

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
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
        Animated.timing(shift, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(shift, { toValue: -1, duration: 900, useNativeDriver: true }),
        Animated.timing(shift, { toValue: 0, duration: 450, useNativeDriver: true }),
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

  const translateX = shift.interpolate({ inputRange: [-1, 0, 1], outputRange: [-26, 0, 26] });
  const rotate = shift.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-18deg', '0deg', '18deg'] });

  // pointerEvents="box-none" on the full-screen wrapper means the overlay
  // itself is invisible to touch — only the small card below captures taps
  // — so a real swipe anywhere on the feed still reaches the FlatList
  // underneath and dismisses the hint via onMomentumEnd (see SwipeFeed).
  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={[styles.card, { backgroundColor: t.ink }]}>
          <Animated.View style={[styles.hand, { transform: [{ translateX }, { rotate }] }]}>
            <Text style={styles.handGlyph}>☝</Text>
          </Animated.View>
          <Text style={styles.text}>
            {language === 'ta'
              ? 'புத்தகம் புரட்டுவது போல் இடமிருந்து வலமாக ஸ்வைப் செய்யவும்'
              : 'Swipe left or right — like turning a page'}
          </Text>
          <Text style={styles.tapAway}>{language === 'ta' ? 'தொட்டு மூடவும்' : 'tap to dismiss'}</Text>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 96,
    zIndex: 20,
  },
  card: {
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 22,
    maxWidth: 280,
  },
  hand: { marginBottom: 8 },
  handGlyph: { fontSize: 30 },
  text: {
    color: '#fff',
    fontFamily: FONT_FAMILIES.displaySemiBold,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
  },
  tapAway: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: FONT_FAMILIES.uiMedium,
    fontSize: 10.5,
    marginTop: 8,
  },
});
