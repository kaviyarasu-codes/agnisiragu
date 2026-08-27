// app/(tabs)/upload.tsx — Upload step 1–2: capture media + record voice (design 1f)
// Phase 1: media "add" appends a placeholder tile (no real camera/picker
// yet — Phase 2 TODO: wire expo-image-picker, already a dependency).
// Voice recording is a UI-only timer/waveform for now — Phase 2 TODO: wire
// expo-audio + POST the recording to the AI transcription endpoint.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import PlaceholderBox from '@/components/PlaceholderBox';
import { COLORS, FONT_FAMILIES } from '@/constants';

export default function UploadCaptureScreen() {
  const [media, setMedia] = useState<{ id: string; label: string }[]>([
    { id: 'm1', label: 'photo' },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  function addMedia() {
    if (media.length >= 4) return;
    setMedia((m) => [...m, { id: `m${m.length + 1}`, label: m.length % 2 === 0 ? 'video 0:12' : 'photo' }]);
  }

  function handleStop() {
    setIsRecording(false);
    router.push('/upload-preview');
  }

  const mm = String(Math.floor(seconds / 60)).padStart(1, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>செய்தி அனுப்பு</Text>
        <Text style={styles.step}>step 2 / 4</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '50%' }]} />
      </View>

      <View style={styles.body}>
        <View>
          <Text style={styles.sectionLabel}>1 · media captured</Text>
          <View style={styles.mediaRow}>
            {media.map((m) => (
              <PlaceholderBox key={m.id} label={m.label} style={styles.mediaTile} />
            ))}
            {media.length < 4 && (
              <TouchableOpacity style={styles.addTile} onPress={addMedia} activeOpacity={0.8}>
                <Text style={styles.addPlus}>+</Text>
                <Text style={styles.addLabel}>add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.voiceSection}>
          <Text style={[styles.sectionLabel, { color: COLORS.primary }]}>2 · record your voice</Text>
          <TouchableOpacity style={styles.voiceCard} onPress={() => setIsRecording((v) => !v)} activeOpacity={0.85}>
            <View style={styles.waveform}>
              {Array.from({ length: 11 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.bar,
                    { height: isRecording ? 12 + ((i * 7) % 30) : 8, opacity: isRecording ? 1 : 0.35 },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.timer}>{mm}:{ss}</Text>
            <View style={styles.recordBtn}>
              <View style={isRecording ? styles.stopSquare : styles.recordDot} />
            </View>
            <Text style={styles.voiceHint}>நடந்தது என்ன, எங்கே, எப்போது — உங்கள் மொழியில் பேசுங்கள்</Text>
          </TouchableOpacity>
          <View style={styles.recognizedRow}>
            <Text style={styles.recognizedLabel}>tamil recognised</Text>
            <TouchableOpacity onPress={() => router.push('/upload-preview')}>
              <Text style={styles.typeInstead}>தட்டச்சு செய்ய விரும்புகிறேன்</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleStop} activeOpacity={0.85}>
          <Text style={styles.submitLabel}>நிறுத்தி எழுத்தாக்கு</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 56, paddingBottom: 12 },
  close: { fontSize: 16, color: COLORS.ink },
  title: { flex: 1, fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, color: COLORS.ink },
  step: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, letterSpacing: 1 },
  progressTrack: { height: 3, backgroundColor: COLORS.borderLight },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  body: { flex: 1, padding: 16, gap: 16 },
  sectionLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 9 },
  mediaRow: { flexDirection: 'row', gap: 9 },
  mediaTile: { width: 96, height: 74, borderRadius: 8 },
  addTile: { width: 74, height: 74, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addPlus: { fontSize: 18, color: COLORS.inkOnDark, lineHeight: 18 },
  addLabel: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase' },
  voiceSection: { flex: 1 },
  voiceCard: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, padding: 20, alignItems: 'center', gap: 16 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 44 },
  bar: { width: 3, borderRadius: 2, backgroundColor: COLORS.primary },
  timer: { fontFamily: 'ui-monospace', fontSize: 22, fontWeight: '700', color: COLORS.ink },
  recordBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  recordDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  stopSquare: { width: 16, height: 16, borderRadius: 3, backgroundColor: '#fff' },
  voiceHint: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12, lineHeight: 20, color: COLORS.inkSecondary, textAlign: 'center' },
  recognizedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  recognizedLabel: { flex: 1, fontFamily: FONT_FAMILIES.condensedBold, fontSize: 9.5, color: COLORS.inkLight, textTransform: 'uppercase' },
  typeInstead: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12, color: COLORS.primary },
  submitBtn: { height: 50, borderRadius: 10, backgroundColor: COLORS.dark, alignItems: 'center', justifyContent: 'center' },
  submitLabel: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 16, color: '#fff' },
});
