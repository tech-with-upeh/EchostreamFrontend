import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  interpolateColor,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import AuthShell from './AuthShell';

const SPRING = { damping: 16, stiffness: 180, mass: 0.9 };

type AuthTab = 'login' | 'register';

export default function LoginScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [switcherWidth, setSwitcherWidth] = useState(0);

  const isLogin = activeTab === 'login';

  // --- Tab indicator ---
  const tabProgress = useSharedValue(0);
  useEffect(() => {
    tabProgress.value = withSpring(isLogin ? 0 : 1, SPRING);
  }, [isLogin]);

  const indicatorStyle = useAnimatedStyle(() => {
    const indicatorWidth = switcherWidth > 0 ? (switcherWidth - 8) / 2 : 0;
    return {
      width: indicatorWidth,
      transform: [{ translateX: tabProgress.value * indicatorWidth }],
    };
  });

  const loginTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(tabProgress.value, [0, 1], [theme.buttonText, theme.onSurfaceVariant]),
  }));
  const registerTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(tabProgress.value, [0, 1], [theme.onSurfaceVariant, theme.buttonText]),
  }));

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

  const handleSubmit = () => {
    if (isLogin) {
      router.push({ pathname: '/pricing'});
    } else {
      // Kick off the sign-up flow: send OTP, then go verify it
      router.push({ pathname: '/verify-otp', params: { email, flow: 'signup' } });
    }
  };

  return (
    <AuthShell
      aboveSheet={
        <Animated.View
          entering={FadeInDown.duration(600).easing(Easing.out(Easing.cubic))}
          style={styles.headerSection}
        >
          <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
            Go ahead and set up{'\n'}your account
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.onSurfaceVariant }]}>
            Sign in to enjoy the best EchoStream experience
          </Text>
        </Animated.View>
      }
    >
      {/* Tab Switcher */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(160)}
        onLayout={(e) => setSwitcherWidth(e.nativeEvent.layout.width)}
        style={[styles.tabSwitcher, { backgroundColor: theme.surfaceVariant }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.tabIndicator, { backgroundColor: theme.primary }, indicatorStyle]}
        />
        <Pressable style={styles.tabButton} onPress={() => setActiveTab('login')}>
          <Animated.Text style={[styles.tabButtonText, loginTextStyle]}>Login</Animated.Text>
        </Pressable>
        <Pressable style={styles.tabButton} onPress={() => setActiveTab('register')}>
          <Animated.Text style={[styles.tabButtonText, registerTextStyle]}>Register</Animated.Text>
        </Pressable>
      </Animated.View>

      {/* Form */}
      <Animated.View layout={Layout.springify().damping(18)} style={styles.form}>
        {!isLogin && (
          <Animated.View
            entering={FadeInDown.duration(400).springify().damping(16)}
            exiting={FadeOutUp.duration(220)}
            layout={Layout.springify()}
            style={[styles.inputRow, { borderColor: theme.outline, backgroundColor: theme.surfaceVariant }]}
          >
            <Ionicons name="person-outline" size={18} color={theme.onSurfaceVariant} />
            <TextInput
              placeholder="Full Name"
              placeholderTextColor={theme.onSurfaceVariant}
              value={name}
              onChangeText={setName}
              style={[styles.input, { color: theme.onSurface }]}
            />
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.duration(500).delay(200)}
          layout={Layout.springify()}
          style={[styles.inputRow, { borderColor: theme.outline, backgroundColor: theme.surfaceVariant }]}
        >
          <Ionicons name="mail-outline" size={18} color={theme.onSurfaceVariant} />
          <TextInput
            placeholder="Email Address"
            placeholderTextColor={theme.onSurfaceVariant}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { color: theme.onSurface }]}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(500).delay(260)}
          layout={Layout.springify()}
          style={[styles.inputRow, { borderColor: theme.outline, backgroundColor: theme.surfaceVariant }]}
        >
          <Ionicons name="lock-closed-outline" size={18} color={theme.onSurfaceVariant} />
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.onSurfaceVariant}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
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

        {!isLogin && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(60).springify().damping(16)}
            exiting={FadeOutUp.duration(220)}
            layout={Layout.springify()}
            style={[styles.inputRow, { borderColor: theme.outline, backgroundColor: theme.surfaceVariant }]}
          >
            <Ionicons name="lock-closed-outline" size={18} color={theme.onSurfaceVariant} />
            <TextInput
              placeholder="Confirm Password"
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
        )}

        {isLogin && (
          <Animated.View
            entering={FadeIn.duration(400).delay(320)}
            exiting={FadeOutUp.duration(180)}
            layout={Layout.springify()}
            style={styles.optionsRow}
          >
            <Pressable style={styles.rememberMe} onPress={() => setRememberMe((v) => !v)} hitSlop={8}>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: theme.onSurfaceVariant },
                  rememberMe && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
              >
                {rememberMe && (
                  <Animated.View entering={ZoomIn.springify().damping(12)} exiting={ZoomOut.duration(120)}>
                    <Ionicons name="checkmark" size={12} color={theme.buttonText} />
                  </Animated.View>
                )}
              </View>
              <Text style={[styles.rememberMeText, { color: theme.onSurfaceVariant }]}>Remember me</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/forgot-password')}>
              <Text style={[styles.forgotPassword, { color: theme.primaryDim }]}>Forgot Password?</Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>

      {/* Bottom Section */}
      <Animated.View layout={Layout.springify().damping(18)} style={styles.bottomSection}>
        <Animated.View
          entering={FadeInUp.duration(500).delay(340)}
          style={[styles.buttonWrapper, { shadowColor: theme.primary }, glowStyle]}
        >
          <Pressable
            onPress={handleSubmit}
            onPressIn={() => (ctaScale.value = withSpring(0.96, SPRING))}
            onPressOut={() => (ctaScale.value = withSpring(1, SPRING))}
          >
            <Animated.View style={[styles.button, { backgroundColor: theme.primary }, ctaAnimStyle]}>
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                {isLogin ? 'Login' : 'Create Account'}
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(400).delay(420)} style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.outline }]} />
          <Text style={[styles.dividerText, { color: theme.onSurfaceVariant }]}>
            Or {isLogin ? 'login' : 'sign up'} with
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.outline }]} />
        </Animated.View>

        <View style={styles.socialRow}>
          <Animated.View entering={FadeInUp.duration(450).delay(480)} style={{ flex: 1 }}>
            <Pressable
              style={[styles.socialButton, { borderColor: theme.outline, backgroundColor: theme.surfaceVariant }]}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={[styles.socialButtonText, { color: theme.onSurface }]}>Google</Text>
            </Pressable>
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(450).delay(540)} style={{ flex: 1 }}>
            <Pressable
              style={[styles.socialButton, { borderColor: theme.outline, backgroundColor: theme.surfaceVariant }]}
            >
              <Ionicons name="logo-apple" size={20} color={theme.onSurface} />
              <Text style={[styles.socialButtonText, { color: theme.onSurface }]}>Apple</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.9,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: 'center',
    zIndex: 1,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberMeText: {
    fontSize: 13,
  },
  forgotPassword: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: 9999,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    marginBottom: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 8,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 9999,
    borderWidth: 1,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});