// src/screens/ContactScreen.tsx

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { COLORS } from '@/constants';

const SUPPORT_EMAIL = 'agni360tn@gmail.com';

export default function ContactScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>எங்களை தொடர்பு கொள்ள / Contact Us</Text>
      <Text style={styles.subtext}>
        கேள்விகள், கருத்துகள் அல்லது புகார்களுக்கு எங்களை தொடர்பு கொள்ளுங்கள்.{'\n'}
        For questions, feedback, or complaints, reach out to us using the details below.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>மின்னஞ்சல் / Email</Text>
        <TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
          <Text style={styles.value}>{SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>வெளியீட்டாளர் / Publisher</Text>
        <Text style={styles.value}>Agnisiragu News</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  subtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
