// src/screens/LoginScreen.tsx
// Screen 2e — OTP entry with resend timer. The phone-number step isn't in
// the design's screen inventory (it only shows the state right after an
// OTP was sent) but is kept here since the reader has to type a number
// somewhere; it reuses the same field/button language as the rest of 2e.

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { FONT_FAMILIES } from '@/constants';
import Button from '@/components/ui/Button';
import Icon from '@/components/icons/Icon';

type Step = 'phone' | 'otp';
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function LoginScreen() {
  const t = useTheme();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { sendOtp, verifyOtp } = useAuth();
  const insets = useSafeAreaInsets();

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
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      Alert.alert('பிழை', 'சரியான 10 இலக்க எண் உள்ளிடவும்');
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
      await verifyOtp(`+91${phone.replace(/\D/g, '')}`, otpString);
      router.replace('/');
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
        <TouchableOpacity onPress={() => (step === 'otp' ? setStep('phone') : router.back())} hitSlop={10}>
          <Icon name="back" size={17} color={t.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.ink }]}>உள்நுழைய</Text>
      </View>

      <View style={styles.body}>
        {step === 'phone' ? (
          <>
            <Text style={[styles.h1, { color: t.ink }]}>தொலைபேசி எண்</Text>
            <Text style={[styles.sub, { color: t.inkSub }]}>உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்</Text>

            <View style={[styles.phoneRow, { borderColor: t.border, backgroundColor: t.surface }]}>
              <Text style={[styles.prefix, { color: t.ink, borderRightColor: t.border }]}>+91</Text>
              <TextInput
                style={[styles.phoneInput, { color: t.ink }]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="10 இலக்க எண்"
                placeholderTextColor={t.inkMuted}
              />
            </View>

            <Button label="OTP அனுப்பு" onPress={handleSendOtp} loading={loading} style={{ marginTop: 26 }} />
          </>
        ) : (
          <>
            <Text style={[styles.h1, { color: t.ink }]}>குறியீட்டை உள்ளிடுங்கள்</Text>
            <Text style={[styles.sub, { color: t.inkSub }]}>+91 {phone} க்கு அனுப்பப்பட்ட 6 இலக்க குறியீடு</Text>

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
            <Text style={[styles.changeNumber, { color: t.red }]} onPress={() => setStep('phone')}>எண்ணை மாற்ற</Text>
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
  body: { padding: 26 },
  h1: { fontFamily: FONT_FAMILIES.displayBold, fontSize: 22, letterSpacing: -0.2 },
  sub: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 13.5, lineHeight: 22, marginTop: 8 },
  phoneRow: { flexDirection: 'row', borderWidth: 1.5, borderRadius: 12, overflow: 'hidden', marginTop: 24 },
  prefix: { paddingHorizontal: 14, justifyContent: 'center', textAlignVertical: 'center', fontFamily: FONT_FAMILIES.uiSemiBold, fontSize: 15, borderRightWidth: 1 },
  phoneInput: { flex: 1, height: 50, paddingHorizontal: 14, fontSize: 16 },
  otpRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
  otpBox: { flex: 1, height: 54, borderWidth: 1.5, borderRadius: 9, fontFamily: FONT_FAMILIES.uiBold, fontSize: 20 },
  resendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  resendHint: { fontFamily: FONT_FAMILIES.bodyRegular, fontSize: 12.5, flex: 1 },
  resendAction: { fontFamily: FONT_FAMILIES.uiBold, fontSize: 12 },
  changeNumber: { fontFamily: FONT_FAMILIES.displaySemiBold, fontSize: 12.5, textAlign: 'center', marginTop: 16 },
});
