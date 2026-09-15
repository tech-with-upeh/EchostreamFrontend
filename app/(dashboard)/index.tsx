import { Skeleton } from "@/components/common/Skeleton";
import { useAppTheme } from "@/hooks/use-theme-color";
import { getLiveStatus } from "@/lib/api";
import type { LiveStatus } from "@/lib/schema";
import { useUserStore } from "@/store/user.store";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
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
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const SPRING = { damping: 16, stiffness: 180, mass: 0.9 };

const SELECTED_VOICE = { name: "Aria", description: "Warm & Clear · Female" };
const PREFERENCES = { speed: "1.0x", pitch: "Normal", language: "English (US)" };
const VOICES = [
  { id: "1", name: "Olivia", gender: "F", flag: "🇺🇸", style: "Young", avatar: "https://i.pravatar.cc/150?img=5" },
  { id: "2", name: "Samuel", gender: "M", flag: "🇬🇧", style: "Middle-Aged", avatar: "https://i.pravatar.cc/150?img=13" },
  { id: "3", name: "Amara", gender: "F", flag: "🇳🇬", style: "Warm", avatar: "https://i.pravatar.cc/150?img=25" },
  { id: "4", name: "Kenji", gender: "M", flag: "🇯🇵", style: "Calm", avatar: "https://i.pravatar.cc/150?img=51" },
];

