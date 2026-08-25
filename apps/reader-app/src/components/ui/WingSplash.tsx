// src/components/ui/WingSplash.tsx
// The design's looping splash animation (screen 1a, first frame): two brand
// feathers open and settle from either side, the logo fades in below them,
// and a thin progress bar fills — then the whole thing loops. Reproduces
// the CSS @keyframes wingL / wingR / spLogo / spBar from the .dc.html at
// the same 3.4s cadence, driven by react-native-reanimated (already a
// project dependency).

import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { FONT_FAMILIES } from '@/constants';

const DURATION = 3400;
// Keyframe stops, as fractions of the 3.4s cycle (matches @keyframes wingL/wingR in the design).
const STOPS = [0, 0.26, 0.4, 0.54, 0.66, 0.8, 1];

interface WingSplashProps {
  tagline?: string;
  bgColor?: string;
}

export default function WingSplash({ tagline = 'உங்கள் ஊர் செய்திகள்', bgColor = '#ffffff' }: WingSplashProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: DURATION, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progress]);

  const leftWingStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, STOPS, [46, -2, 9, -1, 6, 0, 3]);
    const scale = interpolate(progress.value, STOPS, [0.4, 1, 1, 1, 1, 1, 1.07]);
    const opacity = interpolate(progress.value, STOPS, [0, 1, 1, 1, 1, 1, 0]);
    return {
      opacity,
      transform: [{ translateX: 52 }, { rotate: `${rotate}deg` }, { scale }, { translateX: -52 }],
    };
  });

  const rightWingStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, STOPS, [-46, 2, -9, 1, -6, 0, -3]);
    const scale = interpolate(progress.value, STOPS, [0.4, 1, 1, 1, 1, 1, 1.07]);
    const opacity = interpolate(progress.value, STOPS, [0, 1, 1, 1, 1, 1, 0]);
    return {
      opacity,
      transform: [{ translateX: -52 }, { rotate: `${rotate}deg` }, { scale }, { translateX: 52 }],
    };
  });

  const logoStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.26, 0.48, 0.78, 1], [0, 0, 1, 1, 0]);
    const translateY = interpolate(progress.value, [0, 0.26, 0.48, 0.78, 1], [12, 12, 0, 0, -6]);
    return { opacity, transform: [{ translateY }] };
  });

  const barStyle = useAnimatedStyle(() => {
    const width = interpolate(progress.value, [0, 0.8, 1], [0, 100, 100]);
    const opacity = interpolate(progress.value, [0, 0.8, 1], [1, 1, 0]);
    return { width: `${width}%`, opacity };
  });

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.wingsRow}>
        <Animated.Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../../assets/wing-left.png')}
          style={[styles.wing, leftWingStyle]}
          resizeMode="contain"
        />
        <Animated.Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../../assets/wing.png')}
          style={[styles.wing, rightWingStyle]}
          resizeMode="contain"
        />
      </View>
      <Animated.View style={logoStyle}>
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, barStyle]} />
      </View>
      <Text style={styles.footer}>AGNISIRAGU NEWS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wingsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: 110 },
  wing: { width: 80, height: 104 },
  logo: { width: 158, height: 72, marginTop: 26 },
  tagline: {
    fontFamily: FONT_FAMILIES.bodyRegular,
    fontSize: 11.5,
    color: '#A8A29E',
    marginTop: 14,
    letterSpacing: 0.5,
  },
  barTrack: {
    position: 'absolute',
    bottom: 56,
    left: 70,
    right: 70,
    height: 2,
    backgroundColor: '#EFEBE5',
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#CC1F2D' },
  footer: {
    position: 'absolute',
    bottom: 24,
    fontFamily: FONT_FAMILIES.uiSemiBold,
    fontSize: 9,
    color: '#C5BFB8',
    letterSpacing: 2,
  },
});
