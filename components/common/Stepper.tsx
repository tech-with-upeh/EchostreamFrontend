import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

export default function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit = '',
  disabled,
}: StepperProps) {
  const { theme } = useAppTheme();

  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <View style={[styles.row, disabled && { opacity: 0.45 }]}>
      <Text style={[styles.label, { color: theme.onSurface }]}>{label}</Text>
      <View style={[styles.control, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
        <Pressable onPress={dec} disabled={disabled || value <= min} style={styles.stepButton} hitSlop={6}>
          <Ionicons name="remove" size={16} color={theme.onSurface} />
        </Pressable>
        <Text style={[styles.value, { color: theme.onSurface }]}>
          {value}
          {unit}
        </Text>
        <Pressable onPress={inc} disabled={disabled || value >= max} style={styles.stepButton} hitSlop={6}>
          <Ionicons name="add" size={16} color={theme.onSurface} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  stepButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
});