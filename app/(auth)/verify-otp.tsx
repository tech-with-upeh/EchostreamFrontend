import AuthShell from '@/components/AuthShell';
import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
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
const OTP_LENGTH = 5;
const RESEND_SECONDS = 30;

export default function VerifyOtpScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { email, flow } = useLocalSearchParams<{ email?: string; flow?: 'signup' | 'reset' }>();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const code = digits.join('');
  const isComplete = code.length === OTP_LENGTH;

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleChange = (value: string, index: number) => {
    const clean = value.replace(/[^0-9]/g, '');
    const next = [...digits];
    next[index] = clean.slice(-1);
    setDigits(next);
    if (clean && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    // TODO: call your resend-OTP API
    setSecondsLeft(RESEND_SECONDS);
  };

  // --- CTA press + glow pulse ---
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

  const handleVerify = () => {
    if (!isComplete) return;
    // TODO: call your verify-OTP API
    if (flow === 'reset') {
      router.push({ pathname: '/reset-password', params: { email } });
    } else {
      // signup verified — send them into the app
      router.replace('/pricing');
    }
  };

  return (
    <AuthShell showBack onBack={() => router.back()}>
      <View style={styles.centered}>
        <Animated.View
          entering={ZoomIn.duration(500).delay(100).springify().damping(14)}
          style={[styles.iconCircle, { backgroundColor: theme.surfaceVariant }]}
        >
          <View style={[styles.iconBadge, { backgroundColor: theme.primary }]}>
            <Ionicons name="checkmark" size={16} color={theme.buttonText} />
          </View>
          <Ionicons name="key-outline" size={30} color={theme.onSurfaceVariant} />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.duration(500).delay(180)}
          style={[styles.title, { color: theme.onSurface }]}
        >
          Verify your account
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(230)}
          style={[styles.subtitle, { color: theme.onSurfaceVariant }]}
        >
          Enter the {OTP_LENGTH}-digit code we sent to{'\n'}
          <Text style={{ color: theme.onSurface, fontWeight: '600' }}>{email ?? 'your email'}</Text>
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.otpRow}>
          {digits.map((digit, index) => (
            <OtpBox
              key={index}
              value={digit}
              focused={focusedIndex === index}
              onFocus={() => setFocusedIndex(index)}
              onChangeText={(v) => handleChange(v, index)}
              onKeyPressBackspace={() => handleKeyPress('Backspace', index)}
              inputRef={(r) => (inputRefs.current[index] = r)}
              autoFocus={index === 0}
              theme={theme}
            />
          ))}
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(360)}
          style={[styles.buttonWrapper, { shadowColor: theme.primary }, glowStyle]}
        >
          <Pressable
            onPress={handleVerify}
            onPressIn={() => (ctaScale.value = withSpring(0.96, SPRING))}
            onPressOut={() => (ctaScale.value = withSpring(1, SPRING))}
          >
            <Animated.View
              style={[
                styles.button,
                { backgroundColor: theme.primary, opacity: isComplete ? 1 : 0.5 },
                ctaAnimStyle,
              ]}
            >
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>Verify</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(400).delay(420)} style={styles.resendRow}>
          {secondsLeft > 0 ? (
            <Text style={[styles.resendText, { color: theme.onSurfaceVariant }]}>
              Resend code in <Text style={{ color: theme.onSurface }}>0:{String(secondsLeft).padStart(2, '0')}</Text>
            </Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text style={[styles.resendText, { color: theme.primaryDim, fontWeight: '700' }]}>Resend Code</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </AuthShell>
  );
}

interface OtpBoxProps {
  value: string;
  focused: boolean;
  onFocus: () => void;
  onChangeText: (v: string) => void;
  onKeyPressBackspace: () => void;
  inputRef: (r: TextInput | null) => void;
  autoFocus?: boolean;
  theme: ReturnType<typeof useAppTheme>['theme'];
}

function OtpBox({
  value,
  focused,
  onFocus,
  onChangeText,
  onKeyPressBackspace,
  inputRef,
  autoFocus,
  theme,
}: OtpBoxProps) {
  const scale = useSharedValue(1);
  const boxStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    scale.value = withSpring(focused ? 1.06 : 1, SPRING);
  }, [focused]);

  return (
    <Animated.View
      style={[
        styles.otpBox,
        {
          borderColor: focused ? theme.primary : theme.outline,
          backgroundColor: theme.surfaceVariant,
        },
        boxStyle,
      ]}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onKeyPress={({ nativeEvent }) => nativeEvent.key === 'Backspace' && onKeyPressBackspace()}
        keyboardType="number-pad"
        maxLength={1}
        autoFocus={autoFocus}
        style={[styles.otpInput, { color: theme.onSurface }]}
        selectionColor={theme.primary}
      />
    </Animated.View>
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
  iconBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
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
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  otpBox: {
    width: 52,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
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
  resendRow: {
    marginBottom: 8,
  },
  resendText: {
    fontSize: 13,
  },
});