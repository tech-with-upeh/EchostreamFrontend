import { useAppTheme } from '@/hooks/use-theme-color';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface FilterChipProps {
  label: string;
  emoji?: string;
  selected: boolean;
  onPress: () => void;
}

export default function FilterChip({ label, emoji, selected, onPress }: FilterChipProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.surfaceVariant,
          borderColor: selected ? theme.primary : theme.outline,
        },
      ]}
    >
      <Text style={[styles.label, { color: selected ? theme.buttonText : theme.onSurface }]}>
        {label} {emoji}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});