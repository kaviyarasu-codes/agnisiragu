// src/components/MaintenanceScreen.tsx
// Full-screen blocking view shown when the admin enables Maintenance Mode
// via App Config → Feature Flags. Polled from GET /config on app launch.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants';

export default function MaintenanceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🛠️</Text>
      <Text style={styles.title}>பராமரிப்பு பணியில் உள்ளோம்</Text>
      <Text style={styles.titleEn}>Under Maintenance</Text>
      <Text style={styles.message}>
        அக்னிசிறகு தற்போது புதுப்பிக்கப்படுகிறது. விரைவில் மீண்டும் வாருங்கள்.
      </Text>
      <Text style={styles.messageEn}>
        Agnisiragu is being updated right now. Please check back shortly.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  titleEn: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageEn: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
});
