import { useAppTheme } from '@/hooks/use-theme-color';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const SPRING = { damping: 16, stiffness: 180, mass: 0.9 };

// Mock data — wire these up to your real state/store
const SELECTED_VOICE = { name: 'Aria', description: 'Warm & Clear · Female' };
const PREFERENCES = { speed: '1.0x', pitch: 'Normal', language: 'English (US)' };

const VOICES = [
  { id: '1', name: 'Olivia', gender: 'F', flag: '🇺🇸', style: 'Young', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: '2', name: 'Samuel', gender: 'M', flag: '🇬🇧', style: 'Middle-Aged', avatar: 'https://i.pravatar.cc/150?img=13' },
  { id: '3', name: 'Amara', gender: 'F', flag: '🇳🇬', style: 'Warm', avatar: 'https://i.pravatar.cc/150?img=25' },
  { id: '4', name: 'Kenji', gender: 'M', flag: '🇯🇵', style: 'Calm', avatar: 'https://i.pravatar.cc/150?img=51' },
];

export default function HomeScreen() {
  const { theme, isDark } = useAppTheme();
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [favorited, setFavorited] = useState<Record<string, boolean>>({});

  // TODO: replace with your real onboarding/profile state (e.g. from auth store or API)
  const [tiktokUsername, setTiktokUsername] = useState<string | null>(null);
  const hasConnectedTikTok = !!tiktokUsername;

  const toggleFavorite = (id: string) => setFavorited((f) => ({ ...f, [id]: !f[id] }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Dynamic Background Gradient */}
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header: avatar + badge, links to profile/settings */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Pressable onPress={() => router.push('/settings')} style={styles.avatarWrapper}>
            <View style={[styles.avatar, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
              <Ionicons name="person" size={26} color={theme.onSurfaceVariant} />
            </View>
            <View style={[styles.badge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              <Ionicons name="settings" size={11} color={theme.buttonText} />
            </View>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: theme.onSurfaceVariant }]}>Welcome back</Text>
            <Text style={[styles.username, { color: theme.onSurface }]}>Utechit</Text>
          </View>
        </Animated.View>

        {/* First run: connect TikTok. After that: wave + start button */}
        {hasConnectedTikTok ? (
          <Animated.View
            entering={FadeInUp.duration(600).delay(100).springify().damping(18)}
            layout={Layout.springify()}
            style={styles.waveSection}
          >
            <SoundWave active={isActive} theme={theme} />
            <StartButton isActive={isActive} onToggle={() => setIsActive((v) => !v)} theme={theme} />
            <Text style={[styles.waveStatus, { color: theme.onSurfaceVariant }]}>
              {isActive ? 'Listening for comments…' : 'Tap to start text-to-speech'}
            </Text>
            <Text style={[styles.connectedHandle, { color: theme.onSurfaceVariant }]}>
              Connected to @{tiktokUsername}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInUp.duration(500).delay(100)}
            exiting={FadeOut.duration(200)}
            layout={Layout.springify()}
            style={styles.connectSection}
          >
            <TikTokConnectForm onConnected={setTiktokUsername} theme={theme} />
          </Animated.View>
        )}

        {/* Upgrade to Pro */}
        <Animated.View entering={FadeInUp.duration(500).delay(180)} layout={Layout.springify()}>
          <Pressable onPress={() => router.push('/pricing')}>
            <LinearGradient
              colors={[theme.primary, theme.primaryDim]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.proCard}
            >
              <View style={[styles.proIconBadge, { backgroundColor: theme.surface }]}>
                <MaterialCommunityIcons name="crown" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.proTitle, { color: theme.buttonText }]}>Upgrade to Pro</Text>
              <Text style={[styles.proSubtitle, { color: theme.buttonText }]}>
                Enjoy all voices and features without any restrictions.
              </Text>
              <View style={[styles.proButton, { backgroundColor: theme.surface }]}>
                <Text style={[styles.proButtonText, { color: theme.primary }]}>Upgrade</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Selected Voice + Preferences, voice-changer-card style */}
        <View style={styles.featureGrid}>
          <Animated.View entering={FadeInUp.duration(500).delay(240)} style={styles.featureCol}>
            <FeatureCard
              icon={<Ionicons name="mic-outline" size={22} color={theme.onSurface} />}
              title="Selected Voice"
              subtitle={`${SELECTED_VOICE.name} · ${SELECTED_VOICE.description}`}
              actionLabel="Change"
              onPress={() => router.push('/voice-select')}
              theme={theme}
            />
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.featureCol}>
            <FeatureCard
              icon={<Ionicons name="options-outline" size={22} color={theme.onSurface} />}
              title="Preferences"
              subtitle={`Speed ${PREFERENCES.speed} · ${PREFERENCES.pitch} · ${PREFERENCES.language}`}
              actionLabel="Edit"
              onPress={() => router.push('/prefrences')}
              theme={theme}
            />
          </Animated.View>
        </View>

        {/* Explore AI Voices */}
        <Animated.View entering={FadeInUp.duration(500).delay(360)} style={styles.exploreHeader}>
          <Text style={[styles.exploreTitle, { color: theme.onSurface }]}>Explore AI Voices</Text>
          <Pressable onPress={() => router.push('/voice-select')} style={styles.viewAll}>
            <Text style={[styles.viewAllText, { color: theme.primaryDim }]}>View All</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.primaryDim} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(420)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.voicesRow}
          >
            {VOICES.map((voice) => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                favorited={!!favorited[voice.id]}
                onToggleFavorite={() => toggleFavorite(voice.id)}
                theme={theme}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- TikTok connect form (first run) ----------

function TikTokConnectForm({
  onConnected,
  theme,
}: {
  onConnected: (username: string) => void;
  theme: ReturnType<typeof useAppTheme>['theme'];
}) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clean = value.trim().replace(/^@/, '');
  const isValid = clean.length >= 2;

  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const { width } = useWindowDimensions();



// Responsive button width
const isTablet = width >= 768;

const buttonWidth = isTablet
  ? Math.min(width * 0.55, 420)
  : Math.min(width - 40, 360);

  const handleSubmit = () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    // TODO: replace with your real API call to verify/save the TikTok handle
    setTimeout(() => {
      setSubmitting(false);
      onConnected(clean);
    }, 500);
  };

  return (
    <View style={[styles.connectCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
      <View style={[styles.connectIcon, { backgroundColor: theme.surface }]}>
        <FontAwesome5 name="tiktok" size={22} color={theme.onSurface} />
      </View>

      <Text style={[styles.connectTitle, { color: theme.onSurface }]}>Connect your TikTok</Text>
      <Text style={[styles.connectSubtitle, { color: theme.onSurfaceVariant }]}>
        Enter your TikTok username so we can pull live comments to read out with text-to-speech.
      </Text>

      <View style={[styles.connectInputRow, { borderColor: theme.outline, backgroundColor: theme.surface }]}>
        <Text style={[styles.atSign, { color: theme.onSurfaceVariant }]}>@</Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="yourusername"
          placeholderTextColor={theme.onSurfaceVariant}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.connectInput, { color: theme.onSurface }]}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
      </View>

      <Animated.View
  style={[
    scaleStyle,
    {
      width: buttonWidth,
      alignSelf: 'center',
    },
  ]}
>
  <Pressable
    onPress={handleSubmit}
    onPressIn={() => {
      if (isValid) {
        scale.value = withSpring(0.97, SPRING);
      }
    }}
    onPressOut={() => {
      scale.value = withSpring(1, SPRING);
    }}
    disabled={!isValid || submitting}
    style={[
      styles.connectButton,
      {
        backgroundColor: theme.primary,
        opacity: isValid ? 1 : 0.5,
      },
    ]}
  >
    <Text
      style={[
        styles.connectButtonText,
        {
          color: theme.buttonText,
        },
      ]}
      numberOfLines={1}
    >
      {submitting ? 'Connecting…' : 'Connect Account'}
    </Text>

    {!submitting && (
      <Ionicons
        name="arrow-forward"
        size={16}
        color={theme.buttonText}
      />
    )}
  </Pressable>
</Animated.View>
    </View>
  );
}

