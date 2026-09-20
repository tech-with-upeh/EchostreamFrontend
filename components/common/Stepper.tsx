import { useAppTheme } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  /** Shows the premium diamond and locks (disables) the stepper. */
  isPremium?: boolean;
}

export default function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit = "",
  disabled,
  isPremium,
}: StepperProps) {
  const { theme } = useAppTheme();

  // Premium steppers are always locked
  const isDisabled = !!(disabled || isPremium);

  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <View style={[styles.row, isDisabled && styles.rowDisabled]}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.onSurface }]}>{label}</Text>
        {isPremium && <Ionicons name="diamond" size={11} color="#FFB961" />}
      </View>
      <View
        style={[
          styles.control,
          { backgroundColor: theme.surface, borderColor: theme.outline },
        ]}
      >
        <Pressable
          onPress={dec}
          disabled={isDisabled || value <= min}
          style={styles.stepButton}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          accessibilityState={{ disabled: isDisabled || value <= min }}
        >
          <Ionicons name="remove" size={16} color={theme.onSurface} />
        </Pressable>
        <Text style={[styles.value, { color: theme.onSurface }]}>
          {value}
          {unit}
        </Text>
        <Pressable
          onPress={inc}
          disabled={isDisabled || value >= max}
          style={styles.stepButton}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          accessibilityState={{ disabled: isDisabled || value >= max }}
        >
          <Ionicons name="add" size={16} color={theme.onSurface} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  labelRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  control: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  stepButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 13,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "center",
  },
});
