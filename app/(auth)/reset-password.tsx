import AuthShell from '@/components/AuthShell';
import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';


const SPRING = { damping: 16, stiffness: 180, mass: 0.9 };

export default function ResetPasswordScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isValid = password.length >= 8 && password === confirmPassword;

  const ctaScale = useSharedValue(1);
  const ctaAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  const glowPulse = useSharedValue(0);
  useEffect(() => {
    glowPulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.22 + glowPulse.value * 0.28,
  }));

  const handleReset = () => {
    if (!isValid) return;
    // TODO: call your reset-password API with { email, password }
    router.replace('/login');
  };

  return (
    <AuthShell showBack onBack={() => router.back()}>
      <View style={styles.centered}>
        <Animated.View
          entering={ZoomIn.duration(500).delay(100).springify().damping(14)}
          style={[styles.iconCircle, { backgroundColor: theme.surfaceVariant }]}
        >
          <Ionicons name="shield-checkmark-outline" size={30} color={theme.onSurfaceVariant} />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.duration(500).delay(180)}
          style={[styles.title, { color: theme.onSurface }]}
        >
          Set New Password
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(230)}
          style={[styles.subtitle, { color: theme.onSurfaceVariant }]}
        >
          Choose a new password for{'\n'}
          <Text style={{ color: theme.onSurface, fontWeight: '600' }}>{email ?? 'your account'}</Text>
        </Animated.Text>

        <Animated.View
          entering={FadeInUp.duration(500).delay(280)}
          style={[styles.inputRow, { borderColor: theme.outline, backgroundColor: theme.surfaceVariant }]}
        >
          <Ionicons name="lock-closed-outline" size={18} color={theme.onSurfaceVariant} />
          <TextInput
            placeholder="New Password"
            placeholderTextColor={theme.onSurfaceVariant}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoFocus
            style={[styles.input, { color: theme.onSurface }]}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={theme.onSurfaceVariant}
            />
          </Pressable>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(330)}
          style={[
            styles.inputRow,
            { borderColor: theme.outline, backgroundColor: theme.surfaceVariant, marginBottom: 8 },
          ]}
        >
          <Ionicons name="lock-closed-outline" size={18} color={theme.onSurfaceVariant} />
          <TextInput
            placeholder="Confirm New Password"
            placeholderTextColor={theme.onSurfaceVariant}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            style={[styles.input, { color: theme.onSurface }]}
          />
          <Pressable onPress={() => setShowConfirmPassword((v) => !v)} hitSlop={8}>
            <Ionicons
              name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={theme.onSurfaceVariant}
            />
          </Pressable>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.duration(300)}
          style={[
            styles.hint,
            { color: password && password.length < 8 ? '#E5484D' : theme.onSurfaceVariant },
          ]}
        >
          At least 8 characters
        </Animated.Text>

        <Animated.View
          entering={FadeInUp.duration(500).delay(380)}
          style={[styles.buttonWrapper, { shadowColor: theme.primary }, glowStyle]}
        >
          <Pressable
            onPress={handleReset}
            onPressIn={() => (ctaScale.value = withSpring(0.96, SPRING))}
            onPressOut={() => (ctaScale.value = withSpring(1, SPRING))}
          >
            <Animated.View
              style={[
                styles.button,
                { backgroundColor: theme.primary, opacity: isValid ? 1 : 0.5 },
                ctaAnimStyle,
              ]}
            >
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>Reset Password</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  hint: {
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: 9999,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});