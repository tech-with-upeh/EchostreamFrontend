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

// Premium accent — kept distinct from `theme.primary` so "crown = premium"
// reads as its own signal rather than blending into your action color.
const PREMIUM_ACCENT = "#FFB961";

type Gender = "Male" | "Female" | "Non-binary";

export interface Voice {
  id?: string | null;
  name: string | null;
  gender: Gender;
  isPremium?: boolean | false;
  avatarTint?: string;
  short_name: string;
}

interface VoiceCardProps {
  voice: Voice;
  favorited: boolean;
  isPlaying: boolean;
  isPlayingPreviewLoading: boolean;
  onToggleFavorite: () => void;
  onTogglePlay: () => void;
  onSelect: () => void;
  theme: any;
}

// export default function VoiceCard({
//   voice,
//   favorited,
//   isPlaying,
//   onToggleFavorite,
//   onTogglePlay,
//   onSelect,
// }: VoiceCardProps) {
//   const { theme } = useAppTheme();

//   return (
//     <View style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
//       {voice.isPremium && (
//         <View style={styles.crownBadge}>
//           <Ionicons name="ribbon" size={16} color={PREMIUM_ACCENT} />
//         </View>
//       )}

//       <Pressable onPress={onToggleFavorite} style={[styles.heartButton, { backgroundColor: theme.surface }]} hitSlop={6}>
//         <Ionicons
//           name={favorited ? 'heart' : 'heart-outline'}
//           size={14}
//           color={favorited ? theme.primary : theme.onSurfaceVariant}
//         />
//       </Pressable>

//       <View style={[styles.avatarRing, { backgroundColor: voice.avatarTint }]}>
//         <Image source={{ uri: voice.avatar }} style={styles.avatar} />
//       </View>

//       <View style={styles.nameRow}>
//         <Text style={[styles.name, { color: theme.onSurface }]} numberOfLines={1}>
//           {voice.name} ({voice.gender})
//         </Text>
//         <Text style={styles.flag}>{voice.flag}</Text>
//       </View>
//       <Text style={[styles.style, { color: theme.onSurfaceVariant }]}>{voice.style}</Text>

//       <View style={styles.footer}>
//         {isPlaying ? (
//           <Pressable
//             onPress={onTogglePlay}
//             style={[styles.playingPill, { backgroundColor: theme.surface, borderColor: theme.outline }]}
//           >
//             <Ionicons name="pause" size={13} color={theme.primary} />
//             <MiniWave color={theme.primary} />
//           </Pressable>
//         ) : (
//           <Pressable onPress={onTogglePlay} style={[styles.playButton, { borderColor: theme.outline }]}>
//             <Ionicons name="play" size={13} color={theme.onSurface} />
//           </Pressable>
//         )}

//         <Pressable onPress={onSelect} style={[styles.selectButton, { backgroundColor: theme.primary }]}>
//           <Text style={[styles.selectButtonText, { color: theme.buttonText }]}>Select</Text>
//         </Pressable>
//       </View>
//     </View>
//   );
// }

export default function VoiceCard({
  voice,
  favorited,
  isPlaying,
  isPlayingPreviewLoading,
  onToggleFavorite,
  onTogglePlay,
  onSelect,
  theme,
}: VoiceCardProps) {
  // --- 1. Pure Functional/State Implementations from Component 1 ---
  const [gender, setGender] = useState<Gender>(voice.gender);
  const [description, setDescription] = useState("Neural");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<string>("");
  const [Lang, setLang] = useState<string>("");

  useEffect(() => {
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
  }, [voice.short_name]);

  // Helper properties derived from Component 1's processing
  const computedName = deriveVoiceInfo(voice.short_name).name.slice(0, -6);
  const countryCode = deriveVoiceInfo(voice.short_name).countryCode;

  // --- 2. Render Interface from Component 2 ---
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surfaceVariant, borderColor: theme.outline },
      ]}
    >
      {/* Premium Badge layout condition from Component 2 */}
      {voice.isPremium && (
        <View style={styles.crownBadge}>
          <Ionicons name="ribbon" size={16} color={PREMIUM_ACCENT} />
        </View>
      )}

      {/* Favorite Button Layout */}
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

      {/* Avatar Container with Conditional Loading State from Component 1 */}
      <View
        style={[
          styles.avatarRing,
          { backgroundColor: voice.avatarTint || "transparent" },
        ]}
      >
        {loading ? (
          <Skeleton height={68} width={68} borderRadius={34} />
        ) : (
          <Image
            source={{ uri: avatarUri || "https://i.pravatar.cc/150?img=55" }}
            style={styles.avatar}
          />
        )}
      </View>

      {/* Text Rows using formatting combinations */}
      <View style={styles.nameRow}>
        <Text
          style={[styles.name, { color: theme.onSurface }]}
          numberOfLines={1}
        >
          {computedName} ({voice.gender})
        </Text>

        {/* Rendered Native Country Flag component in place of text emoji */}
        {countryCode && (
          <CountryFlag
            isoCode={countryCode}
            size={12}
            style={styles.flagOffset}
          />
        )}
      </View>

      {/* Meta descriptions containing parsed languages */}
      <Text style={[styles.style, { color: theme.onSurfaceVariant }]}>
        {description} · {Lang}
      </Text>

      {/* Footer Play and Select Actions with Active States */}
      <View style={styles.footer}>
        {isPlayingPreviewLoading ? (
          <View
            style={[
              styles.playingPill,
              { backgroundColor: theme.surface, borderColor: theme.outline },
            ]}
          >
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : isPlaying ? (
          <Pressable
            onPress={onTogglePlay}
            style={[
              styles.playingPill,
              { backgroundColor: theme.surface, borderColor: theme.outline },
            ]}
          >
            <Ionicons name="pause" size={13} color={theme.primary} />
            <MiniWave color={theme.primary} />
          </Pressable>
        ) : (
          <Pressable
            onPress={onTogglePlay}
            style={[styles.playButton, { borderColor: theme.outline }]}
          >
            <Ionicons name="play" size={13} color={theme.onSurface} />
          </Pressable>
        )}

        <Pressable
          onPress={onSelect}
          style={[styles.selectButton, { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.selectButtonText, { color: theme.buttonText }]}>
            Select
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------- Mini waveform (shown inline while a card is previewing) ----------

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
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  crownBadge: {
    position: "absolute",
    top: 10,
    left: 10,
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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
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
    borderWidth: 1,
  },
  miniWaveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 14,
  },
  miniWaveBar: {
    width: 2.5,
    borderRadius: 2,
  },
  selectButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9999,
    alignItems: "center",
  },
  selectButtonText: { fontSize: 12, fontWeight: "700" },
  flagOffset: {
    marginLeft: 6,
    borderRadius: 2, // Cleans up flag corners natively
  },
});
