import ToggleRow from "@/components/common/ToggleRow";
import { SYSTEM_SOUNDS, SystemSound, TIKTOK_GIFTS } from "@/data/sound-alerts";
import { useAppTheme } from "@/hooks/use-theme-color";
import { updatePreferences } from "@/lib/api";
import type { EventAlertConfig, Preferences } from "@/lib/schema";
import { reportError } from "@/store/error.store";
import { usePreferencesStore } from "@/store/preference.store";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
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

// NOTE: duplicated from the Gifts tab's key parsing (getAlertDisplay /
// isBaseAlertKey). Worth extracting into a shared module (e.g.
// @/lib/sound-alert-keys.ts) so the two can't drift — flagging rather than
// doing it here since I don't have visibility into your module layout.
function getAlertHeaderInfo(key: string): {
  emoji: string;
  name: string;
  meta: string;
} {
  if (key === "like") return { emoji: "❤️", name: "Likes", meta: "Chat event" };
  if (key === "follow")
    return { emoji: "➕", name: "New Followers", meta: "Chat event" };
  if (key === "gift")
    return { emoji: "🎁", name: "Any Gift", meta: "Any TikTok gift" };

  if (key.startsWith("gift-")) {
    const giftId = key.slice("gift-".length);
    const gift = TIKTOK_GIFTS.find((g) => g.id === giftId);
    if (gift)
      return {
        emoji: gift.emoji,
        name: gift.name,
        meta: gift.coins ? `${gift.coins} coins` : gift.category,
      };
    return { emoji: "🎁", name: giftId, meta: "TikTok gift" };
  }

  return { emoji: "🔔", name: key, meta: "" };
}

// Only specific-gift alerts can be removed entirely — the 3 base rows
// (like/follow/any-gift) always exist in the Gifts tab and can only be
// disabled, not deleted.
function isDeletableKey(key: string) {
  return key.startsWith("gift-");
}

