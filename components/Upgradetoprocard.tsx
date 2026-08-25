import { useAppTheme } from '@/hooks/use-theme-color';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface UpgradeToProCardProps {
  onPress: () => void;
}

export default function UpgradeToProCard({ onPress }: UpgradeToProCardProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={[theme.primary, theme.primaryDim]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.proCard}
      >
        <MaterialCommunityIcons name="crown" size={22} color={theme.buttonText} style={styles.crownIcon} />
        <Text style={[styles.proTitle, { color: theme.buttonText }]}>Upgrade to Pro!</Text>
        <Text style={[styles.proSubtitle, { color: theme.buttonText }]}>
          Enjoy all benefits without any restrictions.
        </Text>
        <Pressable onPress={onPress} style={[styles.proButton, { backgroundColor: theme.surface }]}>
          <Text style={[styles.proButtonText, { color: theme.primary }]}>Upgrade</Text>
        </Pressable>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  proCard: {
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
  },
  crownIcon: {
    marginBottom: 12,
  },
  proTitle: { fontSize: 19, fontWeight: '700', marginBottom: 6 },
  proSubtitle: { fontSize: 13, opacity: 0.9, marginBottom: 18, lineHeight: 18, maxWidth: '85%' },
  proButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  proButtonText: { fontSize: 13, fontWeight: '700' },
});