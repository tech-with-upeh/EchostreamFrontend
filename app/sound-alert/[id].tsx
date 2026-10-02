import BottomSheet from "@/components/common/bottomSheet";
import ToggleRow from "@/components/common/ToggleRow";
import SearchBar from "@/components/voices/SearchBar";
import { useAppTheme } from "@/hooks/use-theme-color";
import { updatePreferences } from "@/lib/api";
import { deriveVoiceInfo } from "@/lib/helpers";
import type {
  EdgeVoice,
  EventAlertConfig,
  FishVoice,
  Preferences,
  SystemSound,
} from "@/lib/schema";
import { reportError } from "@/store/error.store";
import { useGiftsStore } from "@/store/gift.store";
import { useGiftPreferencesStore } from "@/store/giftpref.store";
import { usePreferencesStore } from "@/store/preference.store";
import { useSystemSoundsStore } from "@/store/systemsound.store";
import { useUserStore } from "@/store/user.store";
import { useUserSoundsStore } from "@/store/usersound.store";
import { useVoicesStore } from "@/store/voice.store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

type AudioMode = "tts" | "system" | "custom";

const GIFT_KEY_PREFIX = "gift-";
const BASE_ALERT_KEYS = ["like", "follow", "gift"] as const;

function isBaseAlertKey(key: string): key is (typeof BASE_ALERT_KEYS)[number] {
  return (BASE_ALERT_KEYS as readonly string[]).includes(key);
}

function isGiftKey(key: string) {
  return key.startsWith(GIFT_KEY_PREFIX);
}

function giftIdFromKey(key: string) {
  return key.slice(GIFT_KEY_PREFIX.length);
}

function createDefaultAlertConfig(key: string): EventAlertConfig {
  const event_type = isBaseAlertKey(key)
    ? (key as "like" | "follow" | "gift")
    : "gift";

  const gift_id = isGiftKey(key) ? giftIdFromKey(key) : null;

  return {
    id: key,
    event_type,
    gift_id,
    enabled: true,
    alert_type: "tts",
    tts_template: "",
    tts_provider: "edge",
    voice: null,
    fish_voice_id: null,
    fish_model: null,
    system_sound_id: null,
    custom_audio_id: null,
    custom_audio_url: null,
    volume: null,
    speed: null,
    pitch: null,
  } as EventAlertConfig;
}

const alertTypeFromMode: Record<AudioMode, string> = {
  tts: "tts",
  system: "system_sound",
  custom: "custom_audio",
};

function modeFromAlertType(alertType: string | undefined): AudioMode {
  if (alertType === "system_sound") return "system";
  if (alertType === "custom_audio") return "custom";
  return "tts";
}

// Combined edge + fish row shape for the voice picker. Fish rows are
// flagged `locked` when the account's plan doesn't include premium
// voices — the picker still shows them (so users know they exist) but
// tapping one routes to the pricing screen instead of selecting it.
type DisplayVoice = {
  key: string;
  provider: "edge" | "fish";
  id: string; // short_name for edge, id for fish
  name: string;
  gender: string;
  language: string;
  country: string;
  locked: boolean;
};

