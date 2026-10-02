import { useAppTheme } from "@/hooks/use-theme-color";
import { uploadVoiceSample } from "@/lib/api";
import { reportError } from "@/store/error.store";
import { useUserStore } from "@/store/user.store";
import { Ionicons } from "@expo/vector-icons";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const BAR_COUNT = 40;

const SCRIPTS = [
  "The quick brown fox jumps over the lazy dog, while the morning sun rises slowly over the quiet hills.",
  "Every voice has its own rhythm, its own color, its own way of telling a story to the world.",
  "She walked along the shoreline, counting waves and wondering what tomorrow might bring her way.",
];

const MIN_DURATION_MS = 6_000;
const MAX_DURATION_MS = 30_000;

// Stable, natural-looking mix of up/down bar directions.
const BAR_DIRECTIONS: ("up" | "down")[] = Array.from(
  { length: BAR_COUNT },
  (_, i) => {
    const pseudo = Math.abs(Math.sin(i * 12.9898)) % 1;
    return pseudo > 0.5 ? "up" : "down";
  },
);

type RecordState = "idle" | "recording" | "preview" | "uploading" | "error";

export default function RecordVoiceScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });

  const recorderState = useAudioRecorderState(recorder, 200);
  const user = useUserStore((state) => state.user);

  // Latest recorder state, readable from intervals/cleanups without re-running effects.
  const recorderStateRef = useRef(recorderState);
  recorderStateRef.current = recorderState;

  const [state, setState] = useState<RecordState>("idle");
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [script, setScript] = useState(SCRIPTS[0]);
  const [waveData, setWaveData] = useState<number[]>(() =>
    Array(BAR_COUNT).fill(0),
  );

  // The recorder resets durationMillis to 0 after stop(), so we keep our own copy.
  const [recordedMs, setRecordedMs] = useState(0);
  const startedAtRef = useRef(0);
  const stoppingRef = useRef(false);

  const player = useAudioPlayer(previewUri ?? undefined);
  const playerStatus = useAudioPlayerStatus(player);

  // Refs so the unmount cleanup always sees the latest objects.
  const recorderRef = useRef(recorder);
  const playerRef = useRef(player);
  const isRecordingRef = useRef(false);
  recorderRef.current = recorder;
  playerRef.current = player;
  isRecordingRef.current = recorderState.isRecording;

  const isRecording = recorderState.isRecording;
  const isUploading = state === "uploading";

  // Elapsed recording time: whichever clock is further ahead.
  const getElapsed = () =>
    Math.max(
      recorderStateRef.current.durationMillis,
      startedAtRef.current ? Date.now() - startedAtRef.current : 0,
    );

  // Request microphone permission and configure audio.
  useEffect(() => {
    (async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();

        if (!status.granted) {
          Alert.alert(
            "Microphone access needed",
            "Please allow microphone access to record a voice sample.",
          );
          return;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        setPermissionGranted(true);
      } catch (error) {
        reportError("Failed to initialize audio recording: " + error);

        Alert.alert(
          "Audio unavailable",
          "Could not initialize microphone recording.",
        );
      }
    })();
  }, []);

  // Return playback to the beginning when it finishes.
  useEffect(() => {
    if (playerStatus.didJustFinish) {
      try {
        player.seekTo(0);
      } catch {
        // Player may already be released.
      }
    }
  }, [playerStatus.didJustFinish, player]);

  // Safely pause the current player (guards against a stale/released native player).
  const safePause = () => {
    if (!previewUri) return;

    try {
      player.pause();
    } catch {
      // Player may already be released if the source changed.
    }
  };

  // Stop recording / playback ONLY when the screen unmounts.
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        recorderRef.current.stop().catch(() => {});
      }

      try {
        playerRef.current.pause();
      } catch {
        // Player may already be released.
      }
    };
  }, []);

  // Fill the waveform left-to-right on a fixed interval (not on every recorder poll).
  useEffect(() => {
    if (state !== "recording") return;

    const id = setInterval(() => {
      const progress = Math.min(1, getElapsed() / MAX_DURATION_MS);
      const activeIndex = Math.min(
        BAR_COUNT - 1,
        Math.floor(progress * BAR_COUNT),
      );

      const db = recorderStateRef.current.metering ?? -160;
      // Quantized so tiny fluctuations don't cause a re-render every tick.
      const amplitude =
        Math.round(Math.min(1, Math.max(0, (db + 60) / 60)) * 10) / 10;

      setWaveData((prev) => {
        if (prev[activeIndex] === amplitude) return prev;
        const next = [...prev];
        next[activeIndex] = amplitude;
        return next;
      });
    }, 120);

    return () => clearInterval(id);
  }, [state]);

  // Auto-stop when the maximum recording duration is reached.
  useEffect(() => {
    if (state !== "recording") return;

    const id = setInterval(() => {
      if (getElapsed() >= MAX_DURATION_MS) {
        clearInterval(id);
        stopRecording();
      }
    }, 200);

    return () => clearInterval(id);
  }, [state]);

  const startRecording = async () => {
    if (!permissionGranted) return;

    try {
      stoppingRef.current = false;
      setPreviewUri(null);
      setRecordedMs(0);
      setScript(SCRIPTS[Math.floor(Math.random() * SCRIPTS.length)]);
      setWaveData(Array(BAR_COUNT).fill(0));

      await recorder.prepareToRecordAsync();

      recorder.record();

      startedAtRef.current = Date.now();

      setState("recording");
    } catch (error) {
      reportError("Failed to start recording: " + error);

      setState("error");

      Alert.alert("Couldn't start recording", "Please try again.");
    }
  };

  const stopRecording = async () => {
    // The auto-stop interval and the mic button can both call this.
    if (stoppingRef.current) return;
    stoppingRef.current = true;

    // Read the duration BEFORE stopping, because the recorder state resets afterwards.
    const elapsed = getElapsed();

    try {
      await recorder.stop();

      const uri = recorder.uri;

      if (!uri) {
        reportError("Recording stopped but no recording URI was returned.");
        setState("error");
        return;
      }

      setRecordedMs(elapsed);
      setPreviewUri(uri);
      setState("preview");
    } catch (error) {
      reportError("Failed to stop recording: " + error);
      setState("error");
    } finally {
      startedAtRef.current = 0;
      stoppingRef.current = false;
    }
  };

  const uploadRecording = async () => {
    if (!previewUri) return;

    setState("uploading");

    try {
      await uploadVoiceSample(user?.first_name || "My Voice", {
        uri: previewUri,
        name: "voice-sample.m4a",
        mimeType: "audio/mp4",
      });

      router.navigate("/(dashboard)/mic");
    } catch (error) {
      reportError("Failed to upload voice sample: " + error);
      1;

      // Go back to the preview so the recording isn't lost.
      setState("preview");
    }
  };

  const togglePlayback = () => {
    if (!previewUri) return;

    try {
      if (playerStatus.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch {
      // Player may be mid-teardown.
    }
  };

  const tooShort = state === "preview" && recordedMs < MIN_DURATION_MS;

  const handleMicPress = () => {
    if (state === "idle" || state === "error") {
      startRecording();
    } else if (state === "recording") {
      stopRecording();
    } else if (state === "preview" && !tooShort) {
      uploadRecording();
    }
  };

  const handleRetry = async () => {
    if (recorderState.isRecording) {
      await recorder.stop().catch(() => {});
    }

    stoppingRef.current = false;
    startedAtRef.current = 0;

    setWaveData(Array(BAR_COUNT).fill(0));
    safePause();

    setRecordedMs(0);
    setPreviewUri(null);
    setState("idle");
  };

  const handleClose = async () => {
    if (recorderState.isRecording) {
      await recorder.stop().catch(() => {});
    }

    safePause();

    setPreviewUri(null);

    router.back();
  };

  const promptText =
    state === "uploading"
      ? "Saving your sample…"
      : state === "error"
        ? "Something went wrong — try again"
        : state === "preview"
          ? tooShort
            ? "Too short — tap retry and record at least 6 seconds"
            : "Tap play to listen, or check to upload"
          : isRecording
            ? "Read the line above naturally"
            : "Tap the mic to start";

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
      edges={["top", "left", "right", "bottom"]}
    >
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
      </View>

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <Pressable onPress={handleClose} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={theme.onSurface} />
        </Pressable>

        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.onSurface,
            },
          ]}
        >
          Record your voice
        </Text>

        <View style={{ width: 22 }} />
      </Animated.View>

      {/* Center */}
      <View style={styles.center}>
        {state === "recording" && (
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={styles.scriptWrap}
          >
            <Text
              style={[
                styles.scriptText,
                {
                  color: theme.onSurface,
                },
              ]}
            >
              {script}
            </Text>
          </Animated.View>
        )}

        <Animated.Text
          key={promptText}
          entering={FadeIn.duration(250)}
          style={[
            styles.prompt,
            {
              color: theme.onSurface,
            },
          ]}
        >
          {promptText}
        </Animated.Text>

        {isRecording && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary,
                  width: `${Math.min(
                    100,
                    (recorderState.durationMillis / MAX_DURATION_MS) * 100,
                  )}%`,
                },
              ]}
            />
          </View>
        )}

        <Waveform
          data={waveData}
          directions={BAR_DIRECTIONS}
          color={theme.primary}
          animate={isRecording || (state === "preview" && playerStatus.playing)}
        />

        {/* Preview playback button */}
        {state === "preview" && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Pressable
              onPress={togglePlayback}
              style={[
                styles.playButton,
                {
                  backgroundColor: theme.surfaceVariant,
                },
              ]}
            >
              <Ionicons
                name={playerStatus.playing ? "pause" : "play"}
                size={22}
                color={theme.onSurface}
              />
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Retry */}
        <Pressable
          onPress={handleRetry}
          disabled={state === "idle" || isUploading}
          hitSlop={12}
          style={[
            styles.sideButton,
            {
              opacity: state === "idle" || isUploading ? 0.3 : 1,
            },
          ]}
        >
          <Ionicons name="refresh" size={24} color={theme.onSurfaceVariant} />
        </Pressable>

        {/* Main action */}
        <Pressable
          onPress={handleMicPress}
          disabled={isUploading || !permissionGranted}
          style={[
            styles.micButton,
            {
              backgroundColor: isRecording
                ? theme.surfaceVariant
                : theme.primary,

              borderColor: isRecording ? theme.primary : "transparent",

              borderWidth: isRecording ? 2 : 0,

              opacity: state === "preview" && tooShort ? 0.45 : 1,
            },
          ]}
        >
          {isUploading ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Ionicons
              name={
                state === "recording"
                  ? "stop"
                  : state === "preview"
                    ? "checkmark"
                    : "mic"
              }
              size={30}
              color={isRecording ? theme.primary : theme.buttonText}
            />
          )}
        </Pressable>

        {/* Close */}
        <Pressable onPress={handleClose} hitSlop={12} style={styles.sideButton}>
          <Ionicons name="close" size={24} color={theme.onSurfaceVariant} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* Waveform                                                                   */
