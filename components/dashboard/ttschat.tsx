import PremiumBanner from "@/components/common/Premiumbanner";
import Stepper from "@/components/common/Stepper";
import ToggleRow from "@/components/common/ToggleRow";
import { useAppTheme } from "@/hooks/use-theme-color";
import { updatePreferences } from "@/lib/api";
import { deriveVoiceInfo } from "@/lib/helpers";
import type { EdgeVoice, Preferences } from "@/lib/schema";
import { reportError } from "@/store/error.store";
import { usePreferencesStore } from "@/store/preference.store";
import { useUserStore } from "@/store/user.store";
import { useVoicesStore } from "@/store/voice.store";
import { useVoicePreviewStore } from "@/store/voicepreview.store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/** Debounce (ms) applied while a slider is being dragged. */
const SLIDER_SAVE_DELAY = 400;
/** Debounce (ms) applied to rapid stepper taps. */
const STEPPER_SAVE_DELAY = 300;

const round2 = (n: number) => Math.round(n * 100) / 100;

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/*
 * The backend stores volume and speed as percentages:
 *   volume: 0-100, speed: 0-200
 * The sliders on this screen use fractions (volume 0-1, speed 0.5-2),
 * so values are converted at the edges of the screen.
 */
const volumeToApi = (v: number) => clamp(Math.round(v * 100), 0, 100);
const speedToApi = (v: number) => clamp(Math.round(v * 100), 0, 200);

const volumeFromApi = (n: number) => clamp(n / 100, 0, 1);
const speedFromApi = (n: number) => clamp(n / 100, 0.5, 2);

/*
 * Pitch is stored on the backend as a signed whole-number Hz string,
 * e.g. "+5Hz" or "+0Hz". The slider itself works with a plain number.
 */
const PITCH_MIN = -100;
const PITCH_MAX = 100;

const formatPitchHz = (n: number) => (n >= 0 ? "+" : "") + Math.round(n) + "Hz";

const pitchFromApi = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clamp(Math.round(value), PITCH_MIN, PITCH_MAX);
  }

  if (typeof value === "string") {
    const match = value.match(/-?\d+/);

    if (match) {
      return clamp(Math.round(Number(match[0])), PITCH_MIN, PITCH_MAX);
    }
  }

  return 0;
};

type AllowedUserType = "all" | "subscriber" | "moderator" | "moderator_and_up";

const ALLOWED_USER_OPTIONS: {
  key: AllowedUserType;
  label: string;
  premium: boolean;
}[] = [
  {
    key: "all",
    label: "All Users",
    premium: false,
  },
  {
    key: "subscriber",
    label: "Subscribers",
    premium: true,
  },
  {
    key: "moderator",
    label: "Moderators",
    premium: true,
  },
  {
    key: "moderator_and_up",
    label: "Moderators & Up",
    premium: true,
  },
];

