import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

// Premium accent — kept distinct from `theme.primary` so "crown = premium"
// reads as its own signal rather than blending into your action color.
const PREMIUM_ACCENT = '#FFB961';

export interface Voice {
  id: string;
  name: string;
  gender: 'M' | 'F';
  flag: string;
  style: string;
  avatar: string;
  isPremium?: boolean;
  avatarTint: string;
}

interface VoiceCardProps {
  voice: Voice;
  favorited: boolean;
  isPlaying: boolean;
  onToggleFavorite: () => void;
  onTogglePlay: () => void;
  onSelect: () => void;
}

export default function VoiceCard({
  voice,
  favorited,
  isPlaying,
  onToggleFavorite,
  onTogglePlay,
  onSelect,
}: VoiceCardProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
      {voice.isPremium && (
        <View style={styles.crownBadge}>
          <Ionicons name="ribbon" size={16} color={PREMIUM_ACCENT} />
        </View>
      )}

      <Pressable onPress={onToggleFavorite} style={[styles.heartButton, { backgroundColor: theme.surface }]} hitSlop={6}>
        <Ionicons
          name={favorited ? 'heart' : 'heart-outline'}
          size={14}
          color={favorited ? theme.primary : theme.onSurfaceVariant}
        />
      </Pressable>

      <View style={[styles.avatarRing, { backgroundColor: voice.avatarTint }]}>
        <Image source={{ uri: voice.avatar }} style={styles.avatar} />
      </View>

      <View style={styles.nameRow}>
        <Text style={[styles.name, { color: theme.onSurface }]} numberOfLines={1}>
          {voice.name} ({voice.gender})
        </Text>
        <Text style={styles.flag}>{voice.flag}</Text>
      </View>
      <Text style={[styles.style, { color: theme.onSurfaceVariant }]}>{voice.style}</Text>

      <View style={styles.footer}>
        {isPlaying ? (
          <Pressable
            onPress={onTogglePlay}
            style={[styles.playingPill, { backgroundColor: theme.surface, borderColor: theme.outline }]}
          >
            <Ionicons name="pause" size={13} color={theme.primary} />
            <MiniWave color={theme.primary} />
          </Pressable>
        ) : (
          <Pressable onPress={onTogglePlay} style={[styles.playButton, { borderColor: theme.outline }]}>
            <Ionicons name="play" size={13} color={theme.onSurface} />
          </Pressable>
        )}

        <Pressable onPress={onSelect} style={[styles.selectButton, { backgroundColor: theme.primary }]}>
          <Text style={[styles.selectButtonText, { color: theme.buttonText }]}>Select</Text>
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
        withTiming(4 + Math.random() * 10, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => cancelAnimation(height);
  }, []);

  const barStyle = useAnimatedStyle(() => ({ height: height.value }));

  return <Animated.View style={[styles.miniWaveBar, { backgroundColor: color }, barStyle]} />;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  crownBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
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
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  name: { fontSize: 13, fontWeight: '700' },
  flag: { fontSize: 12 },
  style: { fontSize: 11.5, marginBottom: 14 },
  footer: {
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
  playingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  miniWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
  },
  selectButtonText: { fontSize: 12, fontWeight: '700' },
});