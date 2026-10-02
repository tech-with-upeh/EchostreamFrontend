import { Skeleton } from "@/components/common/Skeleton";
import TikTokConnectForm from "@/components/dashboard/ttconnect";
import VoiceCard, { Voice } from "@/components/voices/VoiceCard";
import { useAppTheme } from "@/hooks/use-theme-color";
import { updatePreferences } from "@/lib/api";
import { deriveVoiceInfo } from "@/lib/helpers";
import type { EdgeVoice, FishVoice } from "@/lib/schema";
import { reportError } from "@/store/error.store";
import { useGiftPreferencesStore } from "@/store/giftpref.store";
import { useLiveStatusStore } from "@/store/livestatus.store";
import { usePreferencesStore } from "@/store/preference.store";
import { useUserStore } from "@/store/user.store";
import { useVoicesStore } from "@/store/voice.store";
import { useVoicePreviewStore } from "@/store/voicepreview.store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type DisplayVoice = {
  key: string;
  playId: string; // id passed to togglePlay/preview store
  provider: "edge" | "fish";
  voice: Voice; // VoiceCard prop shape
  raw: EdgeVoice | FishVoice;
};

function buildFishAvatarUrl(coverimage: string) {
  return `https://public-platform.r2.fish.audio/cdn-cgi/image/width=128,format=webp/${coverimage}`;
}

function fishToDisplayVoice(fv: FishVoice): DisplayVoice {
  const countryCode = fv.locale?.split("-")[1] ?? "";
  const languageLabel =
    fv.languages?.[0] ?? fv.locale?.split("-")[0]?.toUpperCase() ?? "";

  return {
    key: `fish-${fv.id}`,
    playId: fv.id,
    provider: "fish",
    raw: fv,
    voice: {
      id: fv.id,
      name: fv.name,
      gender: (fv.gender as Voice["gender"]) ?? "Non-binary",
      short_name: fv.id,
      provider: "fish",
      description: fv.description,
      languageLabel,
      countryCode,
      avatarUri: fv.coverimage ? buildFishAvatarUrl(fv.coverimage) : undefined,
    },
  };
}

