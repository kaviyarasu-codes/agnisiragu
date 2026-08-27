// src/screens/ChangeNumberScreen.tsx
// Screen 2f — change phone number. Reuses the existing send-otp/verify-otp
// endpoints (there's no dedicated /auth/change-number route on the backend
// yet) — verifying the OTP for the new number re-authenticates the account
// under it via the normal login flow. Swap this for a real change-number
// endpoint when the backend adds one, so the existing session/user id is
// preserved instead of being re-issued.

import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import Button from '@/components/ui/Button';
import Icon from '@/components/icons/Icon';

type Step = 'new' | 'otp';
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function maskPhone(phone?: string) {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  return `+91 ${'•'.repeat(Math.max(digits.length - 4 - 2, 0))} ${last4}`;
}

export default function ChangeNumberScreen() {
  const t = useTheme();
  const currentUser = useAuthStore((s) => s.user);
  const { sendOtp, verifyOtp } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('new');
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function startResendTimer() {
    setResendTimer(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp() {
    const cleaned = newPhone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      Alert.alert('பிழை', 'சரியான 10 இலக்க எண் உள்ளிடவும்');
      return;
    }
    if (cleaned === currentUser?.phone?.replace(/\D/g, '').slice(-10)) {
      Alert.alert('பிழை', 'இது தற்போதைய எண். வேறு எண்ணை உள்ளிடவும்');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(`+91${cleaned}`);
      setStep('otp');
      startResendTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch {
      Alert.alert('பிழை', 'OTP அனுப்ப முடியவில்லை');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) {
      Alert.alert('பிழை', 'OTP முழுமையாக உள்ளிடவும்');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(`+91${newPhone.replace(/\D/g, '')}`, otpString);
      Alert.alert('வெற்றி', 'உங்கள் எண் புதுப்பிக்கப்பட்டது', [
        { text: 'சரி', onPress: () => router.replace('/') },
      ]);
    } catch {
      Alert.alert('பிழை', 'தவறான OTP');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string, index: number) {
    const digit = value.slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    await handleSendOtp();
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: t.surface }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { borderBottomColor: t.border, paddingTop: insets.top, paddingBottom: 8 }]}>
        <TouchableOpacity onPress={() => (step === 'otp' ? setStep('new') : router.back())} hitSlop={10}>
          <Icon name="back" size={17} color={t.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.ink }]}>எண்ணை மாற்ற</Text>
      </View>

      <View style={styles.body}>
        {step === 'new' ? (
          <>
            <Text style={[styles.h1, { color: t.ink }]}>புதிய எண்</Text>
            <Text style={[styles.sub, { color: t.inkSub }]}>
              உங்கள் சேமித்த செய்திகள், புக்மார்க்குகள் மற்றும் புள்ளிகள் அப்படியே இருக்கும்
            </Text>

            <Text style={[styles.caption, { color: t.inkMuted }]}>தற்போதைய எண்</Text>
            <View style={[styles.readOnlyRow, { borderColor: t.border, backgroundColor: t.bgAlt }]}>
              <Text style={[styles.readOnlyText, { color: t.inkSub }]}>{maskPhone(currentUser?.phone)}</Text>
            </View>

            <Text style={[styles.caption, { color: t.inkMuted, marginTop: 20 }]}>புதிய எண்</Text>
            <View style={[styles.phoneRow, { borderColor: t.border, backgroundColor: t.surface }]}>
              <Text style={[styles.prefix, { color: t.ink, borderRightColor: t.border }]}>+91</Text>
              <TextInput
                style={[styles.phoneInput, { color: t.ink }]}
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="10 இலக்க எண்"
                placeholderTextColor={t.inkMuted}
              />
            </View>

            <Button label="குறியீடு அனுப்பு" onPress={handleSendOtp} loading={loading} style={{ marginTop: 26 }} />
          </>
        ) : (
          <>
            <Text style={[styles.h1, { color: t.ink }]}>குறியீட்டை உள்ளிடுங்கள்</Text>
            <Text style={[styles.sub, { color: t.inkSub }]}>+91 {newPhone} க்கு அனுப்பப்பட்ட 6 இலக்க குறியீடு</Text>

            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { otpRefs.current[i] = ref; }}
                  style={[
                    styles.otpBox,
                    { borderColor: digit ? t.ink : t.border, color: t.ink },
                  ]}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, i)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            <View style={styles.resendRow}>
              <Text style={[styles.resendHint, { color: t.inkMuted }]}>குறியீடு வரவில்லையா?</Text>
              <Text
                style={[styles.resendAction, { color: resendTimer > 0 ? t.inkMuted : t.red }]}
                onPress={handleResend}
              >
                {resendTimer > 0 ? `RESEND IN 0:${String(resendTimer).padStart(2, '0')}` : 'RESEND'}
              </Text>
            </View>

            <Button label="சரிபார்" onPress={handleVerifyOtp} loading={loading} style={{ marginTop: 26 }} />
            <Text style={[styles.changeNumber, { color: t.red }]} onPress={() => setStep('new')}>எண்ணை மாற்ற</Text>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerTitle: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 16 },
  body: { padding: 26, paddingBottom: 40 },
  h1: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 22, letterSpacing: -0.2 },
  sub: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13.5, lineHeight: 22, marginTop: 8 },
  caption: { fontFamily: FONT_FAMILIES.condensedBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 },
  readOnlyRow: { height: 50, borderWidth: 1.5, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 14 },
  readOnlyText: { fontFamily: FONT_FAMILIES.uiMedium, fontSize: 15 },
  phoneRow: { flexDirection: 'row', borderWidth: 1.5, borderRadius: 12, overflow: 'hidden' },
  prefix: { paddingHorizontal: 14, justifyContent: 'center', textAlignVertical: 'center', fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 15, borderRightWidth: 1 },
  phoneInput: { flex: 1, height: 50, paddingHorizontal: 14, fontSize: 16 },
  otpRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
  otpBox: { flex: 1, height: 54, borderWidth: 1.5, borderRadius: 9, fontFamily: FONT_FAMILIES.uiBold, fontSize: 20 },
  resendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  resendHint: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12.5, flex: 1 },
  resendAction: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 12 },
  changeNumber: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12.5, textAlign: 'center', marginTop: 16 },
});
