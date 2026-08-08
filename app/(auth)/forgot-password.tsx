import AuthShell from '@/components/AuthShell';
import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

export default function ForgotPasswordScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const isValid = email.includes('@') && email.includes('.');

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

  const handleSendCode = () => {
    if (!isValid) return;
    // TODO: call your request-password-reset API
    router.push({ pathname: '/verify-otp', params: { email, flow: 'reset' } });
  };

  return (
    <AuthShell showBack onBack={() => router.back()}>
      <View style={styles.centered}>
        <Animated.View
          entering={ZoomIn.duration(500).delay(100).springify().damping(14)}
          style={[styles.iconCircle, { backgroundColor: theme.surfaceVariant }]}
        >
          <Ionicons name="lock-closed-outline" size={30} color={theme.onSurfaceVariant} />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.duration(500).delay(180)}
          style={[styles.title, { color: theme.onSurface }]}
        >
          Forgot Password?
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(230)}
          style={[styles.subtitle, { color: theme.onSurfaceVariant }]}
        >
          No worries — enter your email and we'll{'\n'}send you a code to reset it.
        </Animated.Text>

        <Animated.View
          entering={FadeInUp.duration(500).delay(300)}
          style={[
            styles.inputRow,
            { borderColor: theme.outline, backgroundColor: theme.surfaceVariant },
          ]}
        >
          <Ionicons name="mail-outline" size={18} color={theme.onSurfaceVariant} />
          <TextInput
            placeholder="Email Address"
            placeholderTextColor={theme.onSurfaceVariant}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
            style={[styles.input, { color: theme.onSurface }]}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(360)}
          style={[styles.buttonWrapper, { shadowColor: theme.primary }, glowStyle]}
        >
          <Pressable
            onPress={handleSendCode}
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
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>Send Reset Code</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(420)}>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.backToLogin, { color: theme.primaryDim }]}>Back to Login</Text>
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
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: 9999,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
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
  backToLogin: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
});