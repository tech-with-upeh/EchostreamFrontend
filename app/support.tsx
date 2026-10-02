import GamerTTSMascot from "@/components/common/Mascot";
import { useAppTheme } from "@/hooks/use-theme-color";
import { useUserStore } from "@/store/user.store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

type ChatStatus = "active" | "closed" | "waiting";

type Chat = {
  id: string;
  title: string;
  status: ChatStatus;
  date: string;
};

const MOCK_CHATS: Chat[] = [
  {
    id: "1",
    title: "Enquiry for Live Runtime",
    status: "active",
    date: "Today",
  },
  {
    id: "2",
    title: "Deleted Preferences",
    status: "closed",
    date: "Sep 28, 2026",
  },
  {
    id: "3",
    title: "Voice cloning question",
    status: "closed",
    date: "Sep 21, 2026",
  },
];

function getStatusConfig(status: ChatStatus) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        color: "#22C55E",
      };

    case "waiting":
      return {
        label: "Waiting",
        color: "#F59E0B",
      };

    case "closed":
    default:
      return {
        label: "Closed",
        color: "#8B8B96",
      };
  }
}

export default function HelpCenterChatsScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const user = useUserStore((state) => state.user);

  /*
   * UI-only for now.
   *
   * When the backend is connected, replace this with the user's
   * actual support conversations.
   */
  const chats = useMemo(() => MOCK_CHATS, []);

  const hasChats = chats.length > 0;

  const openNewChat = () => {
    router.push("/livechat");
  };

  const openChat = (chat: Chat) => {
    router.push({
      pathname: "/livechat",
      params: {
        chatId: chat.id,
      },
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Ambient background */}
      <LinearGradient
        pointerEvents="none"
        colors={[`${theme.primary}10`, "transparent", "transparent"]}
        style={styles.topAmbientGlow}
      />

      <LinearGradient
        pointerEvents="none"
        colors={["transparent", `${theme.primary}08`]}
        style={styles.bottomAmbientGlow}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Back button */}
        <Animated.View entering={FadeInUp.duration(450)}>
          <View style={styles.backButtonContainer}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={({ pressed }) => [
                styles.backButton,
                {
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="chevron-back" size={21} color={theme.onSurface} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={styles.heroHeader}>
            <View style={styles.heroText}>
              <Text
                style={[
                  styles.heroTitle,
                  {
                    color: theme.onSurface,
                  },
                ]}
              >
                Hi there,
              </Text>

              <Text
                style={[
                  styles.heroSubtitle,
                  {
                    color: theme.onSurfaceVariant,
                  },
                ]}
              >
                How can we help?
              </Text>
            </View>

            <View style={styles.mascotContainer}>
              <GamerTTSMascot width={78} height={78} />
            </View>
          </View>
        </Animated.View>

        {/* New message CTA */}
        <Animated.View entering={FadeInUp.duration(500).delay(180)}>
          <View>
            <Pressable
              onPress={openNewChat}
              style={({ pressed }) => [
                styles.newMessageButton,
                {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                  transform: [
                    {
                      scale: pressed ? 0.985 : 1,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.newMessageIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={21}
                  color={theme.surface}
                />
              </View>

              <View style={styles.newMessageContent}>
                <Text
                  style={[
                    styles.newMessageTitle,
                    {
                      color: theme.buttonText,
                    },
                  ]}
                >
                  Send a new message
                </Text>

                <Text
                  style={[
                    styles.newMessageSubtitle,
                    {
                      color: `${theme.buttonText}B8`,
                    },
                  ]}
                >
                  Start a conversation with support
                </Text>
              </View>

              <Ionicons
                name="arrow-forward"
                size={21}
                color={theme.buttonText}
              />
            </Pressable>
          </View>
        </Animated.View>

        {/* Chats */}
        <Animated.View entering={FadeInUp.duration(500).delay(260)}>
          <View style={styles.chatsSection}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.onSurface,
                  },
                ]}
              >
                Chats
              </Text>

              {hasChats && (
                <Text
                  style={[
                    styles.chatCount,
                    {
                      color: theme.onSurfaceVariant,
                    },
                  ]}
                >
                  {chats.length}
                </Text>
              )}
            </View>

            {hasChats ? (
              <View style={styles.chatList}>
                {chats.map((chat, index) => {
                  const status = getStatusConfig(chat.status);

                  return (
                    <Animated.View
                      key={chat.id}
                      entering={FadeInUp.duration(400).delay(320 + index * 70)}
                    >
                      <View>
                        <Pressable
                          onPress={() => openChat(chat)}
                          style={({ pressed }) => [
                            styles.chatCard,
                            {
                              backgroundColor: theme.surfaceVariant,
                              borderColor: `${theme.onSurface}08`,
                              opacity: pressed ? 0.75 : 1,
                            },
                          ]}
                        >
                          <View style={styles.chatCardContent}>
                            {/* Chat title + status */}
                            <View style={styles.chatTopRow}>
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.chatTitle,
                                  {
                                    color: theme.onSurface,
                                  },
                                ]}
                              >
                                {chat.title}
                              </Text>

                              <View
                                style={[
                                  styles.statusPill,
                                  {
                                    backgroundColor: `${status.color}14`,
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.statusDot,
                                    {
                                      backgroundColor: status.color,
                                    },
                                  ]}
                                />

                                <Text
                                  style={[
                                    styles.statusText,
                                    {
                                      color: status.color,
                                    },
                                  ]}
                                >
                                  {status.label}
                                </Text>
                              </View>
                            </View>

                            {/* Date */}
                            <Text
                              style={[
                                styles.chatDate,
                                {
                                  color: theme.onSurfaceVariant,
                                },
                              ]}
                            >
                              {chat.date}
                            </Text>
                          </View>

                          <View style={styles.chatChevron}>
                            <Ionicons
                              name="chevron-forward"
                              size={19}
                              color={theme.onSurfaceVariant}
                            />
                          </View>
                        </Pressable>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            ) : (
              /* Empty state */
              <Animated.View entering={FadeInUp.duration(500).delay(320)}>
                <View
                  style={[
                    styles.emptyState,
                    {
                      backgroundColor: theme.surfaceVariant,
                      borderColor: `${theme.onSurface}08`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.emptyIconContainer,
                      {
                        backgroundColor: `${theme.primary}12`,
                      },
                    ]}
                  >
                    <Ionicons
                      name="chatbubbles-outline"
                      size={31}
                      color={theme.primary}
                    />
                  </View>

                  <Text
                    style={[
                      styles.emptyTitle,
                      {
                        color: theme.onSurface,
                      },
                    ]}
                  >
                    No conversations yet
                  </Text>

                  <Text
                    style={[
                      styles.emptyDescription,
                      {
                        color: theme.onSurfaceVariant,
                      },
                    ]}
                  >
                    When you contact EchoStream support, your conversations will
                    appear here.
                  </Text>

                  <Pressable
                    onPress={openNewChat}
                    style={({ pressed }) => [
                      styles.emptyAction,
                      {
                        borderColor: theme.primary,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="add" size={18} color={theme.primary} />

                    <Text
                      style={[
                        styles.emptyActionText,
                        {
                          color: theme.primary,
                        },
                      ]}
                    >
                      Start a conversation
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topAmbientGlow: {
    position: "absolute",
    top: -70,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.42,
    borderRadius: width,
  },

  bottomAmbientGlow: {
    position: "absolute",
    bottom: -80,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.35,
    borderRadius: width,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  backButtonContainer: {
    marginBottom: 26,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  heroHeader: {
    minHeight: 94,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  heroText: {
    flex: 1,
    paddingRight: 12,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
    lineHeight: 34,
  },

  heroSubtitle: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.4,
    marginTop: 2,
  },

  mascotContainer: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
  },

  newMessageButton: {
    minHeight: 76,
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },

  newMessageIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  newMessageContent: {
    flex: 1,
  },

  newMessageTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  newMessageSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 3,
  },

  chatsSection: {
    marginTop: 32,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  chatCount: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
    opacity: 0.75,
  },

  chatList: {
    gap: 10,
  },

  chatCard: {
    minHeight: 82,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  chatCardContent: {
    flex: 1,
    minWidth: 0,
  },

  chatTopRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    marginBottom: 8,
  },

  chatTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    marginRight: 10,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  chatDate: {
    fontSize: 12,
    fontWeight: "500",
  },

  chatChevron: {
    width: 28,
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 8,
  },

  emptyState: {
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 270,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 300,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
  },

  emptyAction: {
    marginTop: 20,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyActionText: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },

  bottomSpace: {
    height: 30,
  },
});
