// src/screens/OnboardingScreen.tsx
// Screen 2a — 3-slide onboarding carousel (skip / illustration / progress
// dashes / next). Finishes into /permission-location (not straight to Home,
// and not directly into /language-district) — location permission is asked
// for FIRST now, so its granted GPS fix can auto-select the reader's
// district on the very next screen instead of always defaulting to the top
// of the list (see LocationPermissionScreen.tsx's detectDistrictId).
//
// Slide content (image + Tamil/English title + description) is fully admin-
// controlled via App Configuration -> Onboarding Carousel in the admin panel
// (remoteConfig.onboardingSlides, GET /config) — falls back to the original
// hardcoded Tamil copy if the backend is unreachable on first launch.

import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/app.store';
import { FONT_FAMILIES } from '@/constants';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [slide, setSlide] = useState(0);
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { language, remoteConfig } = useAppStore();
  const SLIDES = remoteConfig.onboardingSlides;
  const isLast = slide === SLIDES.length - 1;

  function goNext() {
    if (!isLast) {
      scrollRef.current?.scrollTo({ x: (slide + 1) * SCREEN_WIDTH, animated: true });
      setSlide((s) => s + 1);
    } else {
      router.replace('/permission-location');
    }
  }

  function skip() {
    router.replace('/language-district');
  }

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      <View style={[styles.skipRow, { paddingTop: insets.top }]}>
        {!isLast ? (
          <Text style={[styles.skip, { color: t.inkMuted }]} onPress={skip}>
            {language === 'ta' ? 'தவிர்' : 'skip'}
          </Text>
        ) : <View style={{ height: 20 }} />}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            {s.imageUrl ? (
              <Image source={{ uri: s.imageUrl }} style={styles.illustration} contentFit="cover" />
            ) : (
              <SkeletonBlock style={styles.illustration} />
            )}
            <Text style={[styles.title, { color: t.ink }]}>
              {language === 'ta' ? s.titleTa : s.titleEn}
            </Text>
            <Text style={[styles.desc, { color: t.inkSub }]}>
              {language === 'ta' ? s.descTa : s.descEn}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: t.border },
                i === slide && [styles.dotActive, { backgroundColor: t.red }],
              ]}
            />
          ))}
        </View>
        <Button label="அடுத்து" onPress={goNext} variant="dark" style={{ width: '100%' }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 16 },
  skip: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  slide: { flex: 1, padding: 20 },
  illustration: { flex: 1, borderRadius: 14, marginVertical: 14 },
  title: { fontFamily: FONT_FAMILIES.displayExtraBold, fontSize: 26, lineHeight: 33, letterSpacing: -0.4 },
  desc: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 14.5, lineHeight: 26, marginTop: 10 },
  footer: { padding: 24, paddingTop: 4 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 22 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotActive: { width: 20, height: 5, borderRadius: 3 },
});
