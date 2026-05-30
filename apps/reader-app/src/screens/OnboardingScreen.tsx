// src/screens/OnboardingScreen.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Switch,
  Alert,
  Image,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/app.store';
import { COLORS, STRINGS } from '@/constants';
import type { Category } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_SLIDES = 3;

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const { data: categories } = useCategories();
  const { language } = useAppStore();

  function goNext() {
    if (currentSlide < TOTAL_SLIDES - 1) {
      scrollRef.current?.scrollTo({ x: (currentSlide + 1) * SCREEN_WIDTH, animated: true });
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleFinish();
    }
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function requestNotificationPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
    if (status !== 'granted') {
      Alert.alert(
        'அறிவிப்புகள் / Notifications',
        'அமைப்புகளில் அறிவிப்புகளை இயக்கலாம் / You can enable notifications in Settings',
      );
    }
  }

  function handleFinish() {
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentSlide(index);
        }}
      >
        {/* Slide 1: Welcome */}
        <View style={[styles.slide, styles.slide1]}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.slideDesc}>
            உங்கள் கை நுனியில் தமிழ் செய்திகள்{'\n'}Tamil news at your fingertips
          </Text>
        </View>

        {/* Slide 2: Category Selection */}
        <View style={[styles.slide, styles.slide2]}>
          <Text style={styles.slideTitle}>உங்கள் விருப்பங்கள்</Text>
          <Text style={styles.slideTitleEn}>Choose Your Interests</Text>
          <Text style={styles.slideDesc}>
            விரும்பும் பிரிவுகளை தேர்ந்தெடுங்கள்{'\n'}Select categories you care about
          </Text>
          <ScrollView
            style={styles.catScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.catGrid}
          >
            {(categories ?? []).map((cat: Category) => {
              const isSelected = selectedCategories.includes(cat.id);
              const name = language === 'ta' ? cat.nameTa : cat.nameEn;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, isSelected && styles.catChipActive]}
                  onPress={() => toggleCategory(cat.id)}
                >
                  <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Slide 3: Notifications */}
        <View style={[styles.slide, styles.slide3]}>
          <Text style={styles.bigEmoji}>🔔</Text>
          <Text style={styles.slideTitle}>அறிவிப்புகள்</Text>
          <Text style={styles.slideTitleEn}>Notifications</Text>
          <Text style={styles.slideDesc}>
            முக்கிய செய்திகளுக்கு அறிவிப்புகள் பெறுங்கள்{'\n'}
            Get notified about breaking news
          </Text>
          <View style={styles.notifRow}>
            <Text style={styles.notifLabel}>
              அறிவிப்புகளை இயக்கு / Enable Notifications
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={(v) => {
                if (v) requestNotificationPermission();
                else setNotificationsEnabled(false);
              }}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>
        </View>
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <View key={i} style={[styles.dot, i === currentSlide && styles.activeDot]} />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        {currentSlide < TOTAL_SLIDES - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleFinish}>
            <Text style={styles.skipText}>தவிர் / Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextButton} onPress={goNext}>
          <Text style={styles.nextText}>
            {currentSlide === TOTAL_SLIDES - 1
              ? 'தொடங்கு / Start'
              : 'அடுத்து / Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  slide1: {},
  slide2: {
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  slide3: {},
  logo: {
    width: 260,
    height: 120,
    marginBottom: 24,
  },
  bigEmoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  slideTitleEn: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDesc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  catScrollView: {
    width: '100%',
    maxHeight: 320,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  catChipTextActive: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginRight: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
    justifyContent: 'flex-end',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  skipText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  nextButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 15,
  },
});