// ---------- Feature card (voice-changer style) ----------

function FeatureCard({
  icon,
  title,
  subtitle,
  actionLabel,
  onPress,
  theme,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionLabel: string;
  onPress: () => void;
  theme: ReturnType<typeof useAppTheme>['theme'];
}) {
  return (
    <View style={[styles.featureCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
      <View style={[styles.featureIcon, { backgroundColor: theme.surface }]}>{icon}</View>
      <Text style={[styles.featureTitle, { color: theme.onSurface }]}>{title}</Text>
      <Text style={[styles.featureSubtitle, { color: theme.onSurfaceVariant }]} numberOfLines={2}>
        {subtitle}
      </Text>
      <Pressable onPress={onPress} style={[styles.featureButton, { backgroundColor: theme.primary }]}>
        <Text style={[styles.featureButtonText, { color: theme.buttonText }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

// ---------- Voice card ----------

interface Voice {
  id: string;
  name: string;
  gender: string;
  flag: string;
  style: string;
  avatar: string;
}

function VoiceCard({
  voice,
  favorited,
  onToggleFavorite,
  theme,
}: {
  voice: Voice;
  favorited: boolean;
  onToggleFavorite: () => void;
  theme: ReturnType<typeof useAppTheme>['theme'];
}) {
  return (
    <View style={[styles.voiceCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
      <Pressable onPress={onToggleFavorite} style={[styles.heartButton, { backgroundColor: theme.surface }]} hitSlop={6}>
        <Ionicons
          name={favorited ? 'heart' : 'heart-outline'}
          size={14}
          color={favorited ? theme.primary : theme.onSurfaceVariant}
        />
      </Pressable>

      <Image source={{ uri: voice.avatar }} style={styles.voiceAvatar} />

      <View style={styles.voiceNameRow}>
        <Text style={[styles.voiceName, { color: theme.onSurface }]}>
          {voice.name} ({voice.gender})
        </Text>
        <Text style={styles.voiceFlag}>{voice.flag}</Text>
      </View>
      <Text style={[styles.voiceStyle, { color: theme.onSurfaceVariant }]}>{voice.style}</Text>

      <View style={styles.voiceFooter}>
        <Pressable style={[styles.playButton, { borderColor: theme.outline }]}>
          <Ionicons name="play" size={13} color={theme.onSurface} />
        </Pressable>
        <Pressable style={[styles.selectButton, { backgroundColor: theme.primary }]}>
          <Text style={[styles.selectButtonText, { color: theme.buttonText }]}>Select</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------- Sound wave ----------

const BAR_COUNT = 7;
const BASE_HEIGHT = 6;
const MAX_HEIGHT = 44;

function SoundWave({ active, theme }: { active: boolean; theme: ReturnType<typeof useAppTheme>['theme'] }) {
  return (
    <View style={styles.waveRow}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <WaveBar key={i} active={active} index={i} color={theme.primary} />
      ))}
    </View>
  );
}

function WaveBar({ active, index, color }: { active: boolean; index: number; color: string }) {
  const height = useSharedValue(BASE_HEIGHT);

  useEffect(() => {
    if (active) {
      const duration = 380 + index * 35;
      height.value = withRepeat(
        withSequence(
          withTiming(BASE_HEIGHT + Math.random() * (MAX_HEIGHT - BASE_HEIGHT), {
            duration,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(BASE_HEIGHT + Math.random() * (MAX_HEIGHT - BASE_HEIGHT) * 0.5, {
            duration,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(height);
      height.value = withTiming(BASE_HEIGHT, { duration: 250 });
    }
  }, [active]);

  const barStyle = useAnimatedStyle(() => ({ height: height.value }));

  return <Animated.View style={[styles.waveBar, { backgroundColor: color }, barStyle]} />;
}

// ---------- Start button ----------

function StartButton({
  isActive,
  onToggle,
  theme,
}: {
  isActive: boolean;
  onToggle: () => void;
  theme: ReturnType<typeof useAppTheme>['theme'];
}) {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const glowPulse = useSharedValue(0);
  useEffect(() => {
    if (isActive) {
      glowPulse.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      cancelAnimation(glowPulse);
      glowPulse.value = withTiming(0, { duration: 300 });
    }
  }, [isActive]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.2 + glowPulse.value * 0.35,
  }));

  return (
    <Animated.View style={[styles.startButtonWrapper, { shadowColor: theme.primary }, glowStyle]}>
      <Pressable
        onPress={onToggle}
        onPressIn={() => (scale.value = withSpring(0.94, SPRING))}
        onPressOut={() => (scale.value = withSpring(1, SPRING))}
      >
        <Animated.View style={[styles.startButton, { backgroundColor: theme.primary }, scaleStyle]}>
          <Ionicons name={isActive ? 'stop' : 'play'} size={28} color={theme.buttonText} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topAmbientGlow: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: width * 1.2,
    height: height * 0.45,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140, // clears the floating tab bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { justifyContent: 'center' },
  greeting: { fontSize: 12, marginBottom: 2 },
  username: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },

  waveSection: { alignItems: 'center', marginBottom: 28 },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: MAX_HEIGHT,
    marginBottom: 24,
  },
  waveBar: { width: 5, borderRadius: 3 },
  startButtonWrapper: {
    borderRadius: 9999,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 10,
    marginBottom: 14,
  },
  startButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveStatus: { fontSize: 13 },
  connectedHandle: { fontSize: 12, marginTop: 4 },

  connectSection: { marginBottom: 24 },
  connectCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  connectIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  connectTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  connectSubtitle: { fontSize: 12.5, textAlign: 'center', lineHeight: 18, marginBottom: 18, paddingHorizontal: 6 },
  connectInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 4,
  },
  atSign: { fontSize: 14, fontWeight: '700' },
  connectInput: { flex: 1, fontSize: 14, padding: 0 },

  connectButton: {
  width: '90%',
  minHeight: 52,

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',

  gap: 8,

  paddingHorizontal: 14,
  paddingVertical: 12,

  borderRadius: 9999,
},

connectButtonText: {
  fontSize: 14,
  fontWeight: '700',
  flexShrink: 1,
},

  proCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  proIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  proTitle: { fontSize: 19, fontWeight: '700', marginBottom: 6 },
  proSubtitle: { fontSize: 13, opacity: 0.9, marginBottom: 18, lineHeight: 18, maxWidth: '85%' },
  proButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  proButtonText: { fontSize: 13, fontWeight: '700' },

  featureGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  featureCol: { flex: 1 },
  featureCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    minHeight: 148,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  featureSubtitle: { fontSize: 11.5, lineHeight: 16, marginBottom: 14, flexGrow: 1 },
  featureButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  featureButtonText: { fontSize: 12, fontWeight: '700' },

  exploreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  exploreTitle: { fontSize: 17, fontWeight: '700' },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: '600' },

  voicesRow: { gap: 12, paddingRight: 8 },
  voiceCard: {
    width: 160,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  voiceAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginTop: 6,
    marginBottom: 10,
  },
  voiceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  voiceName: { fontSize: 13, fontWeight: '700' },
  voiceFlag: { fontSize: 12 },
  voiceStyle: { fontSize: 11.5, marginBottom: 14 },
  voiceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9999,
    alignItems: 'center',
  },
  selectButtonText: { fontSize: 12, fontWeight: '700' },
});