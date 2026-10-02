import PremiumBanner from "@/components/common/Premiumbanner";
import { Skeleton } from "@/components/common/Skeleton";
import Stepper from "@/components/common/Stepper";
import ToggleRow from "@/components/common/ToggleRow";
import { useAppTheme } from "@/hooks/use-theme-color";
import { getClonedVoice, updatePreferences } from "@/lib/api";
import type { AllowedUserType, ClonedVoice, Preferences } from "@/lib/schema";
import { reportError } from "@/store/error.store";
import { usePreferencesStore } from "@/store/preference.store";
import { useUserStore } from "@/store/user.store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// Used when the cloned voice is switched off (schema doesn't store the previous voice)
const FALLBACK_EDGE_VOICE = "en-US-JennyNeural";

type AllowedUsersState = {
  allUsers: boolean;
  subscribers: boolean;
  moderators: boolean;
  teamMembers: boolean;
};

const toAllowedArray = (u: AllowedUsersState): AllowedUserType[] => {
  if (u.allUsers) return ["all"];
  const out: AllowedUserType[] = [];
  if (u.subscribers) out.push("subscriber");
  if (u.moderators) out.push("moderator");
  if (u.teamMembers) out.push("moderator_and_up");
  return out;
};

// Placeholder the backend swaps for the comment text. Change if yours differs.
const COMMENT_TOKEN = "{comment}";
const DEFAULT_COMMENT_TEMPLATE = "{user} said {comment}";
const buildTemplate = (enabled: boolean, prefix: string) =>
  enabled && prefix.trim() ? `${prefix.trim()}` : COMMENT_TOKEN;

const parseWords = (s: string) =>
  s
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);

