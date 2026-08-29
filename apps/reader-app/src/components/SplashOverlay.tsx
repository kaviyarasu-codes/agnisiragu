// src/components/SplashOverlay.tsx
// A JS-rendered splash shown right after the native launch screen hides,
// while the app finishes its bootstrap fetches. Configurable from App
// Config → Splash Screen. This does NOT replace the OS-level launch image
// baked into the native build (app.json's expo-splash-screen plugin) —
// that one can't be changed remotely without a new build.
//
// remoteConfig.splashAnimation === 'wings' renders the design's looping
// feather animation (WingSplash); 'fade' and 'none' keep the original
// logo + tagline treatment, only differing in how the overlay itself exits.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { useAppStore } from '@/store/app.store';
import WingSplash from '@/components/ui/WingSplash';

export default function SplashOverlay() {
  const { remoteConfig, configLoaded, language } = useAppStore();
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!configLoaded) return;
    const timer = setTimeout(() => {
      if (remoteConfig.splashAnimation === 'none') {
        setVisible(false);
      } else {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
          setVisible(false),
        );
      }
    }, remoteConfig.splashDurationMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configLoaded, remoteConfig.splashDurationMs, remoteConfig.splashAnimation]);

  if (!visible) return null;

  if (remoteConfig.splashAnimation === 'wings') {
    return (
      <Animated.View style={[styles.container, { opacity }]}>
        <WingSplash
          bgColor={remoteConfig.splashBgColor}
          tagline={remoteConfig.splashShowTagline
            ? (language === 'ta' ? remoteConfig.splashTaglineTa : remoteConfig.splashTaglineEn)
            : undefined}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: remoteConfig.splashBgColor, opacity }]}
    >
      {remoteConfig.splashLogoUrl ? (
        <Image source={{ uri: remoteConfig.splashLogoUrl }} style={styles.logo} resizeMode="contain" />
      ) : (
        // logo.png (not assets/splash.png, a full-screen portrait canvas
        // meant for a different purpose, and not the old logo-source.png.png,
        // which was a much lower-resolution export of the same mark and
        // rendered visibly blurry once scaled up — this is the same crisp
        // asset used in the header and the wings splash animation below).
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      )}
      {remoteConfig.splashShowTagline && (
        <Text style={styles.tagline}>
          {language === 'ta' ? remoteConfig.splashTaglineTa : remoteConfig.splashTaglineEn}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // logo.png is a wide wordmark (not square, unlike the old asset) —
  // width/height sized to its ~2.2:1 aspect ratio so "contain" doesn't
  // leave large empty top/bottom bands inside the box.
  logo: {
    width: 200,
    height: 90,
  },
  tagline: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