function edgeToDisplayVoice(ev: EdgeVoice): DisplayVoice {
  return {
    key: `edge-${ev.short_name}`,
    playId: ev.short_name,
    provider: "edge",
    raw: ev,
    voice: {
      id: ev.id,
      name: ev.name,
      gender: ev.gender,
      short_name: ev.short_name,
      provider: "edge",
    },
  };
}
const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const { theme, isDark } = useAppTheme();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const fetchuser = useUserStore((state) => state.fetchUser);
  const loadingUser = useUserStore((state) => state.isLoading);
  const [isActive, setIsActive] = useState(false);
  const [favorited, setFavorited] = useState<Record<string, boolean>>({});
  const [tiktokUsername, setTiktokUsername] = useState<string | null>(null);
  const Livestatus = useLiveStatusStore((state) => state.status);
  const loadingLiveStatus = useLiveStatusStore((state) => state.isLoading);
  const fetchLiveStatus = useLiveStatusStore((state) => state.fetchLiveStatus);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const hasConnectedTikTok = !!tiktokUsername;
  const toggleFavorite = (id: string) =>
    setFavorited((f) => ({ ...f, [id]: !f[id] }));

  const preferences = usePreferencesStore((state) => state.preferences);

  const canUseFish = user?.plan === "essential" || user?.plan === "pro";

  const fetchPreferences = usePreferencesStore(
    (state) => state.fetchPreferences,
  );

  const fetchgiftPreferences = useGiftPreferencesStore(
    (state) => state.fetchGiftspref,
  );
  const voices = useVoicesStore((state) => state.voices);
  const loadingVoices = useVoicesStore((state) => state.isLoading);
  const fetchVoices = useVoicesStore((state) => state.fetchVoices);

  const { playingVoiceId, loadingVoiceId, playPreview, stopPreview } =
    useVoicePreviewStore();

  const [avatarFailed, setAvatarFailed] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Reset whenever the image URL changes
  useEffect(() => {
    setAvatarFailed(false);
    setAvatarLoading(!!user?.tt_image);
  }, [user?.tt_image]);

  useEffect(() => {
    if (!user) return;

    fetchVoices().catch((err) => reportError("Failed to load voices: " + err));
  }, [user, fetchVoices]);

  useEffect(() => {
    if (!user) return;

    fetchPreferences().catch((err) =>
      reportError("Failed to load preferences: " + err),
    );
  }, [user, fetchPreferences]);
  useEffect(() => {
    fetchLiveStatus();
  }, []);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        //fetchVoices(true),
        fetchuser(true),
        fetchPreferences(true),
        fetchLiveStatus(true),

        fetchgiftPreferences(true),
      ]);
    } catch (err) {
      reportError("Refresh failed: " + err);
    } finally {
      setRefreshing(false);
    }
  };

  const togglePlay = (id: string, provider: "edge" | "fish") => {
    if (playingVoiceId === id) {
      stopPreview();
    } else {
      playPreview(id, provider);
    }
    setPlayingId((current) => (current === id ? null : id));
  };

  const handleSelect = (dv: DisplayVoice) => {
    const payload =
      dv.provider === "fish"
        ? {
            tts_provider: "fish" as const,
            fish_voice_id: (dv.raw as FishVoice).id,
            fish_model: "s2-pro" as const,
            voice: dv.voice.name,
          }
        : {
            tts_provider: "edge" as const,
            voice: (dv.raw as EdgeVoice).short_name,
          };

    return updatePreferences(payload)
      .catch((err) => {
        reportError("Failed to update preferences: " + err);
      })
      .then(() =>
        fetchPreferences(true).catch((err) =>
          reportError("Failed to reload preferences: " + err),
        ),
      );
  };

  const displayVoices: DisplayVoice[] = React.useMemo(() => {
    const fishVoices = (voices?.fish ?? [])
      .slice()
      .filter(
        (v) =>
          v.languages?.some((l) => l.toLowerCase().startsWith("en")) ||
          v.locale?.startsWith("en"),
      )
      .slice(0, 5)
      .map(fishToDisplayVoice);

    const edgeVoices = (voices?.edge ?? [])
      .slice()
      .filter((v) => v.locale.startsWith("en-"))
      .sort((a, b) => a.locale.localeCompare(b.locale))
      .slice(0, 3)
      .map(edgeToDisplayVoice);

    return [...fishVoices, ...edgeVoices];
  }, [voices]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={theme.bgGradient}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[theme.topGlow, "transparent"]}
          style={styles.topAmbientGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={[theme.bottomGlow, "transparent"]}
          style={styles.bottomAmbientGlow}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.header}
        >
          <Pressable
            onPress={() => router.push("/settings")}
            style={styles.avatarWrapper}
          >
            {user?.tt_image && !avatarFailed ? (
              <View
                style={[
                  styles.avatarImageWrap,
                  {
                    backgroundColor: theme.surfaceVariant,
                    borderColor: "transparent",
                    boxShadow: isDark
                      ? "0px 0px 18px #0000004d"
                      : "0px 0px 18px #8681814d",
                  },
                ]}
              >
                <Image
                  source={{ uri: user.tt_image }}
                  style={styles.avatarImage}
                  onLoadEnd={() => setAvatarLoading(false)}
                  onError={() => {
                    setAvatarFailed(true);
                    setAvatarLoading(false);
                  }}
                />
                {avatarLoading && (
                  <View style={StyleSheet.absoluteFill}>
                    <Skeleton width={52} height={52} borderRadius={26} />
                  </View>
                )}
              </View>
            ) : (
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: theme.surfaceVariant,
                    borderWidth: 0,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 5,
                  },
                ]}
              >
                <Ionicons
                  name="person"
                  size={26}
                  color={theme.onSurfaceVariant}
                />
              </View>
            )}
            <View
              style={[
                styles.badge,
                {
                  borderWidth: 0,
                },
              ]}
            >
              <Ionicons name="settings" size={11} color={theme.primary} />
            </View>
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: theme.onSurfaceVariant }]}>
              Welcome back
            </Text>
            {loadingUser ? (
              <Skeleton width={110} height={22} borderRadius={6} />
            ) : (
              <Text style={[styles.username, { color: theme.onSurface }]}>
                {user?.first_name ?? "there"}
              </Text>
            )}
          </View>
        </Animated.View>

        {loadingLiveStatus ? (
          <View style={[styles.connectCard, { borderWidth: 0 }]}>
            <Skeleton
              height={height * 0.4}
              width={width * 0.9}
              borderRadius={20}
            />
          </View>
        ) : hasConnectedTikTok ? (
          <Animated.View
            entering={FadeInUp.duration(600).delay(100).springify().damping(18)}
            layout={Layout.springify()}
            style={styles.waveSection}
          >
            <SoundWave active={isActive} theme={theme} />
            <StartButton
              isActive={isActive}
              onToggle={() => setIsActive((v) => !v)}
              theme={theme}
            />
            <Text
              style={[styles.waveStatus, { color: theme.onSurfaceVariant }]}
            >
              {isActive
                ? "Listening for comments…"
                : "Tap to start text-to-speech"}
            </Text>
            <Text
              style={[
                styles.connectedHandle,
                { color: theme.onSurfaceVariant },
              ]}
            >
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

        {user?.plan == "starter" && (
          <Animated.View
            entering={FadeInUp.duration(500).delay(180)}
            layout={Layout.springify()}
          >
            <Pressable onPress={() => router.push("/pricing")}>
              <LinearGradient
                colors={[theme.primary, theme.primaryDim]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.proCard}
              >
                <View
                  style={[
                    styles.proIconBadge,
                    { backgroundColor: theme.surface },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="crown"
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <Text style={[styles.proTitle, { color: theme.buttonText }]}>
                  Upgrade to Pro
                </Text>
                <Text style={[styles.proSubtitle, { color: theme.buttonText }]}>
                  Enjoy all voices and features without any restrictions.
                </Text>
                <View
                  style={[styles.proButton, { backgroundColor: theme.surface }]}
                >
                  <Text
                    style={[styles.proButtonText, { color: theme.primary }]}
                  >
                    Upgrade
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        <View style={styles.featureGrid}>
          <Animated.View
            entering={FadeInUp.duration(500).delay(240)}
            style={styles.featureCol}
          >
            <FeatureCard
              icon={
                <Ionicons
                  name="mic-outline"
                  size={22}
                  color={theme.onSurface}
                />
              }
              title="Selected Voice"
              subtitle={`${preferences?.tts_provider == "fish" ? preferences?.voice : deriveVoiceInfo(preferences?.voice || "").name} · ${deriveVoiceInfo(preferences?.voice || "").description == undefined ? "Neural" : deriveVoiceInfo(preferences?.voice || "").description} · Male`}
              actionLabel="Change"
              onPress={() => router.push("/voice-select")}
              theme={theme}
            />
          </Animated.View>
          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            style={styles.featureCol}
          >
            <FeatureCard
              icon={
                <Ionicons
                  name="options-outline"
                  size={22}
                  color={theme.onSurface}
                />
              }
              title="Preferences"
              subtitle={`Speed ${preferences?.speed} · ${preferences?.pitch} · ${deriveVoiceInfo(preferences?.voice || "").language}`}
              actionLabel="Edit"
              onPress={() => router.push("/prefrences")}
              theme={theme}
            />
          </Animated.View>
        </View>
        <Animated.View
          entering={FadeInUp.duration(500).delay(360)}
          style={styles.exploreHeader}
        >
          <Text style={[styles.exploreTitle, { color: theme.onSurface }]}>
            Explore AI Voices
          </Text>
          <Pressable
            onPress={() => router.push("/voice-select")}
            style={styles.viewAll}
          >
            <Text style={[styles.viewAllText, { color: theme.primaryDim }]}>
              View All
            </Text>
            <Ionicons name="arrow-forward" size={14} color={theme.primaryDim} />
          </Pressable>
        </Animated.View>
        <Animated.View entering={FadeInUp.duration(500).delay(420)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.voicesRow}
          >
            {loadingVoices
              ? Array.from({ length: 5 }).map((_, index) => (
                  <View
                    style={[
                      styles.voiceCard,
                      {
                        height: 180,
                        borderWidth: 0,
                        display: "flex",
                        gap: 5,
                        backgroundColor: theme.surfaceVariant,
                        justifyContent: "center",
                        alignItems: "center",
                        shadowColor: "#000",
                        shadowOffset: { width: 8, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 5,
                      },
                    ]}
                    key={index}
                  >
                    <Skeleton height={68} width={68} borderRadius={34} />
                    <Skeleton height={20} width={100} borderRadius={6} />
                    <Skeleton height={20} width={100} borderRadius={6} />
                    <View style={[styles.voiceFooter, { marginTop: 0 }]}>
                      <Skeleton height={25} width={25} borderRadius={30} />
                      <Skeleton height={30} width={70} borderRadius={6} />
                    </View>
                  </View>
                ))
              : displayVoices.map((dv) => (
                  <VoiceCard
                    key={dv.key}
                    voice={dv.voice}
                    favorited={!!favorited[dv.playId]}
                    isPlaying={playingVoiceId === dv.playId}
                    isPlayingPreviewLoading={loadingVoiceId === dv.playId}
                    onToggleFavorite={() => toggleFavorite(dv.playId)}
                    onTogglePlay={() => togglePlay(dv.playId, dv.provider)}
                    onSelect={() => handleSelect(dv)}
                    locked={dv.provider === "fish" && !canUseFish}
                    onUpgradePress={() => router.push("/pricing")}
                    theme={theme}
                  />
                ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  theme: ReturnType<typeof useAppTheme>["theme"];
}) {
  const user = useUserStore((state) => state.user);
  const preferences = usePreferencesStore((state) => state.preferences);
  const loadingpreferences = usePreferencesStore((state) => state.isLoading);
  const fetchPreferences = usePreferencesStore(
    (state) => state.fetchPreferences,
  );
  useEffect(() => {
    if (!user) return;

    fetchPreferences().catch((err) =>
      reportError("Failed to load preferences" + err),
    );
  }, [user, fetchPreferences]);
  return (
    <View
      style={[
        styles.featureCard,
        {
          backgroundColor: theme.surfaceVariant,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 5,
        },
      ]}
    >
      <View style={[styles.featureIcon]}>{icon}</View>
      <Text style={[styles.featureTitle, { color: theme.onSurface }]}>
        {title}
      </Text>
      {loadingpreferences ? (
        <Skeleton width={50} height={20} borderRadius={8} />
      ) : (
        <Text
          style={[styles.featureSubtitle, { color: theme.onSurfaceVariant }]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      )}

      <Pressable
        onPress={onPress}
        style={[styles.featureAction, { backgroundColor: theme.primary }]}
      >
        <Text style={[styles.featureActionText, { color: theme.buttonText }]}>
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function SoundWave({
  active,
  theme,
}: {
  active: boolean;
  theme: ReturnType<typeof useAppTheme>["theme"];
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    if (active)
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 650, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 650, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    else {
      cancelAnimation(progress);
      progress.value = withTiming(0, { duration: 200 });
    }
    return () => cancelAnimation(progress);
  }, [active]);
  return (
    <View style={styles.waveContainer}>
      {Array.from({ length: 24 }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            {
              backgroundColor: theme.primary,
              height: 18 + (i % 5) * 10,
              opacity: active ? 0.55 + (i % 4) * 0.1 : 0.25,
            },
          ]}
        />
      ))}
    </View>
  );
}

function StartButton({
  isActive,
  onToggle,
  theme,
}: {
  isActive: boolean;
  onToggle: () => void;
  theme: ReturnType<typeof useAppTheme>["theme"];
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.startButton,
        {
          backgroundColor: isActive ? theme.surfaceVariant : theme.primary,
          borderColor: theme.outline,
        },
      ]}
    >
      <Ionicons
        name={isActive ? "stop" : "play"}
        size={20}
        color={isActive ? theme.primary : theme.buttonText}
      />
      <Text
        style={[
          styles.startButtonText,
          { color: isActive ? theme.onSurface : theme.buttonText },
        ]}
      >
        {isActive ? "Stop" : "Start"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topAmbientGlow: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.45,
    borderRadius: width,
  },
  bottomAmbientGlow: {
    position: "absolute",
    bottom: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.35,
    borderRadius: width,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 140 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImageWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarImage: { width: 52, height: 52, borderRadius: 26 },
  badge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { justifyContent: "center" },
  greeting: { fontSize: 12, marginBottom: 2 },
  username: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  waveSection: { alignItems: "center", marginBottom: 28 },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 58,
    marginBottom: 24,
  },
  waveBar: { width: 5, borderRadius: 3 },
  startButton: {
    minWidth: 112,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  startButtonText: { fontSize: 14, fontWeight: "700" },
  waveStatus: { fontSize: 13 },
  connectedHandle: { fontSize: 12, marginTop: 4 },
  connectSection: { marginBottom: 24 },
  connectCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  proCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  proIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  proTitle: { fontSize: 19, fontWeight: "700", marginBottom: 6 },
  proSubtitle: {
    fontSize: 13,
    opacity: 0.9,
    marginBottom: 18,
    lineHeight: 18,
    maxWidth: "85%",
  },
  proButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  proButtonText: { fontSize: 13, fontWeight: "700" },
  featureGrid: { flexDirection: "row", gap: 12, marginBottom: 28 },
  featureCol: { flex: 1 },
  featureCard: {
    borderRadius: 18,

    padding: 16,
    minHeight: 148,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featureTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  featureSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 14,
    flexGrow: 1,
  },
  featureAction: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  featureActionText: { fontSize: 12, fontWeight: "700" },
  exploreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  exploreTitle: { fontSize: 17, fontWeight: "700" },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
  voicesRow: { gap: 12, paddingRight: 20 },
  voiceCard: {
    width: 164,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    position: "relative",
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  voiceAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignSelf: "center",
    marginBottom: 10,
  },
  voiceNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  voiceName: { fontSize: 12.5, fontWeight: "700", flex: 1 },
  voiceFlag: { fontSize: 14 },
  voiceMeta: { fontSize: 11, marginTop: 3 },
  voiceFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  selectButtonText: { fontSize: 12, fontWeight: "700" },
});