export default function SoundAlertScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const key = id ?? "";
  const giftKey = isGiftKey(key);

  const preferences = usePreferencesStore((state) => state.preferences);
  const fetchPreferences = usePreferencesStore(
    (state) => state.fetchPreferences,
  );

  const giftPreferences = useGiftPreferencesStore((state) => state.giftspref);
  const fetchGiftPreferences = useGiftPreferencesStore(
    (state) => state.fetchGiftspref,
  );
  const putGiftPreference = useGiftPreferencesStore(
    (state) => state.putGiftspref,
  );
  const deleteGiftPreference = useGiftPreferencesStore(
    (state) => state.deleteGiftspref,
  );

  const gifts = useGiftsStore((state) => state.gifts);
  const fetchGifts = useGiftsStore((state) => state.fetchGifts);

  const voices = useVoicesStore((state) => state.voices);
  const fetchVoices = useVoicesStore((state) => state.fetchVoices);

  const systemSounds = useSystemSoundsStore((state) => state.systemSounds);
  const fetchSystemSounds = useSystemSoundsStore(
    (state) => state.fetchSystemSounds,
  );

  const previewingSoundId = useSystemSoundsStore(
    (state) => state.playingSoundId,
  );
  const playSystemSoundPreview = useSystemSoundsStore(
    (state) => state.playPreview,
  );
  const stopSystemSoundPreview = useSystemSoundsStore(
    (state) => state.stopPreview,
  );

  const userSounds = useUserSoundsStore((state) => state.userSounds);
  const fetchUserSounds = useUserSoundsStore((state) => state.fetchUserSounds);
  const uploadUserSound = useUserSoundsStore((state) => state.uploadUserSound);
  const uploading = useUserSoundsStore((state) => state.uploading);

  const previewingUserSoundId = useUserSoundsStore(
    (state) => state.playingSoundId,
  );
  const loadingUserSoundId = useUserSoundsStore(
    (state) => state.loadingSoundId,
  );
  const playUserSoundPreview = useUserSoundsStore((state) => state.playPreview);
  const stopUserSoundPreview = useUserSoundsStore((state) => state.stopPreview);

  useEffect(() => {
    fetchPreferences().catch((error) => {
      reportError("Failed to load preferences: " + error);
    });

    fetchGiftPreferences().catch((error) => {
      reportError("Failed to load gift preferences: " + error);
    });

    fetchGifts().catch((error) => {
      reportError("Failed to load gifts: " + error);
    });

    fetchVoices().catch((error) => {
      reportError("Failed to load voices: " + error);
    });

    fetchSystemSounds().catch((error) => {
      reportError("Failed to load system sounds: " + error);
    });

    fetchUserSounds().catch((error) => {
      reportError("Failed to load your sounds: " + error);
    });
  }, [
    fetchPreferences,
    fetchGiftPreferences,
    fetchGifts,
    fetchVoices,
    fetchSystemSounds,
    fetchUserSounds,
  ]);

  useEffect(() => {
    return () => {
      stopSystemSoundPreview();
      stopUserSoundPreview();
    };
  }, [stopSystemSoundPreview, stopUserSoundPreview]);

  const config = useMemo(() => {
    if (giftKey) {
      const giftId = giftIdFromKey(key);

      return Array.isArray(giftPreferences)
        ? giftPreferences.find((g) => g.gift_id === giftId)
        : undefined;
    }

    return preferences?.events?.[key];
  }, [giftKey, key, giftPreferences, preferences]);

  const headerInfo = useMemo(() => {
    if (key === "like") {
      return {
        emoji: "❤️",
        name: "Likes",
        meta: "Chat event",
        imageUrl: undefined as string | undefined,
      };
    }

    if (key === "follow") {
      return {
        emoji: "➕",
        name: "New Followers",
        meta: "Chat event",
        imageUrl: undefined as string | undefined,
      };
    }

    if (key === "gift") {
      return {
        emoji: "🎁",
        name: "Any Gift",
        meta: "Any TikTok gift",
        imageUrl: undefined as string | undefined,
      };
    }

    if (giftKey) {
      const giftId = giftIdFromKey(key);
      const gift = gifts?.find((g) => g.id === giftId);

      if (gift) {
        return {
          emoji: "🎁",
          name: gift.name,
          meta: `${gift.diamond_count} Diamonds`,
          imageUrl: gift.image_url,
        };
      }

      return {
        emoji: "🎁",
        name: "Gift",
        meta: "TikTok gift",
        imageUrl: undefined,
      };
    }

    return {
      emoji: "🔔",
      name: key,
      meta: "",
      imageUrl: undefined as string | undefined,
    };
  }, [key, giftKey, gifts]);

  const deletable = giftKey;

  const [mode, setMode] = useState<AudioMode>("tts");
  const [enabled, setEnabled] = useState(true);
  const [ttsTemplate, setTtsTemplate] = useState("");

  const [voiceOverride, setVoiceOverride] = useState<string | null>(null);
  const [fishVoiceIdOverride, setFishVoiceIdOverride] = useState<string | null>(
    null,
  );
  const [fishModelOverride, setFishModelOverride] = useState<string | null>(
    null,
  );

  const [selectedSoundId, setSelectedSoundId] = useState<number | null>(null);

  const [customAudioId, setCustomAudioId] = useState<string | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);

  const [soundSearch, setSoundSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [voiceSheetVisible, setVoiceSheetVisible] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");

  const [soundSheetVisible, setSoundSheetVisible] = useState(false);

  const [customSoundSheetVisible, setCustomSoundSheetVisible] = useState(false);

  const user = useUserStore((state) => state.user);
  const isStarter = user?.plan === "starter";
  const premiumLocked = isStarter;

  useEffect(() => {
    if (!config || hydrated) return;

    setMode(modeFromAlertType(config.alert_type));
    setEnabled(config.enabled);
    setTtsTemplate(config.tts_template ?? "");

    if (config.system_sound_id) {
      const numericId = Number(config.system_sound_id);

      setSelectedSoundId(Number.isFinite(numericId) ? numericId : null);
    }

    if (config.voice || config.fish_voice_id) {
      setVoiceOverride(config.voice ?? null);
      setFishVoiceIdOverride(config.fish_voice_id ?? null);
      setFishModelOverride(config.fish_model ?? null);
    }

    if (config.custom_audio_id) {
      setCustomAudioId(String(config.custom_audio_id));
      setCustomAudioUrl(config.custom_audio_url ?? null);
    }

    setHydrated(true);
  }, [config, hydrated]);

  const hasVoiceOverride = !!(voiceOverride || fishVoiceIdOverride);

  const effectiveVoiceId = hasVoiceOverride
    ? voiceOverride
    : ((preferences?.tts_provider === "fish" ? null : preferences?.voice) ??
      null);

  const selectedEdgeVoice = useMemo(() => {
    if (!effectiveVoiceId) return null;

    return (
      voices?.edge?.find(
        (voice: EdgeVoice) =>
          voice.short_name === effectiveVoiceId ||
          voice.id === effectiveVoiceId,
      ) ?? null
    );
  }, [voices?.edge, effectiveVoiceId]);

  const selectedFishVoice = useMemo(() => {
    if (!fishVoiceIdOverride) return null;

    return voices?.fish?.find((v) => v.id === fishVoiceIdOverride) ?? null;
  }, [voices?.fish, fishVoiceIdOverride]);

  const voiceRowInfo = useMemo(() => {
    if (selectedFishVoice) {
      return {
        name: selectedFishVoice.name,
        gender: selectedFishVoice.gender,
        language:
          selectedFishVoice.languages?.[0] ??
          selectedFishVoice.locale ??
          "Fish voice",
      };
    }

    if (selectedEdgeVoice) {
      const info = deriveVoiceInfo(selectedEdgeVoice.short_name);

      return {
        name: info.name,
        gender: selectedEdgeVoice.gender,
        language: `${info.language} (${info.country})`,
      };
    }

    if (effectiveVoiceId) {
      const info = deriveVoiceInfo(effectiveVoiceId);

      return {
        name: info.name || effectiveVoiceId,
        gender: "",
        language:
          info.language && info.country
            ? `${info.language} (${info.country})`
            : "Voice",
      };
    }

    return {
      name: "No voice selected",
      gender: "",
      language: "Choose a voice",
    };
  }, [effectiveVoiceId, selectedEdgeVoice, selectedFishVoice]);

  const openVoicePicker = () => {
    setVoiceSearch("");
    setVoiceSheetVisible(true);
  };

  const closeVoicePicker = () => {
    setVoiceSheetVisible(false);
    setVoiceSearch("");
  };

  const selectVoice = (dv: DisplayVoice) => {
    if (dv.locked) {
      closeVoicePicker();
      router.push("/pricing");
      return;
    }

    if (dv.provider === "fish") {
      setFishVoiceIdOverride(dv.id);
      setFishModelOverride("s2-pro");
      setVoiceOverride(null);
    } else {
      setVoiceOverride(dv.id);
      setFishVoiceIdOverride(null);
      setFishModelOverride(null);
    }

    closeVoicePicker();
  };

  const clearVoiceOverride = () => {
    setVoiceOverride(null);
    setFishVoiceIdOverride(null);
    setFishModelOverride(null);
  };

  const filteredVoices: DisplayVoice[] = useMemo(() => {
    const q = voiceSearch.trim().toLowerCase();

    const fishVoices: DisplayVoice[] = (voices?.fish ?? []).map(
      (v: FishVoice) => ({
        key: `fish-${v.id}`,
        provider: "fish" as const,
        id: v.id,
        name: v.name,
        gender: v.gender,
        language: v.languages?.[0] ?? v.locale ?? "",
        country: "",
        locked: premiumLocked,
      }),
    );

    const edgeVoices: DisplayVoice[] = (voices?.edge ?? []).map((v) => {
      const info = deriveVoiceInfo(v.short_name);
      return {
        key: `edge-${v.short_name}`,
        provider: "edge" as const,
        id: v.short_name,
        name: info.name,
        gender: v.gender,
        language: info.language,
        country: info.country,
        locked: false,
      };
    });

    const combined = [...fishVoices, ...edgeVoices];

    if (!q) return combined;

    return combined.filter((v) =>
      `${v.name} ${v.language} ${v.country}`.toLowerCase().includes(q),
    );
  }, [voices?.edge, voices?.fish, voiceSearch, premiumLocked]);

  const selectedSound = useMemo(
    () =>
      systemSounds?.find((s: SystemSound) => s.id === selectedSoundId) ?? null,
    [systemSounds, selectedSoundId],
  );

  const filteredSounds = useMemo(() => {
    const q = soundSearch.trim().toLowerCase();
    const list = systemSounds ?? [];

    if (!q) return list;

    return list.filter((s: SystemSound) => s.name.toLowerCase().includes(q));
  }, [systemSounds, soundSearch]);

  const openSoundPicker = () => {
    setSoundSearch("");
    setSoundSheetVisible(true);
  };

  const closeSoundPicker = () => {
    setSoundSheetVisible(false);
    setSoundSearch("");
  };

  const selectSystemSound = (soundId: number) => {
    setSelectedSoundId(soundId);
    stopSystemSoundPreview();
    closeSoundPicker();
  };

  const MAX_SOUND_SIZE = 2 * 1024 * 1024; // 10 MB

  const pickAndUploadSound = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (!asset) return;

    if (asset.size != null && asset.size > MAX_SOUND_SIZE) {
      reportError("Please choose an audio file smaller than 10 MB.");

      return;
    }

    const name = asset.name.replace(/\.[^/.]+$/, "");

    try {
      const uploaded = await uploadUserSound(name, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
      });

      setCustomAudioId(String(uploaded.id));
      setCustomAudioUrl(uploaded.public_url);

      setCustomSoundSheetVisible(false);
    } catch (error) {
      reportError("Failed to upload sound: " + error);
    }
  };

  const selectExistingUserSound = (sound: {
    id: number;
    name: string;
    public_url: string;
  }) => {
    setCustomAudioId(String(sound.id));
    setCustomAudioUrl(sound.public_url);

    stopUserSoundPreview();
    setCustomSoundSheetVisible(false);
  };

  const save = async () => {
    if (enabled) {
      if (mode === "tts" && !ttsTemplate.trim()) {
        Alert.alert(
          "Add a message",
          "Enter what should be spoken for this alert.",
        );
        return;
      }

      if (mode === "system" && selectedSoundId === null) {
        Alert.alert(
          "Select a sound",
          "Choose one of EchoStream's built-in sounds.",
        );
        return;
      }

      if (mode === "custom" && !customAudioId) {
        Alert.alert(
          "Add a sound",
          "Upload or choose a custom audio file for this alert.",
        );
        return;
      }
    }

    const existing = config ?? createDefaultAlertConfig(key);

    const nextConfig: EventAlertConfig = {
      ...existing,
      enabled,
      alert_type: alertTypeFromMode[mode],

      tts_template: mode === "tts" ? ttsTemplate : existing.tts_template,

      system_sound_id:
        mode === "system" && selectedSoundId !== null
          ? String(selectedSoundId)
          : null,

      custom_audio_id:
        mode === "custom" ? customAudioId : existing.custom_audio_id,

      custom_audio_url:
        mode === "custom" ? customAudioUrl : existing.custom_audio_url,

      tts_provider: hasVoiceOverride
        ? fishVoiceIdOverride
          ? "fish"
          : "edge"
        : "edge",

      voice: hasVoiceOverride ? voiceOverride : null,
      fish_voice_id: hasVoiceOverride ? fishVoiceIdOverride : null,
      fish_model: hasVoiceOverride ? fishModelOverride : null,
    };

    setSaving(true);

    try {
      if (giftKey) {
        const giftId = giftIdFromKey(key);

        await putGiftPreference(nextConfig, giftId);
      } else {
        const store = usePreferencesStore.getState();
        const current = store.preferences;

        if (!current) return;

        const nextEvents = {
          ...(current.events ?? {}),
          [key]: nextConfig,
        };

        const next: Preferences = {
          ...current,
          events: nextEvents,
        };

        store.setPreferences(next);

        const saved = await updatePreferences(next);

        usePreferencesStore.getState().setPreferences(saved);
      }

      router.back();
    } catch (error) {
      reportError("Failed to save sound alert: " + error);

      Alert.alert(
        "Couldn't save",
        "Something went wrong saving this alert. Please try again.",
      );

      try {
        if (giftKey) {
          await useGiftPreferencesStore.getState().fetchGiftspref(true);
        } else {
          await usePreferencesStore.getState().fetchPreferences(true);
        }
      } catch (refreshError) {
        reportError("Failed to restore preferences: " + refreshError);
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Delete alert?", "This will remove the alert configuration.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: deleteAlert,
      },
    ]);
  };

  const deleteAlert = async () => {
    if (!giftKey) {
      router.back();
      return;
    }

    const giftId = giftIdFromKey(key);

    router.back();

    try {
      await deleteGiftPreference(giftId);
    } catch (error) {
      reportError("Failed to delete sound alert: " + error);

      try {
        await useGiftPreferencesStore.getState().fetchGiftspref(true);
      } catch (refreshError) {
        reportError("Failed to restore preferences: " + refreshError);
      }
    }
  };

  const modes: {
    id: AudioMode;
    title: string;
    subtitle: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
  }[] = [
    {
      id: "tts",
      title: "Text to Speech",
      subtitle: "Generate speech for this event.",
      icon: "chatbubble-ellipses-outline",
    },
    {
      id: "system",
      title: "System Sound",
      subtitle: "Use an EchoStream built-in sound.",
      icon: "musical-notes-outline",
    },
    {
      id: "custom",
      title: "Custom Audio",
      subtitle: "Play your uploaded audio file.",
      icon: "cloud-upload-outline",
    },
  ];

  const selectedCustomSound = useMemo(() => {
    if (!customAudioId) return null;

    return (
      userSounds?.find((sound) => String(sound.id) === customAudioId) ?? null
    );
  }, [userSounds, customAudioId]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={theme.bgGradient}
          style={StyleSheet.absoluteFillObject}
        />

        <LinearGradient
          colors={[theme.topGlow, "transparent"]}
          style={styles.topGlow}
        />
      </View>

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={theme.onSurface} />
        </Pressable>

        <Text style={[styles.title, { color: theme.onSurface }]}>
          Sound Alert
        </Text>

        {deletable ? (
          <Pressable onPress={confirmDelete} hitSlop={12}>
            <Ionicons
              name="trash-outline"
              size={20}
              color={theme.onSurfaceVariant}
            />
          </Pressable>
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
          Event
        </Text>

        <View
          style={[
            styles.card,
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
          <View style={styles.selected}>
            {headerInfo.imageUrl ? (
              <Image
                source={{ uri: headerInfo.imageUrl }}
                style={styles.bigImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.bigEmoji}>{headerInfo.emoji}</Text>
            )}

            <View style={{ flex: 1 }}>
              <Text style={[styles.selectedName, { color: theme.onSurface }]}>
                {headerInfo.name}
              </Text>

              {!!headerInfo.meta && (
                <Text style={[styles.meta, { color: theme.onSurfaceVariant }]}>
                  {headerInfo.meta}
                </Text>
              )}
            </View>
          </View>
        </View>

        <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
          Alert sound
        </Text>

        <View
          style={[
            styles.card,
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
          {modes.map((m) => {
            const isCustomAudio = m.id === "custom";

            return (
              <Pressable
                key={m.id}
                onPress={() => setMode(m.id)}
                style={[
                  styles.option,
                  mode === m.id && {
                    borderColor: theme.primary,
                  },
                ]}
              >
                <Ionicons
                  name={m.icon}
                  size={21}
                  color={mode === m.id ? theme.primary : theme.onSurfaceVariant}
                />

                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionTitle,
                      {
                        color: theme.onSurface,
                      },
                    ]}
                  >
                    {m.title}
                  </Text>

                  <Text
                    style={[
                      styles.optionSub,
                      {
                        color: theme.onSurfaceVariant,
                      },
                    ]}
                  >
                    {m.subtitle}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {isCustomAudio && premiumLocked && (
                    <Ionicons
                      name="lock-closed"
                      size={15}
                      color={theme.onSurfaceVariant}
                    />
                  )}

                  <Ionicons
                    name={
                      mode === m.id ? "radio-button-on" : "radio-button-off"
                    }
                    size={20}
                    color={
                      mode === m.id ? theme.primary : theme.onSurfaceVariant
                    }
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        {mode === "tts" && (
          <>
            <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
              Voice
            </Text>

            <View
              style={[
                styles.card,
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
              <Pressable onPress={openVoicePicker} style={styles.voiceRow}>
                <View style={styles.voiceInfo}>
                  <View style={styles.voiceNameRow}>
                    <Text
                      style={[styles.voiceName, { color: theme.onSurface }]}
                      numberOfLines={1}
                    >
                      {voiceRowInfo.name}
                    </Text>

                    {!!voiceRowInfo.gender && (
                      <Text
                        style={[
                          styles.voiceGender,
                          {
                            color: theme.onSurfaceVariant,
                          },
                        ]}
                      >
                        ({voiceRowInfo.gender})
                      </Text>
                    )}

                    {!hasVoiceOverride && (
                      <View
                        style={[
                          styles.defaultBadge,
                          {
                            backgroundColor: theme.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.defaultBadgeText,
                            {
                              color: theme.onSurfaceVariant,
                            },
                          ]}
                        >
                          Default
                        </Text>
                      </View>
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
                    {voiceRowInfo.language}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.onSurfaceVariant}
                />
              </Pressable>

              {hasVoiceOverride && (
                <Pressable
                  onPress={clearVoiceOverride}
                  style={styles.useDefaultRow}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={15}
                    color={theme.primary}
                  />

                  <Text
                    style={[styles.useDefaultText, { color: theme.primary }]}
                  >
                    Use account default voice instead
                  </Text>
                </Pressable>
              )}
            </View>

            <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
              Message template
            </Text>

            <View
              style={[
                styles.card,
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
              <TextInput
                value={ttsTemplate}
                onChangeText={setTtsTemplate}
                placeholder="e.g. {{user}} sent {{gift}}"
                placeholderTextColor={theme.onSurfaceVariant}
                multiline
                style={[
                  styles.input,
                  styles.ttsInput,
                  {
                    color: theme.onSurface,
                    borderWidth: 0,
                  },
                ]}
              />
            </View>
          </>
        )}

        {mode === "system" && (
          <>
            <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
              EchoStream sounds
            </Text>

            <View
              style={[
                styles.card,
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
              {selectedSound ? (
                <Pressable onPress={openSoundPicker} style={styles.selected}>
                  <View style={[styles.soundIcon]}>
                    <Ionicons
                      name="musical-notes"
                      size={19}
                      color={theme.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.selectedName, { color: theme.onSurface }]}
                      numberOfLines={1}
                    >
                      {selectedSound.name}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      playSystemSoundPreview(
                        selectedSound.id,
                        selectedSound.public_url,
                      )
                    }
                  >
                    <Ionicons
                      name={
                        previewingSoundId === selectedSound.id
                          ? "pause-circle"
                          : "play-circle"
                      }
                      size={28}
                      color={theme.primary}
                    />
                  </Pressable>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.onSurfaceVariant}
                  />
                </Pressable>
              ) : (
                <Pressable
                  onPress={openSoundPicker}
                  style={[styles.upload, { borderColor: theme.outline }]}
                >
                  <Ionicons
                    name="musical-notes-outline"
                    size={28}
                    color={theme.primary}
                  />

                  <Text
                    style={[styles.uploadTitle, { color: theme.onSurface }]}
                  >
                    Choose a system sound
                  </Text>

                  <Text
                    style={[
                      styles.uploadSub,
                      {
                        color: theme.onSurfaceVariant,
                      },
                    ]}
                  >
                    Pick from EchoStream's built-in sound library
                  </Text>
                </Pressable>
              )}
            </View>
          </>
        )}

        {mode === "custom" && (
          <>
            <Text
              style={[
                styles.label,
                {
                  color: theme.onSurfaceVariant,
                },
              ]}
            >
              Custom audio
            </Text>

            {premiumLocked ? (
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
                  <Text
                    style={[styles.proSubtitle, { color: theme.buttonText }]}
                  >
                    Enjoy all voices and features without any restrictions.
                  </Text>
                  <View
                    style={[
                      styles.proButton,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <Text
                      style={[styles.proButtonText, { color: theme.primary }]}
                    >
                      Upgrade
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            ) : (
              <View
                style={[
                  styles.card,
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
                {customAudioId && customAudioUrl ? (
                  <Pressable
                    onPress={() => setCustomSoundSheetVisible(true)}
                    style={styles.selected}
                  >
                    <View style={styles.soundIcon}>
                      <Ionicons
                        name="musical-notes"
                        size={19}
                        color={theme.primary}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.selectedName,
                          {
                            color: theme.onSurface,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {selectedCustomSound?.name ?? "Custom sound selected"}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        playUserSoundPreview(
                          Number(customAudioId),
                          customAudioUrl,
                        )
                      }
                    >
                      {loadingUserSoundId === Number(customAudioId) ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <Ionicons
                          name={
                            previewingUserSoundId === Number(customAudioId)
                              ? "pause-circle"
                              : "play-circle"
                          }
                          size={28}
                          color={theme.primary}
                        />
                      )}
                    </Pressable>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={theme.onSurfaceVariant}
                    />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => setCustomSoundSheetVisible(true)}
                    disabled={uploading}
                    style={[
                      styles.upload,
                      {
                        borderColor: theme.outline,
                        opacity: uploading ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={28}
                      color={theme.primary}
                    />

                    <Text
                      style={[
                        styles.uploadTitle,
                        {
                          color: theme.onSurface,
                        },
                      ]}
                    >
                      {uploading ? "Uploading…" : "Choose custom audio"}
                    </Text>

                    <Text
                      style={[
                        styles.uploadSub,
                        {
                          color: theme.onSurfaceVariant,
                        },
                      ]}
                    >
                      Upload a new file or pick one you've used before
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surfaceVariant,
              borderWidth: 0,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 5,
              marginTop: 16,
            },
          ]}
        >
          <ToggleRow
            label="Enabled"
            value={enabled}
            onValueChange={setEnabled}
            bold
          />
        </View>

        <Pressable
          onPress={save}
          disabled={saving}
          style={[
            styles.save,
            {
              backgroundColor: theme.primary,
              opacity: saving ? 0.6 : 1,
            },
          ]}
        >
          <Text style={[styles.saveText, { color: theme.buttonText }]}>
            {saving ? "Saving…" : "Save Changes"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Voice picker */}
      <BottomSheet
        visible={voiceSheetVisible}
        title="Select a voice"
        icon="mic-outline"
        onClose={closeVoicePicker}
        maxHeight={0.85}
      >
        <View style={styles.pickerHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pickerSub, { color: theme.onSurfaceVariant }]}>
              This overrides the account default just for this alert.
              {premiumLocked ? " Premium voices need Essential or Pro." : ""}
            </Text>
          </View>
        </View>

        <View style={styles.pickerSearchWrapper}>
          <SearchBar
            value={voiceSearch}
            onChangeText={setVoiceSearch}
            placeholder="Search voices…"
          />
        </View>

        <FlatList
          data={filteredVoices}
          keyExtractor={(v) => v.key}
          contentContainerStyle={styles.pickerListContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const selected =
              item.provider === "fish"
                ? fishVoiceIdOverride === item.id
                : voiceOverride === item.id;

            return (
              <Pressable
                onPress={() => selectVoice(item)}
                style={[
                  styles.pickerRow,
                  {
                    borderColor: selected ? theme.primary : theme.outline,
                    backgroundColor: selected ? theme.surface : "transparent",
                  },
                  item.locked && { opacity: 0.55 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.pickerRowName, { color: theme.onSurface }]}
                    numberOfLines={1}
                  >
                    {item.name} {item.gender ? `(${item.gender})` : ""}
                  </Text>

                  <Text
                    style={[
                      styles.pickerRowMeta,
                      {
                        color: theme.onSurfaceVariant,
                      },
                    ]}
                  >
                    {item.country
                      ? `${item.language} (${item.country})`
                      : item.language}
                  </Text>
                </View>

                {item.locked ? (
                  <Ionicons
                    name="lock-closed"
                    size={16}
                    color={theme.onSurfaceVariant}
                  />
                ) : (
                  selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.primary}
                    />
                  )
                )}
              </Pressable>
            );
          }}
        />
      </BottomSheet>

      {/* System sound picker */}
      <BottomSheet
        visible={soundSheetVisible}
        title="Select a system sound"
        icon="musical-notes-outline"
        onClose={closeSoundPicker}
        maxHeight={0.85}
      >
        <View style={styles.pickerHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pickerSub, { color: theme.onSurfaceVariant }]}>
              One of EchoStream's built-in sounds for this alert.
            </Text>
          </View>
        </View>

        <View style={styles.pickerSearchWrapper}>
          <SearchBar
            value={soundSearch}
            onChangeText={setSoundSearch}
            placeholder="Search sounds…"
          />
        </View>

        <FlatList
          data={filteredSounds}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={styles.pickerListContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const selected = selectedSoundId === item.id;

            return (
              <Pressable
                onPress={() => selectSystemSound(item.id)}
                style={[
                  styles.pickerRow,
                  {
                    borderColor: selected ? theme.primary : theme.outline,
                    backgroundColor: selected ? theme.surface : "transparent",
                  },
                ]}
              >
                <View
                  style={[
                    styles.soundIcon,
                    {
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name="musical-notes"
                    size={19}
                    color={theme.primary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.pickerRowName, { color: theme.onSurface }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    playSystemSoundPreview(item.id, item.public_url)
                  }
                >
                  <Ionicons
                    name={
                      previewingSoundId === item.id
                        ? "pause-circle"
                        : "play-circle-outline"
                    }
                    size={25}
                    color={theme.primary}
                  />
                </Pressable>

                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.primary}
                  />
                )}
              </Pressable>
            );
          }}
        />
      </BottomSheet>

      {/* User/custom sound picker */}
      <BottomSheet
        visible={customSoundSheetVisible}
        title="Custom audio"
        icon="cloud-upload-outline"
        onClose={() => setCustomSoundSheetVisible(false)}
        maxHeight={0.85}
      >
        <View style={styles.pickerHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pickerSub, { color: theme.onSurfaceVariant }]}>
              Upload a new file or reuse one you've already added.
            </Text>
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: 20,
            marginBottom: 8,
          }}
        >
          <Pressable
            onPress={pickAndUploadSound}
            disabled={uploading}
            style={[
              styles.upload,
              {
                borderColor: theme.outline,
                paddingVertical: 18,
                opacity: uploading ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={22}
              color={theme.primary}
            />

            <Text
              style={[
                styles.uploadTitle,
                {
                  color: theme.onSurface,
                  marginTop: 6,
                },
              ]}
            >
              {uploading ? "Uploading…" : "Upload a new file"}
            </Text>
          </Pressable>
        </View>

        <FlatList
          data={userSounds ?? []}
          keyExtractor={(sound) => String(sound.id)}
          contentContainerStyle={styles.pickerListContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !uploading ? (
              <View style={styles.emptySounds}>
                <Ionicons
                  name="musical-notes-outline"
                  size={30}
                  color={theme.onSurfaceVariant}
                />

                <Text
                  style={[
                    styles.emptySoundsText,
                    {
                      color: theme.onSurfaceVariant,
                    },
                  ]}
                >
                  No custom sounds yet
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const selected = customAudioId === String(item.id);

            return (
              <Pressable
                onPress={() => selectExistingUserSound(item)}
                style={[
                  styles.pickerRow,
                  {
                    borderColor: selected ? theme.primary : theme.outline,
                    backgroundColor: selected ? theme.surface : "transparent",
                  },
                ]}
              >
                <View
                  style={[
                    styles.soundIcon,
                    {
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name="musical-notes"
                    size={19}
                    color={theme.primary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.pickerRowName, { color: theme.onSurface }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </View>

                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();

                    playUserSoundPreview(item.id, item.public_url);
                  }}
                  hitSlop={8}
                >
                  <Ionicons
                    name={
                      previewingUserSoundId === item.id
                        ? "pause-circle"
                        : loadingUserSoundId === item.id
                          ? "hourglass-outline"
                          : "play-circle-outline"
                    }
                    size={25}
                    color={theme.primary}
                  />
                </Pressable>

                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.primary}
                  />
                )}
              </Pressable>
            );
          }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topGlow: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.45,
    borderRadius: width,
  },

  header: {
    height: 58,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
  },

  content: {
    padding: 20,
    paddingBottom: 60,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 8,
  },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
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

  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  defaultBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  useDefaultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },

  useDefaultText: {
    fontSize: 12,
    fontWeight: "700",
  },

  selected: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 56,
  },

  bigEmoji: {
    fontSize: 38,
  },

  bigImage: {
    width: 44,
    height: 44,
  },

  selectedName: {
    fontSize: 14,
    fontWeight: "700",
  },

  meta: {
    fontSize: 11,
    marginTop: 2,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 14,
  },

  ttsInput: {
    minHeight: 80,
    textAlignVertical: "top",
    marginTop: 0,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },

  optionText: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  optionSub: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  soundIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  fileIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  fileName: {
    fontSize: 13,
    fontWeight: "700",
  },

  fileSize: {
    fontSize: 11,
    marginTop: 3,
  },

  replace: {
    fontSize: 12,
    fontWeight: "700",
  },

  upload: {
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 28,
  },

  uploadTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },

  uploadSub: {
    fontSize: 12,
    marginTop: 4,
  },

  info: {
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  save: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },

  saveText: {
    fontSize: 14,
    fontWeight: "800",
  },

  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },

  pickerTitle: {
    fontSize: 14,
    fontWeight: "800",
  },

  pickerSub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  pickerSearchWrapper: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  pickerListContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  pickerRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  pickerRowName: {
    fontSize: 13,
    fontWeight: "700",
  },

  pickerRowMeta: {
    fontSize: 11,
    marginTop: 2,
  },

  emptySounds: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },

  emptySoundsText: {
    fontSize: 13,
  },

  ///
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
});
