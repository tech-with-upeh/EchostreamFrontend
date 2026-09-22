import BottomSheet from "@/components/common/bottomSheet";
import PremiumBanner from "@/components/common/Premiumbanner";
import { Skeleton } from "@/components/common/Skeleton";
import ToggleRow from "@/components/common/ToggleRow";
import SearchBar from "@/components/voices/SearchBar";
import { useAppTheme } from "@/hooks/use-theme-color";
import { updatePreferences } from "@/lib/api";
import type {
  EventAlertConfig,
  Gift,
  PreferenceEvents,
  Preferences,
} from "@/lib/schema";
import { reportError } from "@/store/error.store";
import { useGiftsStore } from "@/store/gift.store";
import { useGiftPreferencesStore } from "@/store/giftpref.store";
import { usePreferencesStore } from "@/store/preference.store";
import { useUserStore } from "@/store/user.store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const FREE_ALERT_LIMIT = 3;

const GIFT_KEY_PREFIX = "gift-";

const BASE_ALERT_ORDER = ["like", "follow", "gift"] as const;

type BaseAlertKey = (typeof BASE_ALERT_ORDER)[number];

const BASE_ALERT_DISPLAY: Record<
  BaseAlertKey,
  { emoji: string; label: string }
> = {
  like: {
    emoji: "❤️",
    label: "Likes",
  },
  follow: {
    emoji: "➕",
    label: "New Followers",
  },
  gift: {
    emoji: "🎁",
    label: "Any Gift",
  },
};

// Default payload the server expects when a gift alert is created for
// the first time from the picker. `voice`/`tts_provider` mirror the
// edge-tts defaults used elsewhere in the app.
//
// Note: this is the shape of a single gift alert (EventAlertConfig),
// not `GiftsPreference` (which is EventAlertConfig[]) — the PUT
// endpoint saves one gift's config at a time, keyed by :id.
const DEFAULT_GIFT_ALERT_PAYLOAD: Partial<EventAlertConfig> = {
  enabled: true,
  alert_type: "tts",
  tts_template: "{{user}} sent {{event}}",
  tts_provider: "edge",
  voice: "",
};

function isBaseAlertKey(key: string): key is BaseAlertKey {
  return (BASE_ALERT_ORDER as readonly string[]).includes(key);
}

function giftAlertKey(giftId: string) {
  return `${GIFT_KEY_PREFIX}${giftId}`;
}

function createDefaultAlertConfig(
  key: string,
  overrides: Partial<EventAlertConfig> = {},
): EventAlertConfig {
  const event_type = isBaseAlertKey(key) ? key : "gift";

  const gift_id = key.startsWith(GIFT_KEY_PREFIX)
    ? key.slice(GIFT_KEY_PREFIX.length)
    : null;

  return {
    id: key,
    event_type,
    gift_id,
    enabled: false,
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
    ...overrides,
  } as EventAlertConfig;
}

