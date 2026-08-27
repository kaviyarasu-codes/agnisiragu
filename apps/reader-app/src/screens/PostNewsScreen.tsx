// src/screens/PostNewsScreen.tsx
// Screen 1a's post-news form — citizen quick-post reachable from the edge
// rail's FAB. Submits to POST /reports/citizen as multipart form data; this
// endpoint name is a best-effort placeholder (the reporting/verification
// pipeline lives on the Reporter App backend module, which this build didn't
// have visibility into) — confirm the real route with the backend team and
// update the `submitCitizenReport` call below if it differs. The screen
// still: captures photo/video, headline, content, category, and
// auto-detected location the same way the design's 1a form does.

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image as RNImage, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES, DISTRICTS } from '@/constants';
import { post } from '@/lib/api';
import TextField from '@/components/ui/TextField';
import Chip, { Caption } from '@/components/ui/Chip';
import Button from '@/components/ui/Button';
import Icon from '@/components/icons/Icon';

interface PickedMedia {
  uri: string;
  type: 'image' | 'video';
}

async function submitCitizenReport(payload: {
  headline: string;
  content: string;
  categoryId: string;
  districtId: string | null;
  media: PickedMedia | null;
}): Promise<void> {
  const form = new FormData();
  form.append('headline', payload.headline);
  form.append('content', payload.content);
  form.append('categoryId', payload.categoryId);
  if (payload.districtId) form.append('districtId', payload.districtId);
  if (payload.media) {
    const filename = payload.media.uri.split('/').pop() ?? `upload.${payload.media.type === 'video' ? 'mp4' : 'jpg'}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.append('media', { uri: payload.media.uri, name: filename, type: payload.media.type === 'video' ? 'video/mp4' : 'image/jpeg' } as any);
  }
  await post('/reports/citizen', form);
}

export default function PostNewsScreen() {
  const t = useTheme();
  const { language, district } = useAppStore();
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories } = useCategories();
  const insets = useSafeAreaInsets();

  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locating, setLocating] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationLabel(null);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [place] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        const label = [place?.city ?? place?.subregion, place?.region].filter(Boolean).join(', ');
        setLocationLabel(label || null);
      } catch {
        setLocationLabel(null);
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  const districtLabel = DISTRICTS.find((d) => d.id === district);

  async function pickMedia() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setMedia({ uri: asset.uri, type: asset.type === 'video' ? 'video' : 'image' });
    }
  }

  async function handleSubmit() {
    if (!headline.trim() || !content.trim()) {
      Alert.alert('பிழை', 'தலைப்பு மற்றும் விவரம் அவசியம்');
      return;
    }
    if (!categoryId) {
      Alert.alert('பிழை', 'பிரிவை தேர்ந்தெடுக்கவும்');
      return;
    }
    setSubmitting(true);
    try {
      await submitCitizenReport({ headline: headline.trim(), content: content.trim(), categoryId, districtId: district, media });
      Alert.alert(
        language === 'ta' ? 'அனுப்பப்பட்டது' : 'Submitted',
        language === 'ta' ? 'உங்கள் செய்தி சரிபார்ப்புக்கு அனுப்பப்பட்டது' : 'Your report was sent for verification',
        [{ text: 'சரி', onPress: () => router.back() }],
      );
    } catch {
      Alert.alert('பிழை', language === 'ta' ? 'அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்' : 'Could not submit. Please try again');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.bg }]} contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
      <View style={[styles.header, { borderBottomColor: t.border, paddingTop: insets.top, paddingBottom: 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Icon name="back" size={17} color={t.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.ink }]}>
          {language === 'ta' ? 'செய்தி அனுப்பு' : 'Post News'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.mediaBox, { borderColor: t.border, backgroundColor: t.surface }]}
        onPress={pickMedia}
        activeOpacity={0.85}
      >
        {media ? (
          media.type === 'image' ? (
            <RNImage source={{ uri: media.uri }} style={styles.mediaPreview} resizeMode="cover" />
          ) : (
            <View style={[styles.mediaPreview, styles.videoPlaceholder, { backgroundColor: t.ink900 }]}>
              <Icon name="play" size={30} color="#fff" />
            </View>
          )
        ) : (
          <View style={styles.mediaEmpty}>
            <Icon name="downloadImage" size={26} color={t.inkMuted} />
            <Text style={[styles.mediaEmptyText, { color: t.inkMuted }]}>
              {language === 'ta' ? 'புகைப்படம் / வீடியோ சேர்க்க தட்டவும்' : 'Tap to add a photo or video'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TextField
        caption={language === 'ta' ? 'தலைப்பு' : 'Headline'}
        value={headline}
        onChangeText={setHeadline}
        placeholder={language === 'ta' ? 'செய்தியின் தலைப்பு' : 'News headline'}
        containerStyle={{ marginTop: 18 }}
      />

      <TextField
        caption={language === 'ta' ? 'விவரம்' : 'Content'}
        value={content}
        onChangeText={setContent}
        placeholder={language === 'ta' ? 'என்ன நடந்தது என்பதை விவரிக்கவும்...' : 'Describe what happened...'}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        containerStyle={{ marginTop: 16 }}
        style={{ minHeight: 120, paddingTop: 11 }}
      />

      <Caption label={language === 'ta' ? 'பிரிவு' : 'Category'} />
      {categoriesLoading ? (
        <View style={styles.chipRow}>
          <ActivityIndicator size="small" color={t.inkMuted} />
        </View>
      ) : categoriesError || !categories?.length ? (
        <TouchableOpacity style={styles.chipRow} onPress={() => refetchCategories()}>
          <Text style={[styles.retryText, { color: t.red }]}>
            {language === 'ta' ? 'பிரிவுகளை ஏற்ற முடியவில்லை — மீண்டும் முயற்சிக்க தட்டவும்' : "Couldn't load categories — tap to retry"}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.chipRow}>
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={language === 'ta' ? cat.nameTa : cat.nameEn}
              active={categoryId === cat.id}
              onPress={() => setCategoryId(cat.id)}
              style={styles.chip}
            />
          ))}
        </View>
      )}

      <Caption label={language === 'ta' ? 'இருப்பிடம்' : 'Location'} />
      <View style={[styles.locationRow, { borderColor: t.border, backgroundColor: t.bgAlt }]}>
        {locating ? (
          <ActivityIndicator size="small" color={t.inkMuted} />
        ) : (
          <Text style={[styles.locationText, { color: t.inkSub }]}>
            {locationLabel ?? districtLabel?.nameTa ?? (language === 'ta' ? 'இருப்பிடம் கிடைக்கவில்லை' : 'Location unavailable')}
          </Text>
        )}
      </View>

      <Button
        label={language === 'ta' ? 'சரிபார்ப்புக்கு அனுப்பு' : 'Send for Verification'}
        onPress={handleSubmit}
        loading={submitting}
        style={{ marginTop: 26 }}
      />
      <Text style={[styles.submitNote, { color: t.inkMuted }]}>
        {language === 'ta'
          ? 'ஆசிரியர் குழு சரிபார்த்த பிறகு வெளியிடப்படும்'
          : 'Will be published after editorial verification'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerTitle: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 16 },
  mediaBox: { margin: 18, marginBottom: 0, height: 170, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', overflow: 'hidden' },
  mediaPreview: { width: '100%', height: '100%' },
  videoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  mediaEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mediaEmptyText: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 18 },
  retryText: { fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 12.5 },
  chip: { paddingVertical: 6 },
  locationRow: { marginHorizontal: 18, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 11 },
  locationText: { fontFamily: FONT_FAMILIES.uiMedium, fontSize: 13.5 },
  submitNote: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 10.5, textAlign: 'center', marginTop: 9, paddingHorizontal: 18 },
});