export default function HomeScreen() {
  const { theme, isDark } = useAppTheme();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const loadingUser = useUserStore((state) => state.isLoading);
  const [isActive, setIsActive] = useState(false);
  const [favorited, setFavorited] = useState<Record<string, boolean>>({});
  const [tiktokUsername, setTiktokUsername] = useState<string | null>(null);
  const hasConnectedTikTok = !!tiktokUsername;
  const toggleFavorite = (id: string) => setFavorited((f) => ({ ...f, [id]: !f[id] }));
  const [Livestatus, setLivestatus] = useState<LiveStatus | null>(null);
  const [loadingLiveStatus, setLoadingLiveStatus] = useState(true);

  useEffect(() => {
    getLiveStatus()
      .then(setLivestatus)
      .catch((err) => console.error("Failed to load live status", err))
      .finally(() => setLoadingLiveStatus(false));
  }, []);

  useEffect(() => {
    if (!Livestatus) return;
    if (Livestatus.username !== "") setTiktokUsername(Livestatus.username || "");
    if (Livestatus.status === "started") setIsActive(true);
  }, [Livestatus]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={[theme.topGlow, "transparent"]} style={styles.topAmbientGlow} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
        <LinearGradient colors={[theme.bottomGlow, "transparent"]} style={styles.bottomAmbientGlow} start={{ x: 0.5, y: 1 }} end={{ x: 0.5, y: 0 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Pressable onPress={() => router.push("/settings")} style={styles.avatarWrapper}>
            <View style={[styles.avatar, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
              <Ionicons name="person" size={26} color={theme.onSurfaceVariant} />
            </View>
            <View style={[styles.badge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              <Ionicons name="settings" size={11} color={theme.buttonText} />
            </View>
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: theme.onSurfaceVariant }]}>Welcome back</Text>
            {loadingUser ? <Skeleton width={110} height={22} borderRadius={6} /> : <Text style={[styles.username, { color: theme.onSurface }]}>{user?.first_name ?? "there"}</Text>}
          </View>
        </Animated.View>

        {loadingLiveStatus ? (
          <View style={[styles.connectCard, { borderWidth: 0 }]}><Skeleton height={height * 0.4} width={width * 0.9} borderRadius={20} /></View>
        ) : hasConnectedTikTok ? (
          <Animated.View entering={FadeInUp.duration(600).delay(100).springify().damping(18)} layout={Layout.springify()} style={styles.waveSection}>
            <SoundWave active={isActive} theme={theme} />
            <StartButton isActive={isActive} onToggle={() => setIsActive((v) => !v)} theme={theme} />
            <Text style={[styles.waveStatus, { color: theme.onSurfaceVariant }]}>{isActive ? "Listening for comments…" : "Tap to start text-to-speech"}</Text>
            <Text style={[styles.connectedHandle, { color: theme.onSurfaceVariant }]}>Connected to @{tiktokUsername}</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(500).delay(100)} exiting={FadeOut.duration(200)} layout={Layout.springify()} style={styles.connectSection}>
            <TikTokConnectForm onConnected={setTiktokUsername} theme={theme} />
          </Animated.View>
        )}

        {user?.plan == "starter" ? (
          <Animated.View entering={FadeInUp.duration(500).delay(180)} layout={Layout.springify()}>
            <Pressable onPress={() => router.push("/pricing")}>
              <LinearGradient colors={[theme.primary, theme.primaryDim]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.proCard}>
                <View style={[styles.proIconBadge, { backgroundColor: theme.surface }]}><MaterialCommunityIcons name="crown" size={20} color={theme.primary} /></View>
                <Text style={[styles.proTitle, { color: theme.buttonText }]}>Upgrade to Pro</Text>
                <Text style={[styles.proSubtitle, { color: theme.buttonText }]}>Enjoy all voices and features without any restrictions.</Text>
                <View style={[styles.proButton, { backgroundColor: theme.surface }]}><Text style={[styles.proButtonText, { color: theme.primary }]}>Upgrade</Text></View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : ""}

        <View style={styles.featureGrid}>
          <Animated.View entering={FadeInUp.duration(500).delay(240)} style={styles.featureCol}>
            <FeatureCard icon={<Ionicons name="mic-outline" size={22} color={theme.onSurface} />} title="Selected Voice" subtitle={`${SELECTED_VOICE.name} · ${SELECTED_VOICE.description}`} actionLabel="Change" onPress={() => router.push("/voice-select")} theme={theme} />
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.featureCol}>
            <FeatureCard icon={<Ionicons name="options-outline" size={22} color={theme.onSurface} />} title="Preferences" subtitle={`Speed ${PREFERENCES.speed} · ${PREFERENCES.pitch} · ${PREFERENCES.language}`} actionLabel="Edit" onPress={() => router.push("/prefrences")} theme={theme} />
          </Animated.View>
        </View>
        <Animated.View entering={FadeInUp.duration(500).delay(360)} style={styles.exploreHeader}>
          <Text style={[styles.exploreTitle, { color: theme.onSurface }]}>Explore AI Voices</Text>
          <Pressable onPress={() => router.push("/voice-select")} style={styles.viewAll}><Text style={[styles.viewAllText, { color: theme.primaryDim }]}>View All</Text><Ionicons name="arrow-forward" size={14} color={theme.primaryDim} /></Pressable>
        </Animated.View>
        <Animated.View entering={FadeInUp.duration(500).delay(420)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voicesRow}>
            {VOICES.map((voice) => <VoiceCard key={voice.id} voice={voice} favorited={!!favorited[voice.id]} onToggleFavorite={() => toggleFavorite(voice.id)} theme={theme} />)}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TikTokConnectForm({ onConnected, theme }: { onConnected: (username: string) => void; theme: ReturnType<typeof useAppTheme>["theme"] }) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const clean = value.trim().replace(/^@/, "");
  const isValid = clean.length >= 2;
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const buttonWidth = isTablet ? Math.min(width * 0.55, 420) : Math.min(width - 40, 360);
  const handleSubmit = () => { if (!isValid || submitting) return; setSubmitting(true); setTimeout(() => { setSubmitting(false); onConnected(clean); }, 500); };
  return (
    <View style={[styles.connectCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
      <View style={[styles.connectIcon, { backgroundColor: theme.surface }]}><FontAwesome5 name="tiktok" size={22} color={theme.onSurface} /></View>
      <Text style={[styles.connectTitle, { color: theme.onSurface }]}>Connect your TikTok</Text>
      <Text style={[styles.connectSubtitle, { color: theme.onSurfaceVariant }]}>Enter your TikTok username so we can pull live comments to read out with text-to-speech.</Text>
      <View style={[styles.connectInputRow, { borderColor: theme.outline, backgroundColor: theme.surface }]}>
        <Text style={[styles.atSign, { color: theme.onSurfaceVariant }]}>@</Text>
        <TextInput value={value} onChangeText={setValue} placeholder="yourusername" placeholderTextColor={theme.onSurfaceVariant} autoCapitalize="none" autoCorrect={false} style={[styles.connectInput, { color: theme.onSurface }]} onSubmitEditing={handleSubmit} returnKeyType="done" />
      </View>
      <Animated.View style={[scaleStyle, { width: buttonWidth, maxWidth: "100%", alignSelf: "center" }]}>
        <Pressable onPress={handleSubmit} onPressIn={() => { if (isValid && !submitting) scale.value = withSpring(0.97, SPRING); }} onPressOut={() => { scale.value = withSpring(1, SPRING); }} disabled={!isValid || submitting} style={[styles.connectButton, { backgroundColor: theme.primary, opacity: isValid && !submitting ? 1 : 0.5 }]}>
          <Text style={[styles.connectButtonText, { color: theme.buttonText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{submitting ? "Connecting…" : "Connect Account"}</Text>
          {!submitting && <Ionicons name="arrow-forward" size={16} color={theme.buttonText} />}
        </Pressable>
      </Animated.View>
    </View>
  );
}

function FeatureCard({ icon, title, subtitle, actionLabel, onPress, theme }: { icon: React.ReactNode; title: string; subtitle: string; actionLabel: string; onPress: () => void; theme: ReturnType<typeof useAppTheme>["theme"] }) {
  return (
    <View style={[styles.featureCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
      <View style={[styles.featureIcon, { backgroundColor: theme.surface }]}>{icon}</View>
      <Text style={[styles.featureTitle, { color: theme.onSurface }]}>{title}</Text>
      <Text style={[styles.featureSubtitle, { color: theme.onSurfaceVariant }]}>{subtitle}</Text>
      <Pressable onPress={onPress} style={[styles.featureAction, { backgroundColor: theme.surface }]}><Text style={[styles.featureActionText, { color: theme.primary }]}>{actionLabel}</Text></Pressable>
    </View>
  );
}

function VoiceCard({ voice, favorited, onToggleFavorite, theme }: { voice: (typeof VOICES)[number]; favorited: boolean; onToggleFavorite: () => void; theme: ReturnType<typeof useAppTheme>["theme"] }) {
  return (
    <View style={[styles.voiceCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
      <Image source={{ uri: voice.avatar }} style={styles.voiceAvatar} />
      <Pressable onPress={onToggleFavorite} style={styles.favoriteButton}><Ionicons name={favorited ? "heart" : "heart-outline"} size={18} color={favorited ? theme.primary : theme.onSurfaceVariant} /></Pressable>
      <Text style={[styles.voiceName, { color: theme.onSurface }]}>{voice.name}</Text>
      <Text style={[styles.voiceMeta, { color: theme.onSurfaceVariant }]}>{voice.flag} {voice.style} · {voice.gender}</Text>
    </View>
  );
}

function SoundWave({ active, theme }: { active: boolean; theme: ReturnType<typeof useAppTheme>["theme"] }) {
  const progress = useSharedValue(0);
  useEffect(() => { if (active) progress.value = withRepeat(withSequence(withTiming(1, { duration: 650, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 650, easing: Easing.inOut(Easing.ease) })), -1, false); else { cancelAnimation(progress); progress.value = withTiming(0, { duration: 200 }); } return () => cancelAnimation(progress); }, [active]);
  const bars = Array.from({ length: 24 });
  return <View style={styles.waveContainer}>{bars.map((_, i) => <Animated.View key={i} style={[styles.waveBar, { backgroundColor: theme.primary, height: 18 + ((i % 5) * 10), opacity: active ? 0.55 + ((i % 4) * 0.1) : 0.25 }]} />)}</View>;
}

function StartButton({ isActive, onToggle, theme }: { isActive: boolean; onToggle: () => void; theme: ReturnType<typeof useAppTheme>["theme"] }) {
  return <Pressable onPress={onToggle} style={[styles.startButton, { backgroundColor: isActive ? theme.surfaceVariant : theme.primary, borderColor: theme.outline }]}><Ionicons name={isActive ? "stop" : "play"} size={20} color={isActive ? theme.primary : theme.buttonText} /><Text style={[styles.startButtonText, { color: isActive ? theme.onSurface : theme.buttonText }]}>{isActive ? "Stop" : "Start"}</Text></Pressable>;
}
