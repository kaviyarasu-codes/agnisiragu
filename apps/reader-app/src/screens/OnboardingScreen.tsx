// src/screens/OnboardingScreen.tsx
// Screen 2a — 3-slide onboarding carousel (skip / illustration / progress
// dashes / next). Finishes into /language-district rather than straight to
// Home, since district selection is now its own step (see 1a's setup screen).

import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  { title: 'உங்கள் ஊரின் செய்தி, உடனே', desc: 'உங்கள் மாவட்டத்தில் நடப்பதை முதலில் தெரிந்து கொள்ளுங்கள். சரிபார்க்கப்பட்ட செய்திகள் மட்டும்.' },
  { title: 'உள்ளூர் மக்களே நிருபர்கள்', desc: 'உங்கள் பகுதியில் நடப்பதை நீங்களே பதிவு செய்யலாம் — ஆசிரியர் குழு சரிபார்த்த பிறகு உடனே வெளியிடப்படும்.' },
  { title: 'எழுதி சம்பாதியுங்கள்', desc: 'தொடர்ந்து செய்தி அளிக்கும் நிருபர்களுக்கு புள்ளிகள் மற்றும் அதிகாரப்பூர்வ பத்திரிகையாளர் அடையாள அட்டை.' },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [slide, setSlide] = useState(0);
  const t = useTheme();
  const isLast = slide === SLIDES.length - 1;

  function goNext() {
    if (!isLast) {
      scrollRef.current?.scrollTo({ x: (slide + 1) * SCREEN_WIDTH, animated: true });
      setSlide((s) => s + 1);
    } else {
      router.replace('/language-district');
    }
  }

  function skip() {
    router.replace('/language-district');
  }

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      <View style={styles.skipRow}>
        {!isLast ? (
          <Text style={[styles.skip, { color: t.inkMuted }]} onPress={skip}>skip</Text>
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
            <SkeletonBlock style={styles.illustration} />
            <Text style={[styles.title, { color: t.ink }]}>{s.title}</Text>
            <Text style={[styles.desc, { color: t.inkSub }]}>{s.desc}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
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
