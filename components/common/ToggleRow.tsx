import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

interface ToggleRowProps {
  icon?: React.ReactNode;
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  onPress?: () => void; // if provided, row becomes pressable (e.g. to edit) in addition to the switch
  showChevron?: boolean;
  disabled?: boolean;
  bold?: boolean;
}

export default function ToggleRow({
  icon,
  label,
  subtitle,
  value,
  onValueChange,
  onPress,
  showChevron,
  disabled,
  bold,
}: ToggleRowProps) {
  const { theme } = useAppTheme();

  const content = (
    <View style={[styles.row, disabled && { opacity: 0.45 }]}>
      <View style={styles.left}>
        {icon}
        <View style={styles.textCol}>
          <Text style={[styles.label, { color: theme.onSurface }, bold && styles.labelBold]}>{label}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>{subtitle}</Text> : null}
        </View>
        {showChevron && <Ionicons name="chevron-forward" size={16} color={theme.onSurfaceVariant} />}
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: theme.outline, true: theme.primary }}
        thumbColor={theme.surface}
        ios_backgroundColor={theme.outline}
      />
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} disabled={disabled}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 12,
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelBold: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
});