export default function TtsGiftTab() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const user = useUserStore((state) => state.user);

  const preferences = usePreferencesStore((state) => state.preferences);

  const fetchPreferences = usePreferencesStore(
    (state) => state.fetchPreferences,
  );

  // ------------------------------------------------------------
  // Gift catalog
  // ------------------------------------------------------------

  const gifts = useGiftsStore((state: { gifts: any }) => state.gifts);
  const giftsLoading = useGiftsStore(
    (state: { isLoading: any }) => state.isLoading,
  );
  const fetchGifts = useGiftsStore(
    (state: { fetchGifts: any }) => state.fetchGifts,
  );

  const availableGifts = gifts ?? [];

  // ------------------------------------------------------------
  // Gift-specific preferences
  // ------------------------------------------------------------

  const giftPreferences = useGiftPreferencesStore((state) => state.giftspref);

  const giftPreferencesLoading = useGiftPreferencesStore(
    (state) => state.isLoading,
  );

  const fetchGiftPreferences = useGiftPreferencesStore(
    (state) => state.fetchGiftspref,
  );

  const putGiftPreference = useGiftPreferencesStore(
    (state) => state.putGiftspref,
  );

  const deleteGiftPreference = useGiftPreferencesStore(
    (state) => state.deleteGiftspref,
  );

  // ------------------------------------------------------------
  // General state
  // ------------------------------------------------------------

  const isStarter = user?.plan === "starter";

  const premiumLocked = isStarter;

  const [queueAlerts, setQueueAlerts] = useState(true);

  const [alerts, setAlerts] = useState<PreferenceEvents>({});

  const [alertQuery, setAlertQuery] = useState("");

  const [giftQuery, setGiftQuery] = useState("");

  const [pendingGiftKey, setPendingGiftKey] = useState<string | null>(null);

  const [giftSheetVisible, setGiftSheetVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  // ------------------------------------------------------------
  // Queued preference saving (base alerts: like/follow/any-gift,
  // plus toggling the enabled state of an already-added gift)
  // ------------------------------------------------------------

  const pendingEventsRef = React.useRef<PreferenceEvents | null>(null);

  const saveChainRef = React.useRef<Promise<void>>(Promise.resolve());

  const flushEvents = useCallback(() => {
    const nextEvents = pendingEventsRef.current;

    if (nextEvents === null) {
      return;
    }

    pendingEventsRef.current = null;

    saveChainRef.current = saveChainRef.current.then(async () => {
      const store = usePreferencesStore.getState();

      const current = store.preferences;

      if (!current) {
        return;
      }

      const next: Preferences = {
        ...current,
        events: nextEvents,
      };

      store.setPreferences(next);

      try {
        const saved = await updatePreferences(next);

        if (pendingEventsRef.current === null) {
          usePreferencesStore.getState().setPreferences(saved);
        }
      } catch (error) {
        reportError("Failed to save sound alert changes: " + error);

        try {
          await usePreferencesStore.getState().fetchPreferences(true);
        } catch (refreshError) {
          reportError(
            "Failed to restore sound alert preferences: " + refreshError,
          );
        }
      }
    });
  }, []);

  const saveEvents = useCallback(
    (next: PreferenceEvents) => {
      setAlerts(next);

      pendingEventsRef.current = next;

      flushEvents();
    },
    [flushEvents],
  );

  useEffect(() => {
    return () => {
      flushEvents();
    };
  }, [flushEvents]);

  // ------------------------------------------------------------
  // Load general preferences
  // ------------------------------------------------------------

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchPreferences().catch((error: any) => {
      reportError("Failed to load preferences: " + error);
    });
  }, [user, fetchPreferences]);

  // ------------------------------------------------------------
  // Load gift catalog + gift-specific preferences
  // ------------------------------------------------------------

  useEffect(() => {
    fetchGifts().catch((error: any) => {
      reportError("Failed to load gifts: " + error);
    });

    fetchGiftPreferences().catch((error: any) => {
      reportError("Failed to load gift preferences: " + error);
    });
  }, [fetchGifts, fetchGiftPreferences]);

  // ------------------------------------------------------------
  // Pull-to-refresh: re-pull everything this tab depends on.
  // ------------------------------------------------------------

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchPreferences(true),
        fetchGifts(true),
        fetchGiftPreferences(true),
      ]);
    } catch (error) {
      reportError("Failed to refresh sound alerts: " + error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPreferences, fetchGifts, fetchGiftPreferences]);

  // ------------------------------------------------------------
  // Merge:
  //
  // preferences.events
  // +
  // individual gift preferences
  //
  // into one PreferenceEvents object for the UI.
  // ------------------------------------------------------------

  useEffect(() => {
    if (!preferences) {
      return;
    }

    if (pendingEventsRef.current !== null) {
      return;
    }

    const events: PreferenceEvents = {
      ...(preferences.events ?? {}),
    };

    if (Array.isArray(giftPreferences)) {
      for (const giftPreference of giftPreferences) {
        if (!giftPreference.gift_id) {
          continue;
        }

        const key = giftAlertKey(giftPreference.gift_id);

        events[key] = {
          ...createDefaultAlertConfig(key),
          ...giftPreference,
          id: key,
          event_type: "gift",
          gift_id: giftPreference.gift_id,
        };
      }
    }

    setAlerts(events);
  }, [preferences, giftPreferences]);

  // ------------------------------------------------------------
  // Gift display helper
  // ------------------------------------------------------------

  const getAlertDisplay = useCallback(
    (
      key: string,
    ): {
      emoji: string;
      label: string;
      imageUrl?: string;
    } => {
      if (isBaseAlertKey(key)) {
        return {
          ...BASE_ALERT_DISPLAY[key],
        };
      }

      if (key.startsWith(GIFT_KEY_PREFIX)) {
        const giftId = key.slice(GIFT_KEY_PREFIX.length);
        const gift = availableGifts.find((item: any) => item.id === giftId);

        if (gift) {
          return {
            emoji: "🎁",
            label: `${gift.name} (${gift.diamond_count} Diamonds)`,
            imageUrl: gift.image_url,
          };
        }

        return {
          emoji: "🎁",
          label: `Gift ${giftId}`,
        };
      }

      return {
        emoji: "🔔",
        label: key,
      };
    },
    [availableGifts],
  );

  // ------------------------------------------------------------
  // Alert list
  // ------------------------------------------------------------

  const customGiftKeys = useMemo(
    () => Object.keys(alerts).filter((key) => !isBaseAlertKey(key)),
    [alerts],
  );

  const atFreeAlertLimit =
    premiumLocked && customGiftKeys.length >= FREE_ALERT_LIMIT;

  const allKeys = useMemo(
    () => [...BASE_ALERT_ORDER, ...customGiftKeys],
    [customGiftKeys],
  );

  const filteredKeys = useMemo(() => {
    const query = alertQuery.trim().toLowerCase();

    if (!query) {
      return allKeys;
    }

    return allKeys.filter((key) =>
      getAlertDisplay(key).label.toLowerCase().includes(query),
    );
  }, [allKeys, alertQuery, getAlertDisplay]);

  // ------------------------------------------------------------
  // Gift data readiness (drives the shimmer)
  //
  // A gift row depends on two async sources: the gift catalog
  // (name, image, diamond count) and the saved gift preferences
  // (which gifts even have alerts). Until BOTH have resolved at
  // least once, don't paint a gift row at all — show a skeleton
  // instead of the "Gift {id}" fallback flashing into the real
  // name/image a moment later.
  // ------------------------------------------------------------

  const giftCatalogReady = !giftsLoading || availableGifts.length > 0;

  const giftPrefsReady = !giftPreferencesLoading;

  const giftDataReady = giftCatalogReady && giftPrefsReady;

  // ------------------------------------------------------------
  // Toggle alert (base alerts, and flipping enabled on an
  // already-added gift alert)
  // ------------------------------------------------------------

  const toggleAlert = useCallback(
    (key: string) => {
      const current = alerts[key] ?? createDefaultAlertConfig(key);
      const nextEnabled = !current.enabled;

      // Gift alerts live on the gift-preferences endpoint, not in
      // preferences.events. Switching off removes the alert entirely
      // (DELETE) rather than PUTting { enabled: false } — a disabled
      // gift alert isn't kept around server-side. Switching back on
      // recreates it with the full default payload, since there's
      // nothing partial left to update.
      if (!isBaseAlertKey(key)) {
        const giftId = current.gift_id ?? key.slice(GIFT_KEY_PREFIX.length);

        if (!nextEnabled) {
          setAlerts((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });

          deleteGiftPreference(giftId).catch((error: any) => {
            reportError("Failed to remove gift alert: " + error);

            // Save failed — put the row back as it was.
            setAlerts((prev) => ({
              ...prev,
              [key]: current,
            }));
          });

          return;
        }

        setAlerts((prev) => ({
          ...prev,
          [key]: { ...current, enabled: true },
        }));

        putGiftPreference(DEFAULT_GIFT_ALERT_PAYLOAD, giftId).catch((error) => {
          reportError("Failed to update gift alert: " + error);

          setAlerts((prev) => ({
            ...prev,
            [key]: { ...current, enabled: false },
          }));
        });

        return;
      }

      saveEvents({
        ...alerts,
        [key]: {
          ...current,
          enabled: nextEnabled,
        },
      });
    },
    [alerts, saveEvents, putGiftPreference, deleteGiftPreference],
  );

  // ------------------------------------------------------------
  // Queue alerts
  // ------------------------------------------------------------

  const toggleQueueAlerts = useCallback(
    (value: boolean) => {
      if (premiumLocked) {
        router.push("/pricing");
        return;
      }

      setQueueAlerts(value);
    },
    [premiumLocked, router],
  );

  // ------------------------------------------------------------
  // Gift picker
  // ------------------------------------------------------------

  const isGiftAdded = useCallback(
    (giftId: string) => !!alerts[giftAlertKey(giftId)],
    [alerts],
  );

  const filteredGifts = useMemo(() => {
    const query = giftQuery.trim().toLowerCase();

    if (!query) {
      return availableGifts;
    }

    return availableGifts.filter((gift: any) =>
      gift.name.toLowerCase().includes(query),
    );
  }, [availableGifts, giftQuery]);

  const closeGiftPicker = useCallback(() => {
    setGiftSheetVisible(false);
    setGiftQuery("");
  }, []);

  const openGiftPicker = useCallback(() => {
    if (atFreeAlertLimit) {
      router.push("/pricing");
      return;
    }

    setGiftQuery("");
    setGiftSheetVisible(true);
  }, [atFreeAlertLimit, router]);

  // Tapping a gift row: close the sheet right away and drop an
  // optimistic row into the main list (with a spinner in place of the
  // switch) rather than making the person wait on the sheet for the
  // save to land. If the save fails and this was a brand-new gift
  // (not just re-saving one that was already added), the optimistic
  // row is rolled back.
  const handleGiftPress = useCallback(
    async (gift: Gift) => {
      if (pendingGiftKey) {
        return;
      }

      const key = giftAlertKey(gift.id);
      const wasAlreadyAdded = !!alerts[key];

      if (atFreeAlertLimit && !wasAlreadyAdded) {
        router.push("/pricing");
        return;
      }

      closeGiftPicker();

      setPendingGiftKey(key);

      setAlerts((prev) => ({
        ...prev,
        [key]: createDefaultAlertConfig(key, DEFAULT_GIFT_ALERT_PAYLOAD),
      }));

      try {
        await putGiftPreference(DEFAULT_GIFT_ALERT_PAYLOAD, gift.id);
      } catch (error) {
        reportError("Failed to add gift alert: " + error);

        if (!wasAlreadyAdded) {
          setAlerts((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }
      } finally {
        setPendingGiftKey(null);
      }
    },
    [
      pendingGiftKey,
      alerts,
      atFreeAlertLimit,
      router,
      closeGiftPicker,
      putGiftPreference,
    ],
  );

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <View style={styles.searchWrapper}>
          <SearchBar
            value={alertQuery}
            onChangeText={setAlertQuery}
            placeholder="Search alerts…"
          />
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.outline,
              marginBottom: 14,
            },
          ]}
        >
          <ToggleRow
            label="Queue Sound Alerts (by event)"
            value={queueAlerts}
            onValueChange={toggleQueueAlerts}
            isPremium={premiumLocked}
            disabled={premiumLocked}
            bold
          />
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
          {filteredKeys.map((key, index) => {
            const isLastRow = index < filteredKeys.length - 1;
            const isGiftKey = !isBaseAlertKey(key);

            // This gift's add/save is in flight: show it in place
            // already, with a spinner where the switch normally sits,
            // no chevron, and no press handling.
            if (isGiftKey && key === pendingGiftKey) {
              const display = getAlertDisplay(key);

              return (
                <React.Fragment key={key}>
                  <View style={styles.alertRowPending}>
                    {display.imageUrl ? (
                      <Image
                        source={{ uri: display.imageUrl }}
                        style={styles.alertGiftIcon}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.alertEmoji}>{display.emoji}</Text>
                    )}

                    <Text
                      style={[
                        styles.alertPendingLabel,
                        { color: theme.onSurface },
                      ]}
                      numberOfLines={1}
                    >
                      {display.label}
                    </Text>

                    <View style={{ flex: 1 }} />

                    <ActivityIndicator size="small" color={theme.primary} />
                  </View>

                  {isLastRow && (
                    <View
                      style={[
                        styles.rowDivider,
                        { backgroundColor: theme.outline },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            }

            // Gift rows wait for both the gift catalog and gift
            // preferences to resolve, so we never flash the
            // "Gift {id}" fallback or a partial name/count.
            if (isGiftKey && !giftDataReady) {
              return (
                <React.Fragment key={key}>
                  <View style={styles.alertRowSkeleton}>
                    <Skeleton width={28} height={28} borderRadius={14} />
                    <Skeleton width={150} height={15} borderRadius={4} />
                    <View style={{ flex: 1 }} />
                    <Skeleton width={40} height={22} borderRadius={11} />
                  </View>

                  {isLastRow && (
                    <View
                      style={[
                        styles.rowDivider,
                        { backgroundColor: theme.outline },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            }

            const display = getAlertDisplay(key);

            const enabled = alerts[key]?.enabled ?? false;

            return (
              <React.Fragment key={key}>
                <ToggleRow
                  icon={
                    display.imageUrl ? (
                      <Image
                        source={{ uri: display.imageUrl }}
                        style={styles.alertGiftIcon}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.alertEmoji}>{display.emoji}</Text>
                    )
                  }
                  label={display.label}
                  value={enabled}
                  onValueChange={() => toggleAlert(key)}
                  onPress={() => router.push(`/sound-alert/${key}` as any)}
                  showChevron
                />

                {isLastRow && (
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

          <View
            style={[
              styles.rowDivider,
              {
                backgroundColor: theme.outline,
              },
            ]}
          />

          {atFreeAlertLimit && (
            <PremiumBanner
              title={`You've reached the ${FREE_ALERT_LIMIT}-alert limit. Upgrade for unlimited sound alerts!`}
              onPress={() => router.push("/pricing")}
            />
          )}

          <Pressable style={styles.addAlertButton} onPress={openGiftPicker}>
            <Ionicons
              name="add-circle-outline"
              size={18}
              color={theme.primaryDim}
            />

            <Text
              style={[
                styles.addAlertText,
                {
                  color: theme.primaryDim,
                },
              ]}
            >
              Add new Sound Alert
            </Text>

            {atFreeAlertLimit && (
              <MaterialCommunityIcons name="crown" size={13} color="#f39b31" />
            )}
          </Pressable>
        </View>
      </ScrollView>

      <BottomSheet
        visible={giftSheetVisible}
        title="Select a TikTok gift"
        icon="gift-outline"
        onClose={closeGiftPicker}
        maxHeight={0.92}
      >
        <View style={styles.pickerHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.pickerTitle,
                {
                  color: theme.onSurface,
                },
              ]}
            >
              Select a TikTok gift
            </Text>

            <Text
              style={[
                styles.pickerSub,
                {
                  color: theme.onSurfaceVariant,
                },
              ]}
            >
              Choose a gift instead of typing its name or emoji.
            </Text>
          </View>
        </View>

        <View style={styles.pickerSearchWrapper}>
          <SearchBar
            value={giftQuery}
            onChangeText={setGiftQuery}
            placeholder="Search gifts…"
          />
        </View>

        <View style={styles.giftList}>
          {giftsLoading && availableGifts.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />

              <Text
                style={[
                  styles.loadingText,
                  {
                    color: theme.onSurfaceVariant,
                  },
                ]}
              >
                Loading gifts…
              </Text>
            </View>
          ) : filteredGifts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="gift-outline"
                size={28}
                color={theme.onSurfaceVariant}
              />

              <Text
                style={[
                  styles.emptyText,
                  {
                    color: theme.onSurfaceVariant,
                  },
                ]}
              >
                {giftQuery.trim() ? "No gifts found" : "No gifts available"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredGifts}
              keyExtractor={(gift) => gift.id}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={7}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews
              contentContainerStyle={styles.giftListContent}
              getItemLayout={(_, index) => ({
                length: 66,
                offset: 66 * index,
                index,
              })}
              renderItem={({ item: gift }) => {
                const added = isGiftAdded(gift.id);

                return (
                  <Pressable
                    onPress={() => handleGiftPress(gift)}
                    style={[
                      styles.giftRow,
                      {
                        borderColor: added ? theme.primary : theme.outline,
                        backgroundColor: added ? theme.surface : "transparent",
                      },
                    ]}
                  >
                    <View style={styles.giftImageWrapper}>
                      <Image
                        source={{
                          uri: gift.image_url,
                        }}
                        style={styles.giftImage}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.giftName,
                          {
                            color: theme.onSurface,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {gift.name}
                      </Text>

                      <Text
                        style={[
                          styles.giftMeta,
                          {
                            color: theme.onSurfaceVariant,
                          },
                        ]}
                      >
                        {gift.diamond_count} Diamonds
                      </Text>
                    </View>

                    {added ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.primary}
                      />
                    ) : (
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color={theme.onSurfaceVariant}
                      />
                    )}
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 22,
  },

  rowDivider: {
    height: StyleSheet.hairlineWidth,
  },

  searchWrapper: {
    marginBottom: 14,
  },

  alertEmoji: {
    fontSize: 17,
  },

  alertGiftIcon: {
    width: 22,
    height: 22,
  },

  alertRowSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },

  alertRowPending: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },

  alertPendingLabel: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },

  addAlertButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },

  addAlertText: {
    fontSize: 13,
    fontWeight: "700",
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

  giftList: {
    flex: 1,
    paddingHorizontal: 20,
  },

  giftListContent: {
    paddingBottom: 24,
  },

  giftRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  giftImageWrapper: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  giftImage: {
    width: 38,
    height: 38,
  },

  giftName: {
    fontSize: 13,
    fontWeight: "700",
  },

  giftMeta: {
    fontSize: 11,
    marginTop: 2,
  },

  loadingContainer: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  loadingText: {
    fontSize: 12,
  },

  emptyContainer: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  emptyText: {
    fontSize: 12,
  },
});
