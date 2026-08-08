import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import { Dimensions, Keyboard, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface AuthShellProps {
  /** Show a circular back button floating over the gradient, top-left. */
  showBack?: boolean;
  onBack?: () => void;
  /** Content rendered above the sheet, on the gradient background (e.g. Login's big heading). */
  aboveSheet?: ReactNode;
  /** Content rendered inside the bottom sheet. */
  children: ReactNode;
}

/**
 * Shared background + bottom-sheet chrome for every auth screen.
 * The sheet bleeds all the way to the physical bottom edge (no gap under
 * the home indicator) — SafeAreaView only reserves the TOP inset, and the
 * bottom inset is instead applied as inner padding so content stays clear
 * of the home indicator while the sheet's color still fills behind it.
 */
export default function AuthShell({ showBack, onBack, aboveSheet, children }: AuthShellProps) {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Pressable style={StyleSheet.absoluteFillObject} onPress={Keyboard.dismiss}>
        <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={[theme.topGlow, 'transparent']}
          style={styles.topAmbientGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={[theme.bottomGlow, 'transparent']}
          style={styles.bottomAmbientGlow}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />
      </View>

      {showBack && (
        <Animated.View entering={FadeIn.duration(350)} style={styles.backButtonRow}>
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: theme.surfaceVariant }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.onSurface} />
          </Pressable>
        </Animated.View>
      )}

      <View style={styles.mainwrapper}>
        {aboveSheet}

        <Animated.View
          entering={FadeInUp.duration(700).delay(80).springify().damping(18)}
          style={[
            styles.mainContent,
            { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 },
          ]}
        >
          {children}
        </Animated.View>
      </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topAmbientGlow: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: width * 1.2,
    height: height * 0.85,
    borderRadius: width,
  },
  bottomAmbientGlow: {
    position: 'absolute',
    bottom: -60,
    alignSelf: 'center',
    width: width * 1.2,
    height: height * 0.35,
    borderRadius: width,
  },
  backButtonRow: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainwrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  mainContent: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});