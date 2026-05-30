// src/screens/LoginScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, STRINGS } from '@/constants';

type Step = 'phone' | 'otp';
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { sendOtp, verifyOtp } = useAuth();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startResendTimer() {
    setResendTimer(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp() {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      Alert.alert('பிழை / Error', 'சரியான 10 இலக்க எண் உள்ளிடவும் / Enter a valid 10-digit number');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(`+91${cleaned}`);
      setStep('otp');
      startResendTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch {
      Alert.alert('பிழை / Error', 'OTP அனுப்ப முடியவில்லை / Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) {
      Alert.alert('பிழை / Error', 'OTP முழுமையாக உள்ளிடவும் / Enter complete OTP');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(`+91${phone.replace(/\D/g, '')}`, otpString);
      router.replace('/');
    } catch {
      Alert.alert('பிழை / Error', 'தவறான OTP / Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string, index: number) {
    const digit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    await handleSendOtp();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.appName}>{STRINGS.APP_NAME_TA}</Text>
        <Text style={styles.appNameEn}>{STRINGS.APP_NAME_EN}</Text>

        {step === 'phone' ? (
          <>
            <Text style={styles.heading}>உள்நுழைய / Login</Text>
            <Text style={styles.subheading}>
              உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்{'\n'}Enter your phone number
            </Text>

            <View style={styles.phoneRow}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="10 இலக்க எண் / 10-digit number"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>OTP அனுப்பு / Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.heading}>OTP உள்ளிடவும் / Enter OTP</Text>
            <Text style={styles.subheading}>
              +91 {phone} எண்ணுக்கு OTP அனுப்பப்பட்டது{'\n'}OTP sent to +91 {phone}
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { otpRefs.current[i] = ref; }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
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

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>சரிபார் / Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resendButton, resendTimer > 0 && styles.resendDisabled]}
              onPress={handleResend}
              disabled={resendTimer > 0}
            >
              <Text style={styles.resendText}>
                {resendTimer > 0
                  ? `மீண்டும் அனுப்பு ${resendTimer}s / Resend in ${resendTimer}s`
                  : 'மீண்டும் அனுப்பு / Resend OTP'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('phone')} style={styles.changePhone}>
              <Text style={styles.changePhoneText}>
                எண்ணை மாற்று / Change number
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  appNameEn: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  phoneRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: COLORS.surface,
  },
  prefix: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  prefixText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 16,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF3FA',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  resendDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  changePhone: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  changePhoneText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
