import { useAppTheme } from "@/hooks/use-theme-color";
import { deriveVoiceInfo, parseLocale } from "@/lib/helpers";
import { ApiError, getAvatarImage } from "@/lib/pollination";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CountryFlag from "react-native-country-flag";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Skeleton } from "../common/Skeleton";

const PREMIUM_ACCENT = "#FFB961";

type Gender = "Male" | "Female" | "Non-binary";

export interface Voice {
  id?: string | null;
  name: string | null;
  gender: Gender;
  isPremium?: boolean | false;
  avatarTint?: string;
  // Edge voices are keyed and derived from this (e.g. "en-US-JennyNeural").
  // Fish voices don't have this format — leave it as the fish id/empty and
  // rely on the fish-native fields below instead.
  short_name: string;

  // Set this to "fish" to use the fields below directly instead of
  // deriving everything from `short_name`. Defaults to "edge" behavior.
  provider?: "edge" | "fish";
  description?: string;
  languageLabel?: string;
  countryCode?: string;
  avatarUri?: string;
}

interface VoiceCardProps {
  voice: Voice;
  favorited: boolean;
  isPlaying: boolean;
  isPlayingPreviewLoading: boolean;
  onToggleFavorite: () => void;
  onTogglePlay: () => void;
  onSelect: () => void | Promise<void>;
  theme: any;
  // Plan-gating: whether the *current user's plan* can select this voice.
  // Not a property of the voice itself — the same fish voice is locked for
  // a starter user and unlocked for essential/pro, so this comes from the
  // caller (HomeScreen), not from `voice`.
  locked?: boolean;
  onUpgradePress?: () => void;
}

