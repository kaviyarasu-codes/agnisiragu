// src/screens/JobsScreen.tsx
// Jobs — reachable from the side menu. No jobs-board endpoint exists on the
// backend yet, so this ships as a "coming soon" placeholder consistent with
// ReelsScreen, rather than inventing job listings with no real data source.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore } from '@/store/app.store';
import { useTheme } from '@/hooks/useTheme';
import EmptyState from '@/components/ui/EmptyState';

export default function JobsScreen() {
  const t = useTheme();
  const { language } = useAppStore();

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <EmptyState
        icon="jobsBriefcase"
        title={language === 'ta' ? 'வேலை வாய்ப்பு விரைவில்' : 'Jobs coming soon'}
        description={
          language === 'ta'
            ? 'உங்கள் மாவட்டத்தில் உள்ள வேலை வாய்ப்புகள் இங்கு விரைவில் வெளியிடப்படும்'
            : 'Local job listings for your district will appear here in a future update'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