export default function TtsChatTab() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const user = useUserStore((state) => state.user);

  const preferences = usePreferencesStore((state) => state.preferences);
  const preferencesLoading = usePreferencesStore((state) => state.isLoading);
  const fetchPreferences = usePreferencesStore(
    (state) => state.fetchPreferences,
  );

  const voices = useVoicesStore((state) => state.voices);
  const voicesLoading = useVoicesStore((state) => state.isLoading);
  const fetchVoices = useVoicesStore((state) => state.fetchVoices);

  const { playingVoiceId, loadingVoiceId, playPreview, stopPreview } =
    useVoicePreviewStore();

  /*
   * Local control values. They are synchronized from the server-backed
   * preferences, and edited immediately while the user interacts.
   */
  const [volume, setVolume] = useState(0.7);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);

  const [allowedUsers, setAllowedUsers] = useState<AllowedUserType[]>(["all"]);

  const [convertEmojis, setConvertEmojis] = useState(false);
  const [filterProfanity, setFilterProfanity] = useState(false);
  const [requireCommand, setRequireCommand] = useState(false);
  const [maxMessageLength, setMaxMessageLength] = useState(200);

  const isStarter = user?.plan === "starter";
  const isEssential = user?.plan === "essential";

  // Paid features (allowed users, premium voices): locked on starter only.
  const premiumLocked = isStarter;

  // Message filters are Pro-only: locked on starter AND essential.
  const filtersLocked = isStarter || isEssential;

  /*
   * -----------------------------
   * Queued preference saving
   * -----------------------------
   *
   * - Changes are merged into `pendingRef`.
   * - Sliders/steppers debounce; toggles flush immediately.
   * - All network saves are chained so responses can't arrive out of order.
   * - The latest store state is always read via getState(), never from a
   *   stale render closure.
   */
  const pendingRef = useRef<Partial<Preferences>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  const flushNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const patch = pendingRef.current;
    pendingRef.current = {};

    if (Object.keys(patch).length === 0) return;

    saveChainRef.current = saveChainRef.current.then(async () => {
      const store = usePreferencesStore.getState();
      const current = store.preferences;

      // Never PUT before preferences have loaded: it could wipe server data.
      if (!current) return;

      const next: Preferences = { ...current, ...patch };

      // Optimistic update so the rest of the app sees the change immediately.
      store.setPreferences(next);

      try {
        const saved = await updatePreferences(next);

        // Don't overwrite newer edits made while this request was in flight.
        if (Object.keys(pendingRef.current).length === 0 && !timerRef.current) {
          usePreferencesStore.getState().setPreferences(saved);
        }
      } catch (error) {
        console.error("Failed to update TTS preferences:", error);
        reportError("Failed to update TTS preferences: " + error);

        // Restore the authoritative server state.
        try {
          await usePreferencesStore.getState().fetchPreferences(true);
        } catch (refreshError) {
          reportError("Failed to restore TTS preferences: " + refreshError);
        }
      }
    });
  }, []);

  const queueSave = useCallback(
    (patch: Partial<Preferences>, delay = 0) => {
      pendingRef.current = { ...pendingRef.current, ...patch };

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (delay <= 0) {
        flushNow();
      } else {
        timerRef.current = setTimeout(flushNow, delay);
      }
    },
    [flushNow],
  );

  // Don't lose a pending change when the user leaves the screen.
  useEffect(() => flushNow, [flushNow]);

  /*
   * Load the same data source used by dashboard/index.tsx.
   */
  useEffect(() => {
    if (!user) return;

    fetchPreferences().catch((error) => {
      reportError("Failed to load preferences: " + error);
    });

    fetchVoices().catch((error) => {
      reportError("Failed to load voices: " + error);
    });
  }, [user, fetchPreferences, fetchVoices]);

  /*
   * Synchronize the local controls whenever the server-backed
   * preferences change.
   */
  useEffect(() => {
    if (!preferences) return;

    // The user is mid-edit; don't overwrite their local values.
    if (timerRef.current) return;

    setVolume(
      typeof preferences.volume === "number"
        ? volumeFromApi(preferences.volume)
        : 0.7,
    );

    setSpeed(
      typeof preferences.speed === "number"
        ? speedFromApi(preferences.speed)
        : 1,
    );

    setPitch(pitchFromApi(preferences.pitch));

    setConvertEmojis(Boolean(preferences.emoji_to_words));
    setFilterProfanity(Boolean(preferences.filter_profanity));
    setRequireCommand(Boolean(preferences.require_command_prefix));

    setMaxMessageLength(
      typeof preferences.max_message_length === "number"
        ? preferences.max_message_length
        : 200,
    );

    if (preferences.allowed_user_types?.length) {
      setAllowedUsers(preferences.allowed_user_types);
    } else {
      setAllowedUsers(["all"]);
    }
  }, [preferences]);

  /*
   * Resolve the currently selected voice from the real voice catalogue.
   */
  const selectedVoice = useMemo(() => {
    const selectedId = preferences?.voice;

    if (!selectedId) return null;

    const edgeVoice = voices?.edge?.find(
      (voice: EdgeVoice) =>
        voice.short_name === selectedId || voice.id === selectedId,
    );

    return edgeVoice ?? null;
  }, [preferences?.voice, voices?.edge]);

  /*
   * Build display information without hardcoding a specific voice.
   */
  const selectedVoiceInfo = useMemo(() => {
    if (selectedVoice) {
      const info = deriveVoiceInfo(selectedVoice.short_name);

      return {
        name: info.name,
        gender: selectedVoice.gender,
        language: `${info.language} (${info.country})`,
        isPremium: preferences?.tts_provider === "fish",
      };
    }

    /*
     * Fish voices are not typed in the current VoicesResponse schema,
     * so fall back to the stored identifier when the selected provider
     * is Fish.
     */
    if (preferences?.tts_provider === "fish") {
      return {
        name:
          preferences.fish_voice_id || preferences.voice || "Selected voice",
        gender: "",
        language: "Fish Audio",
        isPremium: true,
      };
    }

    if (preferences?.voice) {
      const info = deriveVoiceInfo(preferences.voice);

      return {
        name: info.name || preferences.voice,
        gender: "",
        language:
          info.language && info.country
            ? `${info.language} (${info.country})`
            : "Voice",
        isPremium: false,
      };
    }

    return {
      name: "No voice selected",
      gender: "",
      language: "Choose a voice",
      isPremium: false,
    };
  }, [
    selectedVoice,
    preferences?.tts_provider,
    preferences?.fish_voice_id,
    preferences?.voice,
  ]);

  const selectedVoiceId =
    preferences?.voice || selectedVoice?.short_name || null;

  const isPreviewLoading =
    selectedVoiceId !== null && loadingVoiceId === selectedVoiceId;

  const isPreviewPlaying =
    selectedVoiceId !== null && playingVoiceId === selectedVoiceId;

  const toggleVoicePreview = async () => {
    if (!selectedVoiceId) {
      router.push("/voice-select");
      return;
    }

    if (isPreviewPlaying || isPreviewLoading) {
      stopPreview();
      return;
    }

    try {
      await playPreview(
        selectedVoiceId,
        preferences?.tts_provider === "fish" ? "fish" : "edge",
      );
    } catch (error) {
      reportError("Failed to play voice preview: " + error);
    }
  };

  /*
   * Slider handlers.
   *
   * Values are rounded to 2 decimals to avoid float noise
   * (e.g. "1.2300000000000002"). Saves are debounced while dragging and
   * flushed immediately when the finger lifts (onSlidingComplete={flushNow}).
   */
  const handleVolumeChange = (value: number) => {
    const v = round2(value);
    setVolume(v);
    queueSave({ volume: volumeToApi(v) }, SLIDER_SAVE_DELAY);
  };

  const handleSpeedChange = (value: number) => {
    const v = round2(value);
    setSpeed(v);
    queueSave({ speed: speedToApi(v) }, SLIDER_SAVE_DELAY);
  };

  const handlePitchChange = (value: number) => {
    const v = clamp(Math.round(value), PITCH_MIN, PITCH_MAX);
    setPitch(v);
    queueSave({ pitch: formatPitchHz(v) }, STEPPER_SAVE_DELAY);
  };

  const updateTogglePreference = (
    key: "emoji_to_words" | "filter_profanity" | "require_command_prefix",
    value: boolean,
  ) => {
    if (filtersLocked) {
      router.push("/pricing");
      return;
    }

    if (key === "emoji_to_words") setConvertEmojis(value);
    if (key === "filter_profanity") setFilterProfanity(value);
    if (key === "require_command_prefix") setRequireCommand(value);

    queueSave({ [key]: Boolean(value) });
  };

  const handleMaxMessageLength = (value: number) => {
    if (filtersLocked) {
      router.push("/pricing");
      return;
    }

    setMaxMessageLength(value);
    queueSave({ max_message_length: value }, STEPPER_SAVE_DELAY);
  };

  const toggleAllowedUser = (key: AllowedUserType) => {
    if (premiumLocked && key !== "all") {
      router.push("/pricing");
      return;
    }

    // Compute the next value outside any state updater so the side effect
    // (saving) only runs once.
    let next: AllowedUserType[];

    if (key === "all") {
      // "all" is mutually exclusive with the more restrictive options.
      next = ["all"];
    } else {
      const withoutAll = allowedUsers.filter((value) => value !== "all");

      next = withoutAll.includes(key)
        ? withoutAll.filter((value) => value !== key)
        : [...withoutAll, key];

      // Don't allow an empty selection.
      if (next.length === 0) next = ["all"];
    }

    setAllowedUsers(next);
    queueSave({ allowed_user_types: next });
  };

  return (
    <>
      {/* =========================
          CHAT TTS
         ========================= */}

      <Text
        style={[
          styles.sectionLabel,
          {
            color: theme.onSurfaceVariant,
          },
        ]}
      >
        Voice settings
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceVariant,
            borderColor: theme.outline,
          },
        ]}
      >
        <Pressable
          onPress={() => router.push("/voice-select")}
          style={styles.voiceRow}
        >
          <View style={styles.voiceInfo}>
            <View style={styles.voiceNameRow}>
              <Text
                style={[
                  styles.voiceName,
                  {
                    color: theme.onSurface,
                  },
                ]}
                numberOfLines={1}
              >
                {selectedVoiceInfo.name}
              </Text>

              {!!selectedVoiceInfo.gender && (
                <Text
                  style={[
                    styles.voiceGender,
                    {
                      color: theme.onSurfaceVariant,
                    },
                  ]}
                >
                  ({selectedVoiceInfo.gender})
                </Text>
              )}

              {selectedVoiceInfo.isPremium && (
                <MaterialCommunityIcons
                  name="crown"
                  size={14}
                  color="#FFB961"
                />
              )}
            </View>

            <Text
              style={[
                styles.voiceLanguage,
                {
                  color: theme.onSurfaceVariant,
                },
              ]}
              numberOfLines={1}
            >
              {selectedVoiceInfo.language}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.onSurfaceVariant}
          />
        </Pressable>

        {selectedVoiceInfo.isPremium && premiumLocked && (
          <PremiumBanner
            title="You're using a Premium Voice. Upgrade to unlock!"
            onPress={() => router.push("/pricing")}
          />
        )}

        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.outline,
            },
          ]}
        />

        <SliderBlock
          label="Volume"
          value={volume}
          display={`${Math.round(volume * 100)}%`}
          min={0}
          max={1}
          setValue={handleVolumeChange}
          onSlidingComplete={flushNow}
          left="volume-medium-outline"
          right="volume-high-outline"
          theme={theme}
          disabled={preferencesLoading}
        />

        <SliderBlock
          label="Speed"
          value={speed}
          display={`${speed.toFixed(2)}x`}
          min={0.5}
          max={2}
          setValue={handleSpeedChange}
          onSlidingComplete={flushNow}
          left="speedometer-outline"
          right="flash-outline"
          theme={theme}
          disabled={preferencesLoading}
        />

        <Stepper
          label="Pitch"
          value={pitch}
          onChange={handlePitchChange}
          min={PITCH_MIN}
          max={PITCH_MAX}
          step={1}
          unit="Hz"
        />

        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.outline,
            },
          ]}
        />

        <Pressable
          onPress={toggleVoicePreview}
          disabled={!selectedVoiceId || isPreviewLoading}
          style={[
            styles.previewButton,
            {
              borderColor: theme.outline,
              opacity: selectedVoiceId && !isPreviewLoading ? 1 : 0.55,
            },
          ]}
        >
          <Ionicons
            name={
              isPreviewLoading
                ? "hourglass-outline"
                : isPreviewPlaying
                  ? "pause"
                  : "play"
            }
            size={16}
            color={theme.primary}
          />

          <Text
            style={[
              styles.previewText,
              {
                color: theme.primary,
              },
            ]}
          >
            {isPreviewLoading
              ? "Loading…"
              : isPreviewPlaying
                ? "Playing…"
                : "Voice Preview"}
          </Text>
        </Pressable>
      </View>

      {/* Message Filters */}

      <View style={styles.sectionTitleRow}>
        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.onSurfaceVariant,
            },
          ]}
        >
          Message Filters
        </Text>

        {filtersLocked && (
          <MaterialCommunityIcons
            style={styles.premiumIcon}
            name="crown"
            size={11}
            color="#f39b31"
          />
        )}
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceVariant,
            borderColor: theme.outline,
          },
        ]}
      >
        <ToggleRow
          icon={
            <Ionicons
              name="happy-outline"
              size={18}
              color={theme.onSurfaceVariant}
            />
          }
          label="Convert Emojis to Words"
          subtitle='e.g. "🔥" becomes "fire"'
          value={convertEmojis}
          onValueChange={() =>
            updateTogglePreference("emoji_to_words", !convertEmojis)
          }
          isPremium={filtersLocked}
          disabled={filtersLocked}
        />

        <View
          style={[
            styles.rowDivider,
            {
              backgroundColor: theme.outline,
            },
          ]}
        />

        <ToggleRow
          icon={
            <Ionicons
              name="shield-outline"
              size={18}
              color={theme.onSurfaceVariant}
            />
          }
          label="Filter Profanity"
          subtitle="Skip messages containing blocked words"
          value={filterProfanity}
          onValueChange={() =>
            updateTogglePreference("filter_profanity", !filterProfanity)
          }
          isPremium={filtersLocked}
          disabled={filtersLocked}
        />

        <View
          style={[
            styles.rowDivider,
            {
              backgroundColor: theme.outline,
            },
          ]}
        />

        <ToggleRow
          icon={
            <Ionicons
              name="terminal-outline"
              size={18}
              color={theme.onSurfaceVariant}
            />
          }
          label="Require Command Prefix"
          subtitle="Only read messages that start with a command"
          value={requireCommand}
          onValueChange={() =>
            updateTogglePreference("require_command_prefix", !requireCommand)
          }
          isPremium={filtersLocked}
          disabled={filtersLocked}
        />

        <View
          style={[
            styles.rowDivider,
            {
              backgroundColor: theme.outline,
            },
          ]}
        />

        <Stepper
          label="Max Message Length"
          value={maxMessageLength}
          onChange={handleMaxMessageLength}
          min={20}
          max={500}
          step={10}
          unit=" chars"
          isPremium={filtersLocked}
        />
      </View>

      {/* Allowed Users */}

      <View style={styles.sectionTitleRow}>
        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.onSurfaceVariant,
            },
          ]}
        >
          Allowed Users
        </Text>

        {premiumLocked && (
          <MaterialCommunityIcons
            style={styles.premiumIcon}
            name="crown"
            size={11}
            color="#f39b31"
          />
        )}
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceVariant,
            borderColor: theme.outline,
          },
        ]}
      >
        {ALLOWED_USER_OPTIONS.map((option, index) => {
          const isEnabled = allowedUsers.includes(option.key);

          const disabled = premiumLocked && option.premium;

          return (
            <React.Fragment key={option.key}>
              <ToggleRow
                label={option.label}
                value={isEnabled}
                onValueChange={() => toggleAllowedUser(option.key)}
                disabled={disabled}
                bold={option.key === "all"}
                isPremium={option.premium && premiumLocked}
              />

              {index < ALLOWED_USER_OPTIONS.length - 1 && (
                <View
                  style={[
                    styles.rowDivider,
                    {
                      backgroundColor: theme.outline,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {voicesLoading && !selectedVoice && (
        <Text
          style={[
            styles.loadingText,
            {
              color: theme.onSurfaceVariant,
            },
          ]}
        >
          Loading available voices…
        </Text>
      )}
    </>
  );
}

function SliderBlock({
  label,
  value,
  display,
  min,
  max,
  step = 0.01,
  setValue,
  onSlidingComplete,
  left,
  right,
  theme,
  disabled,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  setValue: (value: number) => void;
  onSlidingComplete: (value: number) => void;
  left: React.ComponentProps<typeof Ionicons>["name"];
  right: React.ComponentProps<typeof Ionicons>["name"];
  theme: ReturnType<typeof useAppTheme>["theme"];
  disabled?: boolean;
}) {
  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderLabelRow}>
        <Text
          style={[
            styles.sliderLabel,
            {
              color: theme.onSurface,
            },
          ]}
        >
          {label}
        </Text>

        <Text
          style={[
            styles.sliderValue,
            {
              color: theme.primary,
            },
          ]}
        >
          {display}
        </Text>
      </View>

      <View style={styles.sliderRow}>
        <Ionicons name={left} size={18} color={theme.onSurfaceVariant} />

        <Slider
          style={styles.slider}
          value={value}
          minimumValue={min}
          maximumValue={max}
          step={step}
          disabled={disabled}
          onValueChange={setValue}
          onSlidingComplete={onSlidingComplete}
          minimumTrackTintColor={theme.primary}
          maximumTrackTintColor={theme.outline}
          thumbTintColor={theme.primary}
        />

        <Ionicons name={right} size={18} color={theme.onSurfaceVariant} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 2,
  },

  premiumIcon: {
    marginTop: -7,
  },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 22,
  },

  voiceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  voiceInfo: {
    flex: 1,
    paddingRight: 12,
  },

  voiceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },

  voiceName: {
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },

  voiceGender: {
    fontSize: 12.5,
  },

  voiceLanguage: {
    fontSize: 12,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },

  sliderBlock: {
    marginBottom: 14,
  },

  sliderLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  sliderLabel: {
    fontSize: 13,
    fontWeight: "600",
  },

  sliderValue: {
    fontSize: 12,
    fontWeight: "600",
  },

  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  slider: {
    flex: 1,
    height: 32,
  },

  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },

  previewText: {
    fontSize: 13,
    fontWeight: "700",
  },

  rowDivider: {
    height: StyleSheet.hairlineWidth,
  },

  loadingText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 20,
  },
});