function createDefaultAlertConfig(key: string): EventAlertConfig {
  const event_type = key === "like" || key === "follow" ? key : "gift";
  const gift_id = key.startsWith("gift-") ? key.slice("gift-".length) : null;

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

export default function SoundAlertScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const key = id ?? "";

  const preferences = usePreferencesStore((state) => state.preferences);
  const fetchPreferences = usePreferencesStore(
    (state) => state.fetchPreferences,
  );

  useEffect(() => {
    fetchPreferences().catch((error) => {
      reportError("Failed to load preferences: " + error);
    });
  }, [fetchPreferences]);

  const config = preferences?.events?.[key];
  const headerInfo = useMemo(() => getAlertHeaderInfo(key), [key]);
  const deletable = isDeletableKey(key);

  const [mode, setMode] = useState<AudioMode>("tts");
  const [enabled, setEnabled] = useState(true);
  const [ttsTemplate, setTtsTemplate] = useState("");
  const [selectedSound, setSelectedSound] = useState<SystemSound | null>(null);
  const [customSound, setCustomSound] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [soundSearch, setSoundSearch] = useState("");
  const [soundListOpen, setSoundListOpen] = useState(false);
  const [previewingSound, setPreviewingSound] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate local state from the loaded config once — not on every store
  // update, so we don't clobber an in-progress edit if preferences refetch
  // while this screen is open.
  useEffect(() => {
    if (!config || hydrated) return;

    setMode(modeFromAlertType(config.alert_type));
    setEnabled(config.enabled);
    setTtsTemplate(config.tts_template ?? "");
    setSelectedSound(
      SYSTEM_SOUNDS.find((s) => s.id === config.system_sound_id) ?? null,
    );
    setHydrated(true);
  }, [config, hydrated]);

  const filteredSounds = useMemo(
    () =>
      SYSTEM_SOUNDS.filter((s) =>
        `${s.name} ${s.description}`
          .toLowerCase()
          .includes(soundSearch.trim().toLowerCase()),
      ),
    [soundSearch],
  );

  const pickSound = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled) setCustomSound(result.assets[0]);
  };

  const selectSystemSound = (s: SystemSound) => {
    setSelectedSound(s);
    setSoundListOpen(false);
    setSoundSearch("");
    setPreviewingSound(null);
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

      if (mode === "system" && !selectedSound) {
        Alert.alert(
          "Select a sound",
          "Choose one of EchoStream's built-in sounds.",
        );
        return;
      }

      // Custom audio needs to be uploaded to an asset the server can
      // reference (custom_audio_id) before this alert can be saved with it.
      // There's no upload endpoint wired up yet, so block save here rather
      // than send a request that will 422 confusingly.
      if (mode === "custom" && !config?.custom_audio_id) {
        Alert.alert(
          "Custom audio isn't available yet",
          "Uploading a new audio file for alerts is not supported in this build. Try Text to Speech or a System Sound instead.",
        );
        return;
      }
    }

    const store = usePreferencesStore.getState();
    const current = store.preferences;
    if (!current) return;

    const existing = current.events?.[key] ?? createDefaultAlertConfig(key);

    const nextConfig: EventAlertConfig = {
      ...existing,
      enabled,
      alert_type: alertTypeFromMode[mode],
      tts_template: mode === "tts" ? ttsTemplate : existing.tts_template,
      system_sound_id: mode === "system" ? (selectedSound?.id ?? null) : null,
      // custom_audio_id/url are left untouched from `existing` — there's no
      // upload flow to produce a new one yet (see the guard above).
    };

    const nextEvents = { ...(current.events ?? {}), [key]: nextConfig };
    const next: Preferences = { ...current, events: nextEvents };

    setSaving(true);
    store.setPreferences(next); // optimistic

    try {
      const saved = await updatePreferences(next);
      usePreferencesStore.getState().setPreferences(saved);
      router.back();
    } catch (error) {
      reportError("Failed to save sound alert: " + error);
      Alert.alert(
        "Couldn't save",
        "Something went wrong saving this alert. Please try again.",
      );

      try {
        await usePreferencesStore.getState().fetchPreferences(true);
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
      { text: "Delete", style: "destructive", onPress: deleteAlert },
    ]);
  };

  const deleteAlert = async () => {
    const store = usePreferencesStore.getState();
    const current = store.preferences;

    if (!current?.events) {
      router.back();
      return;
    }

    const { [key]: _removed, ...rest } = current.events;
    const next: Preferences = { ...current, events: rest };

    store.setPreferences(next); // optimistic
    router.back();

    try {
      const saved = await updatePreferences(next);
      usePreferencesStore.getState().setPreferences(saved);
    } catch (error) {
      reportError("Failed to delete sound alert: " + error);

      try {
        await usePreferencesStore.getState().fetchPreferences(true);
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
          <Ionicons name="arrow-back" size={22} color={theme.onSurface} />
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
              borderColor: theme.outline,
            },
          ]}
        >
          <View style={styles.selected}>
            <Text style={styles.bigEmoji}>{headerInfo.emoji}</Text>
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
              borderColor: theme.outline,
            },
          ]}
        >
          {modes.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setMode(m.id)}
              style={[
                styles.option,
                mode === m.id && { borderColor: theme.primary },
              ]}
            >
              <Ionicons
                name={m.icon}
                size={21}
                color={mode === m.id ? theme.primary : theme.onSurfaceVariant}
              />
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: theme.onSurface }]}>
                  {m.title}
                </Text>
                <Text
                  style={[styles.optionSub, { color: theme.onSurfaceVariant }]}
                >
                  {m.subtitle}
                </Text>
              </View>
              <Ionicons
                name={mode === m.id ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={mode === m.id ? theme.primary : theme.onSurfaceVariant}
              />
            </Pressable>
          ))}
        </View>

        {mode === "tts" && (
          <>
            <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
              Message template
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
                    borderColor: theme.outline,
                    backgroundColor: theme.surface,
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
                  borderColor: theme.outline,
                },
              ]}
            >
              {selectedSound && (
                <View style={styles.selected}>
                  <View
                    style={[
                      styles.soundIcon,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <Ionicons
                      name={selectedSound.icon as any}
                      size={19}
                      color={theme.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.selectedName, { color: theme.onSurface }]}
                    >
                      {selectedSound.name}
                    </Text>
                    <Text
                      style={[styles.meta, { color: theme.onSurfaceVariant }]}
                    >
                      {selectedSound.description}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      setPreviewingSound((v) =>
                        v === selectedSound.id ? null : selectedSound.id,
                      )
                    }
                  >
                    <Ionicons
                      name={
                        previewingSound === selectedSound.id
                          ? "pause-circle"
                          : "play-circle"
                      }
                      size={28}
                      color={theme.primary}
                    />
                  </Pressable>
                  <Pressable onPress={() => setSoundListOpen((v) => !v)}>
                    <Ionicons
                      name={soundListOpen ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={theme.onSurfaceVariant}
                    />
                  </Pressable>
                </View>
              )}

              {(!selectedSound || soundListOpen) && (
                <>
                  <TextInput
                    value={soundSearch}
                    onChangeText={setSoundSearch}
                    placeholder="Search system sounds…"
                    placeholderTextColor={theme.onSurfaceVariant}
                    style={[
                      styles.input,
                      {
                        color: theme.onSurface,
                        borderColor: theme.outline,
                        backgroundColor: theme.surface,
                      },
                    ]}
                  />

                  {filteredSounds.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => selectSystemSound(s)}
                      style={styles.listRow}
                    >
                      <View
                        style={[
                          styles.soundIcon,
                          { backgroundColor: theme.surface },
                        ]}
                      >
                        <Ionicons
                          name={s.icon as any}
                          size={19}
                          color={theme.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.itemName, { color: theme.onSurface }]}
                        >
                          {s.name}
                        </Text>
                        <Text
                          style={[
                            styles.helper,
                            { color: theme.onSurfaceVariant },
                          ]}
                        >
                          {s.description}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() =>
                          setPreviewingSound((v) => (v === s.id ? null : s.id))
                        }
                      >
                        <Ionicons
                          name={
                            previewingSound === s.id
                              ? "pause-circle"
                              : "play-circle-outline"
                          }
                          size={25}
                          color={theme.primary}
                        />
                      </Pressable>
                    </Pressable>
                  ))}
                </>
              )}
            </View>
          </>
        )}

        {mode === "custom" && (
          <>
            <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>
              Custom audio
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
              {customSound ? (
                <View style={styles.fileRow}>
                  <View
                    style={[
                      styles.fileIcon,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <Ionicons
                      name="musical-note"
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={[styles.fileName, { color: theme.onSurface }]}
                    >
                      {customSound.name}
                    </Text>
                    <Text
                      style={[
                        styles.fileSize,
                        { color: theme.onSurfaceVariant },
                      ]}
                    >
                      {Math.round((customSound.size ?? 0) / 1024)} KB
                    </Text>
                  </View>
                  <Pressable onPress={pickSound}>
                    <Text style={[styles.replace, { color: theme.primary }]}>
                      Replace
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={pickSound}
                  style={[styles.upload, { borderColor: theme.outline }]}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={28}
                    color={theme.primary}
                  />
                  <Text
                    style={[styles.uploadTitle, { color: theme.onSurface }]}
                  >
                    Upload a sound
                  </Text>
                  <Text
                    style={[
                      styles.uploadSub,
                      { color: theme.onSurfaceVariant },
                    ]}
                  >
                    MP3, WAV, M4A and other audio files
                  </Text>
                </Pressable>
              )}

              <View
                style={[
                  styles.info,
                  { backgroundColor: theme.surface, marginTop: 12 },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text
                  style={[styles.infoText, { color: theme.onSurfaceVariant }]}
                >
                  Custom audio upload isn't wired up to the server yet in this
                  build — picking a file here won't save.
                </Text>
              </View>
            </View>
          </>
        )}

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.outline,
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
            { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.saveText, { color: theme.buttonText }]}>
            {saving ? "Saving…" : "Save Changes"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  title: { fontSize: 18, fontWeight: "700" },
  content: { padding: 20, paddingBottom: 60 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 8,
  },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16 },
  selected: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 56,
  },
  bigEmoji: { fontSize: 38 },
  selectedName: { fontSize: 14, fontWeight: "700" },
  meta: { fontSize: 11, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 10,
  },
  ttsInput: { minHeight: 80, textAlignVertical: "top", marginTop: 0 },
  listRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,.08)",
  },
  itemName: { fontSize: 13, fontWeight: "700" },
  helper: { fontSize: 12, lineHeight: 17 },
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
  optionText: { flex: 1 },
  optionTitle: { fontSize: 14, fontWeight: "700" },
  optionSub: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  soundIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  fileIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: { fontSize: 13, fontWeight: "700" },
  fileSize: { fontSize: 11, marginTop: 3 },
  replace: { fontSize: 12, fontWeight: "700" },
  upload: {
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 28,
  },
  uploadTitle: { fontSize: 14, fontWeight: "700", marginTop: 8 },
  uploadSub: { fontSize: 12, marginTop: 4 },
  info: { borderRadius: 14, padding: 14, flexDirection: "row", gap: 10 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  save: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { fontSize: 14, fontWeight: "800" },
});
