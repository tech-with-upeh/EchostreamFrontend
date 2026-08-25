import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export default function SettingsRow({ icon, label, onPress }: SettingsRowProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.outline, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={styles.left}>
        
        <Ionicons name={icon} size={20} color={theme.onSurface} />
        <Text style={[styles.label, { color: theme.onSurface }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});