// app/onboarding.tsx — Onboarding (design 1b)
// 3-slide explainer: capture+voice → AI text → editor review. Slide 2's
// copy is taken verbatim from the design; slides 1 & 3 are written to match
// its tone since the mockup only showed one slide in detail.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import PlaceholderBox from '@/components/PlaceholderBox';
import Button from '@/components/Button';
import { COLORS, FONT_FAMILIES } from '@/constants';
import { setOnboardingDone } from '@/lib/storage';

const SLIDES = [
  {
    illustration: 'onboarding illustration 1 / 3',
    headlineTa: 'படம் எடுங்கள், வீடியோ பிடிக்கவும்',
    bodyTa: 'உங்கள் பகுதியில் நடக்கும் செய்தியை புகைப்படமாகவோ வீடியோவாகவோ பதிவு செய்யுங்கள்.',
  },
  {
    illustration: 'onboarding illustration 2 / 3',
    headlineTa: 'பேசுங்கள் — மற்றதை நாங்கள் பார்க்கிறோம்',
    bodyTa: 'படம் எடுங்கள், குரலில் சொல்லுங்கள். உங்கள் குரல் தானாக எழுத்தாக மாறும். ஆசிரியர் சரிபார்த்ததும் செய்தி வெளியாகும்.',
  },
  {
    illustration: 'onboarding illustration 3 / 3',
    headlineTa: 'ஒப்புதல் பெறுந்தோறும் வெகுமதி',
    bodyTa: 'ஒவ்வொரு ஒப்புதல் பெற்ற செய்திக்கும் புள்ளிகள். வாரம் முடிந்ததும் பணமாகப் பெறலாம்.',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  async function handleNext() {
    if (isLast) {
      await setOnboardingDone();
      router.replace('/register');
      return;
    }
    setStep((s) => s + 1);
  }

  async function handleSkip() {
    await setOnboardingDone();
    router.replace('/register');
  }

  return (
    <View style={styles.root}>
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skip}>skip</Text>
        </TouchableOpacity>
      </View>

      <PlaceholderBox label={slide.illustration} style={styles.illustration} />

      <Text style={styles.headline}>{slide.headlineTa}</Text>
      <Text style={styles.body}>{slide.bodyTa}</Text>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <Button label="அடுத்து" variant="dark" onPress={handleNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 22,
    paddingTop: 60,
  },
  skipRow: {
    alignItems: 'flex-end',
  },
  skip: {
    fontFamily: FONT_FAMILIES.condensedBold,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.inkLight,
  },
  illustration: {
    flex: 1,
    marginVertical: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontFamily: FONT_FAMILIES.displayExtraBold,
    fontSize: 25,
    lineHeight: 32,
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: FONT_FAMILIES.bodyRegular,
    fontSize: 14,
    lineHeight: 24,
    color: COLORS.inkSecondary,
    marginTop: 10,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 22,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
});
