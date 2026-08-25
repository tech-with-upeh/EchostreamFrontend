import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PreferencesScreen() {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFillObject} />
      </View>
      <View style={styles.content}>
        <Ionicons name="mic-outline" size={32} color={theme.onSurfaceVariant} />
        <Text style={[styles.text, { color: theme.onSurfaceVariant }]}>Preferences screen — build me next</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  text: { fontSize: 14 },
});