/* -------------------------------------------------------------------------- */

function Waveform({
  data,
  directions,
  color,
  animate,
}: {
  data: number[];
  directions: ("up" | "down")[];
  color: string;
  animate: boolean;
}) {
  return (
    <View style={styles.waveRow}>
      {data.map((magnitude, i) => (
        <WaveBar
          key={i}
          magnitude={magnitude}
          direction={directions[i]}
          color={color}
          animate={animate}
        />
      ))}
    </View>
  );
}

function WaveBar({
  magnitude,
  direction,
  color,
  animate,
}: {
  magnitude: number; // 0..1
  direction: "up" | "down";
  color: string;
  animate: boolean; // false = frozen (paused after recording, until preview playback starts)
}) {
  const upHeight = useSharedValue(2);
  const downHeight = useSharedValue(2);

  useEffect(() => {
    const target = magnitude > 0 ? 3 + magnitude * 27 : 2;
    // Amount of continuous flicker layered on top of the target height.
    const wobble = magnitude > 0 ? Math.max(2, target * 0.18) : 0;

    const settle = (sv: SharedValue<number>, restHeight: number) => {
      cancelAnimation(sv);

      if (magnitude <= 0) {
        sv.value = withTiming(restHeight, { duration: 200 });
        return;
      }

      if (!animate) {
        // Paused: hold steady at the last known level, no looping flicker.
        sv.value = withTiming(target, { duration: 150 });
        return;
      }

      sv.value = withSequence(
        // Glide smoothly to the new level first...
        withTiming(target, {
          duration: 120,
          easing: Easing.inOut(Easing.ease),
        }),
        // ...then keep it gently flickering around that level forever,
        // until the next magnitude update or a pause restarts this sequence.
        withRepeat(
          withSequence(
            withTiming(target + wobble, {
              duration: 180 + Math.random() * 140,
              easing: Easing.inOut(Easing.sin),
            }),
            withTiming(Math.max(2, target - wobble), {
              duration: 180 + Math.random() * 140,
              easing: Easing.inOut(Easing.sin),
            }),
          ),
          -1,
          true,
        ),
      );
    };

    if (direction === "up") {
      settle(upHeight, 2);
      cancelAnimation(downHeight);
      downHeight.value = withTiming(2, { duration: 150 });
    } else {
      settle(downHeight, 2);
      cancelAnimation(upHeight);
      upHeight.value = withTiming(2, { duration: 150 });
    }
  }, [magnitude, direction, animate]);

  const upStyle = useAnimatedStyle(() => ({ height: upHeight.value }));
  const downStyle = useAnimatedStyle(() => ({ height: downHeight.value }));

  return (
    <View style={styles.barColumn}>
      <View style={styles.barUpperHalf}>
        <Animated.View
          style={[styles.barSegment, { backgroundColor: color }, upStyle]}
        />
      </View>
      <View style={styles.barLowerHalf}>
        <Animated.View
          style={[styles.barSegment, { backgroundColor: color }, downStyle]}
        />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topAmbientGlow: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.45,
    borderRadius: width,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  backButton: {},

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 32,
  },

  scriptWrap: {
    paddingHorizontal: 16,
  },

  scriptText: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 28,
  },

  prompt: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  progressTrack: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 2,
  },

  waveRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "center",
    gap: 1,
    width: "100%",
    height: 60,
  },

  barColumn: {
    flex: 1,
    flexDirection: "column",
  },

  barUpperHalf: {
    flex: 1,
    justifyContent: "flex-end",
  },

  barLowerHalf: {
    flex: 1,
    justifyContent: "flex-start",
  },

  barSegment: {
    width: "25%",
    borderRadius: 3,
  },

  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingBottom: 24,
    paddingTop: 8,
  },

  sideButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  micButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
