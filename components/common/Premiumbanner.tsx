import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface PremiumBannerProps {
  title: string;
  ctaLabel?: string;
  onPress: () => void;
}

export default function PremiumBanner({ title, ctaLabel = 'Start your Free Premium Trial', onPress }: PremiumBannerProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={[theme.primary, theme.primaryDim]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <Text style={[styles.title, { color: theme.buttonText }]}>{title}</Text>
        <Pressable onPress={onPress} style={[styles.cta, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name="crown" size={15} color={theme.primary} />
          <Text style={[styles.ctaText, { color: theme.primary }]}>{ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={14} color={theme.primary} />
        </Pressable>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
  },
});