export default function VoiceCard({
  voice,
  favorited,
  isPlaying,
  isPlayingPreviewLoading,
  onToggleFavorite,
  onTogglePlay,
  onSelect,
  theme,
  locked = false,
  onUpgradePress,
}: VoiceCardProps) {
  const isFish = voice.provider === "fish";
  const { isDark } = useAppTheme();
  const [gender] = useState<Gender>(voice.gender);
  const [description, setDescription] = useState(
    isFish ? (voice.description ?? "") : "Neural",
  );
  const [avatarUri, setAvatarUri] = useState<string | null>(
    isFish ? (voice.avatarUri ?? null) : null,
  );
  const [loading, setLoading] = useState(false);
  const [loadingSelect, setLoadingSelect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<string>("");
  const [Lang, setLang] = useState<string>(
    isFish ? (voice.languageLabel ?? "") : "",
  );

  // Fish voices already carry name/description/language/avatar as real
  // data — no derivation or AI avatar generation needed for them.
  useEffect(() => {
    if (isFish) return;

    let cancelled = false;
    const { language, country } = parseLocale(
      deriveVoiceInfo(voice.short_name).languageCode +
        "-" +
        deriveVoiceInfo(voice.short_name).countryCode,
    );
    setCountry(country);
    setLang(language);
    setDescription(deriveVoiceInfo(voice.short_name).description);

    const generateAvatar = async () => {
      setLoading(true);
      setError(null);

      try {
        const base64ImageUri = await getAvatarImage({
          gender,
          country,
          language,
          description: description.trim() || undefined,
          model: "flux",
        });

        if (!cancelled) {
          setAvatarUri(base64ImageUri);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(`API Error (${err.status}): ${err.message}`);
          } else {
            setError("An unexpected network error occurred.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    generateAvatar();

    return () => {
      cancelled = true;
    };
  }, [voice.short_name, isFish]);

  const computedName = isFish
    ? (voice.name ?? "")
    : deriveVoiceInfo(voice.short_name).name.slice(0, -6);

  const countryCode = isFish
    ? (voice.countryCode ?? "")
    : deriveVoiceInfo(voice.short_name).countryCode;

  const handlePrimaryAction = async () => {
    if (loadingSelect) return; // ignore double taps

    if (locked) {
      onUpgradePress?.();
      return;
    }

    setLoadingSelect(true);
    try {
      await onSelect();
    } finally {
      setLoadingSelect(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surfaceVariant,
          borderColor: "transparent",
          boxShadow: isDark
            ? "0px 0px 18px #0000004d"
            : "0px 0px 18px #8681814d",
        },
      ]}
    >
      {locked ? (
        <View style={[styles.lockBadge, { backgroundColor: theme.surface }]}>
          <Ionicons
            name="lock-closed"
            size={12}
            color={theme.onSurfaceVariant}
          />
        </View>
      ) : (
        voice.isPremium && (
          <View style={styles.crownBadge}>
            <Ionicons name="ribbon" size={16} color={PREMIUM_ACCENT} />
          </View>
        )
      )}

      <Pressable
        onPress={onToggleFavorite}
        style={[styles.heartButton, { backgroundColor: theme.surface }]}
        hitSlop={6}
      >
        <Ionicons
          name={favorited ? "heart" : "heart-outline"}
          size={14}
          color={favorited ? theme.primary : theme.onSurfaceVariant}
        />
      </Pressable>

      <View
        style={[
          styles.avatarRing,
          { backgroundColor: voice.avatarTint || "transparent" },
          locked && styles.avatarRingLocked,
        ]}
      >
        {loading ? (
          <Skeleton height={68} width={68} borderRadius={34} />
        ) : (
          <Image
            source={{ uri: avatarUri || "https://i.pravatar.cc/150?img=55" }}
            style={[styles.avatar, locked && styles.avatarLocked]}
          />
        )}
      </View>

      <View style={styles.nameRow}>
        <Text
          style={[styles.name, { color: theme.onSurface }]}
          numberOfLines={1}
        >
          {computedName} ({voice.gender})
        </Text>

        {countryCode && (
          <CountryFlag
            isoCode={countryCode}
            size={12}
            style={styles.flagOffset}
          />
        )}
      </View>

      <Text
        style={[styles.style, { color: theme.onSurfaceVariant }]}
        numberOfLines={1}
      >
        {locked
          ? "Essential & Pro"
          : `${description ? description : "Neutral"} · ${Lang}`}
      </Text>

      <View style={styles.footer}>
        {isPlayingPreviewLoading ? (
          <View
            style={[
              styles.playingPill,
              {
                backgroundColor: theme.surface,
                borderWidth: 0,
              },
            ]}
          >
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : isPlaying ? (
          <Pressable
            onPress={onTogglePlay}
            style={[
              styles.playingPill,
              {
                backgroundColor: theme.surface,
                borderColor: theme.outline,
              },
            ]}
          >
            <Ionicons name="pause" size={13} color={theme.primary} />
            <MiniWave color={theme.primary} />
          </Pressable>
        ) : (
          <Pressable
            onPress={onTogglePlay}
            style={[
              styles.playButton,
              { backgroundColor: locked ? theme.primaryDim : theme.primary },
            ]}
          >
            <Ionicons name="play" size={13} color={theme.buttonText} />
          </Pressable>
        )}

        <Pressable
          onPress={handlePrimaryAction}
          disabled={loadingSelect}
          style={[
            styles.selectButton,
            { backgroundColor: locked ? theme.primaryDim : theme.primary },
          ]}
        >
          {locked ? (
            <View style={styles.upgradeRow}>
              <Ionicons name="lock-closed" size={11} color={theme.buttonText} />
              <Text
                style={[styles.selectButtonText, { color: theme.buttonText }]}
              >
                Upgrade
              </Text>
            </View>
          ) : loadingSelect ? (
            <ActivityIndicator size="small" color={theme.buttonText} />
          ) : (
            <Text
              style={[styles.selectButtonText, { color: theme.buttonText }]}
            >
              Select
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function MiniWave({ color }: { color: string }) {
  return (
    <View style={styles.miniWaveRow}>
      {[0, 1, 2].map((i) => (
        <MiniWaveBar key={i} index={i} color={color} />
      ))}
    </View>
  );
}

function MiniWaveBar({ index, color }: { index: number; color: string }) {
  const height = useSharedValue(4);

  useEffect(() => {
    const duration = 300 + index * 60;
    height.value = withRepeat(
      withSequence(
        withTiming(4 + Math.random() * 10, {
          duration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(3, { duration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(height);
  }, []);

  const barStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View
      style={[styles.miniWaveBar, { backgroundColor: color }, barStyle]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    width: 164,
    minWidth: 150,
    maxWidth: 180,
    borderRadius: 18,

    padding: 16,
    alignItems: "center",
  },
  crownBadge: { position: "absolute", top: 10, left: 10, zIndex: 1 },
  lockBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  heartButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  avatarRingLocked: {
    opacity: 0.5,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarLocked: {
    opacity: 0.6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  name: { fontSize: 13, fontWeight: "700" },
  flag: { fontSize: 12 },
  style: { fontSize: 11.5, marginBottom: 14 },
  footer: { flexDirection: "row", alignItems: "center", gap: 8, width: "100%" },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",
  },
  playingPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  miniWaveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 14,
  },
  miniWaveBar: { width: 2.5, borderRadius: 2 },
  selectButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9999,
    alignItems: "center",
  },
  selectButtonText: { fontSize: 12, fontWeight: "700" },
  upgradeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  flagOffset: { marginLeft: 6, borderRadius: 2 },
});