export default function MicScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const user = useUserStore((state) => state.user);
  const isPro = user?.plan === "pro";

  const preferences = usePreferencesStore((s) => s.preferences);
  const fetchPreferences = usePreferencesStore((s) => s.fetchPreferences);

  /* ------------------------------ Local UI state ------------------------------ */

  // Sound prefix
  const [prefixEnabled, setPrefixEnabled] = useState(false);
  const [commentTemplate, setCommentTemplate] = useState(
    DEFAULT_COMMENT_TEMPLATE,
  );

  const [allowedUsers, setAllowedUsers] = useState<AllowedUsersState>({
    allUsers: false,
    subscribers: true,
    moderators: true,
    teamMembers: true,
  });
  const [minAccountAgeDays, setMinAccountAgeDays] = useState(0);
  const [blockedWordsEnabled, setBlockedWordsEnabled] = useState(false);
  const [blockedWords, setBlockedWords] = useState("");
  const [spamProtection, setSpamProtection] = useState(true);
  const [cooldown, setCooldown] = useState(5);
  const [maxPerMinute, setMaxPerMinute] = useState(10);
  const [blockRepeats, setBlockRepeats] = useState(true);
  const [autoMute, setAutoMute] = useState(false);

  /* ------------------------------ Cloned voice ------------------------------ */

  const [clonedVoice, setClonedVoice] = useState<ClonedVoice | null>(null);
  const [loadingCloned, setLoadingCloned] = useState(true);
  const [switchingVoice, setSwitchingVoice] = useState(false);

  // Cloned voice avatar mirrors the user's tt_image (cloning never sets coverimage)
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
    setAvatarLoading(!!user?.tt_image);
  }, [user?.tt_image]);

  const loadClonedVoice = useCallback(async () => {
    try {
      const voices = await getClonedVoice();
      // Only one cloned voice per user, so take the first
      setClonedVoice(voices[0] ?? null);
    } catch (err) {
      reportError("Failed to load cloned voice: " + err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        setLoadingCloned(true);
        try {
          const voices = await getClonedVoice();
          if (!cancelled) setClonedVoice(voices[0] ?? null);
        } catch (err) {
          reportError("Failed to load cloned voice: " + err);
        } finally {
          if (!cancelled) setLoadingCloned(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  // Switch state comes from saved preferences, so it's always accurate
  const useClonedVoice =
    !!clonedVoice &&
    preferences?.tts_provider === "fish" &&
    preferences?.fish_voice_id === clonedVoice.id;

  const handleToggleClonedVoice = async (next: boolean) => {
    if (!clonedVoice || switchingVoice) return;
    setSwitchingVoice(true);

    // Flush any pending debounced change first, in order, so this toggle
    // never races an in-flight PATCH+GET pair from another control.
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await flush();

    try {
      await enqueueSave(async () => {
        try {
          await updatePreferences(
            next
              ? {
                  tts_provider: "fish",
                  fish_voice_id: clonedVoice.id,
                  fish_model: "s2-pro",
                  voice: clonedVoice.name,
                }
              : { tts_provider: "edge", voice: FALLBACK_EDGE_VOICE },
          );
          await fetchPreferences(true);
        } catch (e) {
          reportError("Failed to switch voice: " + e);
        }
      });
    } finally {
      setSwitchingVoice(false);
    }
  };

  /* --------------------- Load preferences, then hydrate once --------------------- */

  useEffect(() => {
    fetchPreferences().catch((e) =>
      reportError("Failed to load preferences: " + e),
    );
  }, [fetchPreferences]);

  useEffect(() => {
    if (!preferences) return;

    const types = preferences.allowed_user_types ?? [];

    setAllowedUsers({
      allUsers: types.includes("all"),
      subscribers: types.includes("subscriber"),
      moderators: types.includes("moderator"),
      teamMembers: types.includes("moderator_and_up"),
    });

    setMinAccountAgeDays(preferences.minimum_account_age_days ?? 0);

    const words = preferences.blocked_words ?? [];
    setBlockedWordsEnabled(words.length > 0);
    setBlockedWords(words.join(", "));

    setSpamProtection(preferences.spam_protection_enabled ?? true);
    setCooldown(preferences.spam_cooldown_seconds ?? 5);
    setMaxPerMinute(preferences.spam_max_requests_per_minute ?? 10);
    setBlockRepeats(preferences.block_repeated_words ?? true);
    setAutoMute(preferences.auto_mute_repeat_offenders ?? false);

    const tpl =
      preferences.comment_speech_template?.trim() || DEFAULT_COMMENT_TEMPLATE;

    setPrefixEnabled(preferences.comment_speech_enabled ?? false);
    setCommentTemplate(tpl);
  }, [preferences]);

  /* ------------------------------ Serialized save queue ------------------------------ */

  // Every write (debounced patches AND the cloned-voice toggle) goes through
  // this single chain so only one PATCH+GET pair is ever in flight, in the
  // order the user actually triggered them. Without this, two concurrent
  // updatePreferences+fetchPreferences round trips can race, and whichever
  // GET response lands last wins — silently reverting an earlier change
  // (e.g. re-enabling the cloned voice) even though its PATCH succeeded.
  const saveChain = useRef<Promise<void>>(Promise.resolve());

  const enqueueSave = useCallback((task: () => Promise<void>) => {
    saveChain.current = saveChain.current.then(task).catch(() => {});
    return saveChain.current;
  }, []);

  /* ------------------------------ Debounced autosave ------------------------------ */

  const pending = useRef<Partial<Preferences>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length === 0) return Promise.resolve();
    return enqueueSave(async () => {
      try {
        await updatePreferences(patch);
        await fetchPreferences(true);
      } catch (e) {
        reportError("Failed to save preferences: " + e);
      }
    });
  }, [enqueueSave, fetchPreferences]);

  const queueSave = (patch: Partial<Preferences>, delay = 600) => {
    pending.current = { ...pending.current, ...patch };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, delay);
  };

  // Save anything still pending when leaving the screen
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      flush();
    };
  }, [flush]);

  /* ------------------------------ Pull to refresh ------------------------------ */

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchPreferences(true), loadClonedVoice()]);
    } catch (err) {
      reportError("Refresh failed: " + err);
    } finally {
      setRefreshing(false);
    }
  };

  /* ------------------------------ Change handlers ------------------------------ */

  const toggleAllowedUser = (key: keyof AllowedUsersState) => {
    const next = { ...allowedUsers, [key]: !allowedUsers[key] };
    setAllowedUsers(next);
    queueSave({ allowed_user_types: toAllowedArray(next) }, 300);
  };

  const onPrefixEnabled = (v: boolean) => {
    setPrefixEnabled(v);

    queueSave(
      {
        comment_speech_enabled: v,
        comment_speech_template: v
          ? commentTemplate.trim()
          : DEFAULT_COMMENT_TEMPLATE,
      },
      300,
    );
  };

  const onCommentTemplate = (text: string) => {
    setCommentTemplate(text);

    queueSave(
      {
        comment_speech_template: text,
      },
      900,
    );
  };

  const onMinAge = (v: number) => {
    setMinAccountAgeDays(v);
    queueSave({ minimum_account_age_days: v });
  };

  const onBlockedEnabled = (v: boolean) => {
    setBlockedWordsEnabled(v);
    queueSave({ blocked_words: v ? parseWords(blockedWords) : [] }, 300);
  };

  const onBlockedWords = (s: string) => {
    setBlockedWords(s);
    queueSave({ blocked_words: parseWords(s) }, 900);
  };

  const onSpamProtection = (v: boolean) => {
    setSpamProtection(v);
    queueSave({ spam_protection_enabled: v }, 300);
  };

  const onCooldown = (v: number) => {
    setCooldown(v);
    queueSave({ spam_cooldown_seconds: v });
  };

  const onMaxPerMinute = (v: number) => {
    setMaxPerMinute(v);
    queueSave({ spam_max_requests_per_minute: v });
  };

  const onBlockRepeats = (v: boolean) => {
    setBlockRepeats(v);
    queueSave({ block_repeated_words: v }, 300);
  };

  const onAutoMute = (v: boolean) => {
    setAutoMute(v);
    queueSave({ auto_mute_repeat_offenders: v }, 300);
  };

  /* ---------------------------------- Render ---------------------------------- */

  const cardStyle = [
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

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <Ionicons
          name="mic"
          size={19}
          color={theme.primary}
          style={styles.headerIcon}
        />
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
          Mic & Safety
        </Text>
        <View style={{ width: 19 }} />
      </Animated.View>

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
        {/* Voice cloning */}
        <Animated.Text
          entering={FadeInUp.duration(450).delay(100)}
          style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
        >
          Voice Cloning
        </Animated.Text>
        <Animated.View
          entering={FadeInUp.duration(500).delay(140)}
          style={cardStyle}
        >
          {isPro ? (
            <>
              {loadingCloned ? (
                <>
                  <View style={styles.clonedRow}>
                    <Skeleton width={52} height={52} borderRadius={26} />
                    <View style={styles.clonedInfo}>
                      <Skeleton
                        width={120}
                        height={16}
                        borderRadius={6}
                        style={{ marginBottom: 6 }}
                      />
                      <Skeleton width={80} height={12} borderRadius={6} />
                    </View>
                    <Skeleton width={51} height={31} borderRadius={16} />
                  </View>
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.outline, marginVertical: 16 },
                    ]}
                  />
                </>
              ) : (
                clonedVoice && (
                  <>
                    <View style={styles.clonedRow}>
                      {user?.tt_image && !avatarFailed ? (
                        <View style={styles.clonedAvatarWrap}>
                          <Image
                            source={{ uri: user.tt_image }}
                            style={styles.clonedAvatar}
                            onLoadEnd={() => setAvatarLoading(false)}
                            onError={() => {
                              setAvatarFailed(true);
                              setAvatarLoading(false);
                            }}
                          />
                          {avatarLoading && (
                            <View style={StyleSheet.absoluteFill}>
                              <Skeleton
                                width={52}
                                height={52}
                                borderRadius={26}
                              />
                            </View>
                          )}
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.clonedAvatar,
                            styles.clonedAvatarFallback,
                            { backgroundColor: theme.surface },
                          ]}
                        >
                          <Ionicons
                            name="person"
                            size={24}
                            color={theme.onSurfaceVariant}
                          />
                        </View>
                      )}
                      <View style={styles.clonedInfo}>
                        <Text
                          style={[
                            styles.clonedName,
                            { color: theme.onSurface },
                          ]}
                          numberOfLines={1}
                        >
                          {clonedVoice.name}
                        </Text>
                        <Text
                          style={[
                            styles.clonedLabel,
                            { color: theme.onSurfaceVariant },
                          ]}
                        >
                          Cloned voice
                        </Text>
                      </View>
                      <Switch
                        value={useClonedVoice}
                        onValueChange={handleToggleClonedVoice}
                        disabled={switchingVoice}
                        trackColor={{
                          false: theme.outline,
                          true: theme.primary,
                        }}
                        thumbColor="#fff"
                      />
                    </View>
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: theme.outline, marginVertical: 16 },
                      ]}
                    />
                  </>
                )
              )}

              <View style={styles.cloneHeader}>
                <View style={styles.cloneIcon}>
                  <Ionicons
                    name="mic-circle-outline"
                    size={26}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cloneTitle, { color: theme.onSurface }]}>
                    {clonedVoice ? "Clone a New Voice" : "Clone Your Voice"}
                  </Text>
                  <Text
                    style={[
                      styles.cloneSubtitle,
                      { color: theme.onSurfaceVariant },
                    ]}
                  >
                    {clonedVoice
                      ? "Recording a new sample will replace your current cloned voice."
                      : "Record a short sample and let AI speak in your own voice."}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => router.push("/voice-samples/new")}
                style={[
                  styles.recordButton,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Ionicons
                  name="radio-button-on"
                  size={16}
                  color={theme.buttonText}
                />
                <Text
                  style={[styles.recordButtonText, { color: theme.buttonText }]}
                >
                  {clonedVoice ? "Record New Sample" : "Record Voice Sample"}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.cloneHeader}>
                <View style={styles.cloneIcon}>
                  <Ionicons
                    name="mic-circle-outline"
                    size={26}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cloneTitle, { color: theme.onSurface }]}>
                    Clone Your Voice
                  </Text>
                  <Text
                    style={[
                      styles.cloneSubtitle,
                      { color: theme.onSurfaceVariant },
                    ]}
                  >
                    Record a short sample and let AI speak in your own voice.
                  </Text>
                </View>
              </View>
              <View style={styles.premiumBannerWrapper}>
                <PremiumBanner
                  title="Clone your own voice with Premium!"
                  onPress={() => router.push("/pricing")}
                />
              </View>
            </>
          )}
        </Animated.View>

        {/* Sound prefix */}
        <Animated.Text
          entering={FadeInUp.duration(450).delay(180)}
          style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
        >
          Sound Prefix
        </Animated.Text>
        <Animated.View
          entering={FadeInUp.duration(500).delay(220)}
          style={cardStyle}
        >
          <ToggleRow
            icon={
              <Ionicons
                name="text-outline"
                size={18}
                color={theme.onSurfaceVariant}
              />
            }
            label="Add Prefix Before Speech"
            subtitle="Announce who triggered the message"
            value={prefixEnabled}
            onValueChange={onPrefixEnabled}
          />

          {prefixEnabled && (
            <>
              <View
                style={[styles.divider, { backgroundColor: theme.outline }]}
              />
              <TextInput
                value={commentTemplate}
                onChangeText={onCommentTemplate}
                placeholder="{user} said {comment}"
                placeholderTextColor={theme.onSurfaceVariant}
                autoCapitalize="none"
                style={[
                  styles.prefixInput,
                  {
                    color: theme.onSurface,
                    borderColor: theme.outline,
                    backgroundColor: theme.surface,
                  },
                ]}
              />

              <Text
                style={[
                  styles.prefixPreview,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                Use <Text style={{ fontWeight: "700" }}>{"{user}"}</Text> for
                the username and{" "}
                <Text style={{ fontWeight: "700" }}>{"{comment}"}</Text> for the
                comment.
              </Text>
            </>
          )}
        </Animated.View>

        {/* Allowed users */}
        <Animated.Text
          entering={FadeInUp.duration(450).delay(260)}
          style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
        >
          Who Can Trigger Voice Replies
        </Animated.Text>
        <Animated.View
          entering={FadeInUp.duration(500).delay(300)}
          style={cardStyle}
        >
          <ToggleRow
            label="All Users"
            value={allowedUsers.allUsers}
            onValueChange={() => toggleAllowedUser("allUsers")}
            bold
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            label="Subscribers"
            value={allowedUsers.subscribers}
            onValueChange={() => toggleAllowedUser("subscribers")}
            disabled={allowedUsers.allUsers}
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            label="Moderators"
            value={allowedUsers.moderators}
            onValueChange={() => toggleAllowedUser("moderators")}
            disabled={allowedUsers.allUsers}
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            label="Team Members"
            value={allowedUsers.teamMembers}
            onValueChange={() => toggleAllowedUser("teamMembers")}
            disabled={allowedUsers.allUsers}
          />
        </Animated.View>

        {/* Restrict comments */}
        <Animated.Text
          entering={FadeInUp.duration(450).delay(340)}
          style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
        >
          Restrict Comments
        </Animated.Text>
        <Animated.View
          entering={FadeInUp.duration(500).delay(380)}
          style={cardStyle}
        >
          <Stepper
            label="Minimum Account Age"
            value={minAccountAgeDays}
            onChange={onMinAge}
            min={0}
            max={365}
            step={1}
            unit="d"
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            icon={
              <Ionicons
                name="ban-outline"
                size={18}
                color={theme.onSurfaceVariant}
              />
            }
            label="Blocked Words List"
            subtitle="Comments containing these are ignored"
            value={blockedWordsEnabled}
            onValueChange={onBlockedEnabled}
          />
          {blockedWordsEnabled && (
            <TextInput
              value={blockedWords}
              onChangeText={onBlockedWords}
              placeholder="word1, word2, word3"
              placeholderTextColor={theme.onSurfaceVariant}
              autoCapitalize="none"
              style={[
                styles.prefixInput,
                {
                  color: theme.onSurface,
                  borderColor: theme.outline,
                  backgroundColor: theme.surface,
                  marginTop: 4,
                },
              ]}
            />
          )}
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <Pressable
            onPress={() => router.push("/muted-users" as any)}
            style={styles.manageRow}
          >
            <Text style={[styles.manageRowText, { color: theme.onSurface }]}>
              Manage Muted Users
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.onSurfaceVariant}
            />
          </Pressable>
        </Animated.View>

        {/* Spam protection */}
        <Animated.Text
          entering={FadeInUp.duration(450).delay(420)}
          style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
        >
          Spam Protection
        </Animated.Text>
        <Animated.View
          entering={FadeInUp.duration(500).delay(460)}
          style={cardStyle}
        >
          <ToggleRow
            icon={
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={theme.onSurfaceVariant}
              />
            }
            label="Enable Spam Protection"
            value={spamProtection}
            onValueChange={onSpamProtection}
            bold
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <Stepper
            label="Cooldown Between Requests"
            value={cooldown}
            onChange={onCooldown}
            min={0}
            max={60}
            step={1}
            unit="s"
            disabled={!spamProtection}
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <Stepper
            label="Max Requests / Minute"
            value={maxPerMinute}
            onChange={onMaxPerMinute}
            min={1}
            max={60}
            step={1}
            disabled={!spamProtection}
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            label="Block Repeated Words"
            subtitle="Ignore identical requests sent back-to-back"
            value={blockRepeats}
            onValueChange={onBlockRepeats}
            disabled={!spamProtection}
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            icon={
              <Ionicons
                name="volume-mute-outline"
                size={18}
                color={theme.onSurfaceVariant}
              />
            }
            label="Auto-Mute Repeat Offenders"
            subtitle="Temporarily mute users who trip spam limits"
            value={autoMute}
            onValueChange={onAutoMute}
            disabled={!spamProtection}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  headerIcon: {
    position: "absolute",
    left: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 22,
  },
  cloneHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  cloneIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cloneTitle: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  cloneSubtitle: { fontSize: 12, lineHeight: 17 },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  recordButtonText: { fontSize: 13, fontWeight: "700" },
  premiumBannerWrapper: {},
  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  manageRowText: { fontSize: 13.5, fontWeight: "600" },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  prefixInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginTop: 12,
    marginBottom: 8,
  },
  prefixPreview: {
    fontSize: 11.5,
    fontStyle: "italic",
  },
  clonedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clonedAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  clonedAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  clonedInfo: { flex: 1 },
  clonedName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  clonedLabel: { fontSize: 12 },
  clonedLoading: { paddingVertical: 20, alignItems: "center" },
  clonedAvatarFallback: { alignItems: "center", justifyContent: "center" },
});
