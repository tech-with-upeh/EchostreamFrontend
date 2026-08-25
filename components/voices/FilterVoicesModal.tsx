import FilterChip from '@/components/voices/FilterChip';
import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface VoiceFilters {
  language: string | null;
  gender: 'Male' | 'Female' | null;
  ageGroup: string | null;
}

export const DEFAULT_FILTERS: VoiceFilters = {
  language: null,
  gender: null,
  ageGroup: null,
};

const PRIMARY_LANGUAGES = [
  { label: 'English', emoji: '🇺🇸' },
  { label: 'Mandarin Chinese', emoji: '🇨🇳' },
  { label: 'Spanish', emoji: '🇪🇸' },
  { label: 'Hindi', emoji: '🇮🇳' },
  { label: 'Arabic', emoji: '🇸🇦' },
  { label: 'Portuguese', emoji: '🇵🇹' },
  { label: 'French', emoji: '🇫🇷' },
  { label: 'Urdu', emoji: '🇵🇰' },
  { label: 'Russian', emoji: '🇷🇺' },
  { label: 'Bengali', emoji: '🇧🇩' },
  { label: 'German', emoji: '🇩🇪' },
];

const MORE_LANGUAGES = [
  { label: 'Japanese', emoji: '🇯🇵' },
  { label: 'Korean', emoji: '🇰🇷' },
  { label: 'Swahili', emoji: '🇰🇪' },
  { label: 'Indonesian', emoji: '🇮🇩' },
  { label: 'Italian', emoji: '🇮🇹' },
  { label: 'Turkish', emoji: '🇹🇷' },
  { label: 'Vietnamese', emoji: '🇻🇳' },
  { label: 'Thai', emoji: '🇹🇭' },
];

const GENDERS: { label: 'Male' | 'Female'; emoji: string }[] = [
  { label: 'Male', emoji: '👨' },
  { label: 'Female', emoji: '👩' },
];

const AGE_GROUPS = ['All Age Groups', 'Young', 'Middle-Aged', 'Kid', 'Old'];

interface FilterVoicesModalProps {
  visible: boolean;
  initialFilters: VoiceFilters;
  onClose: () => void;
  onApply: (filters: VoiceFilters) => void;
}

export default function FilterVoicesModal({ visible, initialFilters, onClose, onApply }: FilterVoicesModalProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [language, setLanguage] = useState(initialFilters.language);
  const [gender, setGender] = useState(initialFilters.gender);
  const [ageGroup, setAgeGroup] = useState(initialFilters.ageGroup);
  const [showMoreLanguages, setShowMoreLanguages] = useState(false);

  const languages = showMoreLanguages ? [...PRIMARY_LANGUAGES, ...MORE_LANGUAGES] : PRIMARY_LANGUAGES;

  const handleReset = () => {
    setLanguage(null);
    setGender(null);
    setAgeGroup(null);
  };

  const handleApply = () => {
    onApply({ language, gender, ageGroup });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={theme.onSurface} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.onSurface }]}>Filter AI Voices</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Language */}
          <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Language</Text>
          <View style={styles.chipWrap}>
            {languages.map((lang) => (
              <FilterChip
                key={lang.label}
                label={lang.label}
                emoji={lang.emoji}
                selected={language === lang.label}
                onPress={() => setLanguage(language === lang.label ? null : lang.label)}
              />
            ))}
            {!showMoreLanguages && (
              <Pressable onPress={() => setShowMoreLanguages(true)} style={styles.moreButton}>
                <Text style={[styles.moreText, { color: theme.primaryDim }]}>+ more</Text>
              </Pressable>
            )}
          </View>

          {/* Gender */}
          <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Gender</Text>
          <View style={styles.chipWrap}>
            {GENDERS.map((g) => (
              <FilterChip
                key={g.label}
                label={g.label}
                emoji={g.emoji}
                selected={gender === g.label}
                onPress={() => setGender(gender === g.label ? null : g.label)}
              />
            ))}
          </View>

          {/* Age Groups */}
          <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Age Groups</Text>
          <View style={styles.chipWrap}>
            {AGE_GROUPS.map((age) => (
              <FilterChip
                key={age}
                label={age}
                selected={ageGroup === age}
                onPress={() => setAgeGroup(ageGroup === age ? null : age)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { backgroundColor: theme.background, borderTopColor: theme.outline, paddingBottom: insets.bottom + 12 },
          ]}
        >
          <Pressable onPress={handleReset} style={[styles.resetButton, { backgroundColor: theme.surfaceVariant }]}>
            <Text style={[styles.resetText, { color: theme.primaryDim }]}>Reset</Text>
          </Pressable>
          <Pressable onPress={handleApply} style={[styles.applyButton, { backgroundColor: theme.primary }]}>
            <Text style={[styles.applyText, { color: theme.buttonText }]}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  moreButton: {
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 9999,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 9999,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 14,
    fontWeight: '700',
  },
});