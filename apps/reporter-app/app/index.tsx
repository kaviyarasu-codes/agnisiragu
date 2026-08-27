// app/index.tsx — Splash (design 1a)
// Dark tool chrome, animated brand wings + logo, red "reporter" chip.
// Phase 1: always routes to onboarding after the animation. Phase 2 TODO:
// check getToken()/isRegistered and route to (tabs), account-status,
// register, or onboarding accordingly — same shape as the reader app's
// AppBootstrap in app/_layout.tsx.

import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { COLORS, FONT_FAMILIES, STRINGS } from '@/constants';

export default function SplashScreen() {
  const wingL = useRef(new Animated.Value(0)).current;
  const wingR = useRef(new Animated.Value(0)).current;
  const logo = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(wingL, { toValue: 1, duration: 650, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.timing(wingR, { toValue: 1, duration: 650, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      ]),
      Animated.timing(logo, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.timing(bar, { toValue: 1, duration: 1400, delay: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();

    const t = setTimeout(() => router.replace('/onboarding'), 1900);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.wings}>
        <Animated.Image
          source={require('../assets/wing-left.png')}
          style={[
            styles.wing,
            {
              opacity: wingL,
              transform: [
                { scale: wingL.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                { rotate: wingL.interpolate({ inputRange: [0, 1], outputRange: ['30deg', '0deg'] }) },
              ],
            },
          ]}
        />
        <Animated.Image
          source={require('../assets/wing.png')}
          style={[
            styles.wing,
            {
              opacity: wingR,
              transform: [
                { scale: wingR.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                { rotate: wingR.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] }) },
              ],
            },
          ]}
        />
      </View>
      <Animated.Image
        source={require('../assets/logo.png')}
        style={[styles.logo, { opacity: logo, transform: [{ translateY: logo.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}
      />
      <Text style={styles.chip}>{STRINGS.ROLE_TA.toLowerCase()} · reporter</Text>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
      <Text style={styles.foot}>CITIZEN JOURNALISM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wings: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 104,
  },
  wing: {
    height: 96,
    width: 72,
    resizeMode: 'contain',
  },
  logo: {
    width: 150,
    height: 40,
    resizeMode: 'contain',
    marginTop: 24,
    tintColor: '#fff',
  },
  chip: {
    fontFamily: FONT_FAMILIES.condensedBold,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: COLORS.primary,
    marginTop: 14,
  },
  barTrack: {
    position: 'absolute',
    bottom: 56,
    left: 70,
    right: 70,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  foot: {
    position: 'absolute',
    bottom: 24,
    fontFamily: FONT_FAMILIES.uiSemiBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
  },
});
