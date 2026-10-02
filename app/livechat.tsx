import GamerTTSMascot from "@/components/common/Mascot";
import { useAppTheme } from "@/hooks/use-theme-color";
import { useUserStore } from "@/store/user.store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
    Layout,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

type MessageSender = "user" | "support";

type ChatMessage = {
  id: string;
  sender: MessageSender;
  text?: string;
  time: string;
  type?: "text" | "image";
  imageUri?: string;
  failed?: boolean;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "support",
    text: "Hey! 👋 How can I help you with EchoStream?",
    time: "6:12 PM",
  },
  {
    id: "2",
    sender: "user",
    text: "I'm having trouble setting up my voice.",
    time: "6:13 PM",
  },
  {
    id: "3",
    sender: "support",
    text: "Sure. Are you trying to use a regular TTS voice or your own cloned voice?",
    time: "6:13 PM",
  },
  {
    id: "4",
    sender: "user",
    text: "My own cloned voice.",
    time: "6:14 PM",
  },
  {
    id: "5",
    sender: "user",
    text: "I already recorded the sample.",
    time: "6:14 PM",
  },
  {
    id: "6",
    sender: "user",
    text: "But I'm not sure what to do next.",
    time: "6:14 PM",
  },
  {
    id: "7",
    sender: "support",
    text: "No problem. I can walk you through it step by step.",
    time: "6:15 PM",
  },
];

function formatCurrentTime() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HelpChatScreen() {
  const { theme, isDark } = useAppTheme();
  const router = useRouter();

  const user = useUserStore((state) => state.user);

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  const [input, setInput] = useState("");
  const [showRateLimitError, setShowRateLimitError] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const recentSendTimes = useRef<number[]>([]);

  const avatarUri = user?.tt_image;

  const sendMessage = () => {
    const text = input.trim();

    if (!text) return;

    const now = Date.now();

    recentSendTimes.current = recentSendTimes.current.filter(
      (timestamp) => now - timestamp < 5000,
    );

    if (recentSendTimes.current.length <= 5) {
      setShowRateLimitError(true);
      return;
    }

    recentSendTimes.current.push(now);

    setShowRateLimitError(false);

    const newMessage: ChatMessage = {
      id: `${now}`,
      sender: "user",
      text,
      time: formatCurrentTime(),
    };

    setMessages((current) => [...current, newMessage]);
    setInput("");

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const messageGroups = useMemo(() => {
    return messages.map((message, index) => {
      const previous = messages[index - 1];
      const next = messages[index + 1];

      const isSameAsPrevious =
        previous?.sender === message.sender && previous?.time === message.time;

      const isSameAsNext =
        next?.sender === message.sender && next?.time === message.time;

      return {
        message,
        isFirst: !isSameAsPrevious,
        isLast: !isSameAsNext,
      };
    });
  }, [messages]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Background */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
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

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {/* Back button */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backButton,
              {
                opacity: pressed ? 0.55 : 1,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={21} color={theme.onSurface} />
          </Pressable>
        </Animated.View>

        {/* Conversation */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            requestAnimationFrame(() => {
              scrollRef.current?.scrollToEnd({
                animated: false,
              });
            });
          }}
        >
          {messageGroups.map(({ message, isFirst, isLast }, index) => {
            const isUser = message.sender === "user";

            return (
              <Animated.View
                key={message.id}
                entering={FadeInUp.duration(350).delay(
                  Math.min(index * 35, 250),
                )}
                layout={Layout.springify()}
                style={[
                  styles.messageRow,
                  isUser ? styles.userMessageRow : styles.supportMessageRow,
                  {
                    marginTop: isFirst ? 14 : 3,
                  },
                ]}
              >
                {/* Support avatar */}
                {!isUser && isFirst ? (
                  <GamerTTSMascot height={34} width={34} />
                ) : !isUser ? (
                  <View style={styles.avatarSpacer} />
                ) : null}

                <View
                  style={[
                    styles.messageColumn,
                    isUser && styles.userMessageColumn,
                  ]}
                >
                  {message.type === "image" ? (
                    <View
                      style={[
                        styles.imageBubble,
                        {
                          backgroundColor: theme.surfaceVariant,
                          borderColor: message.failed
                            ? "#EF4444"
                            : "transparent",
                        },
                      ]}
                    >
                      {message.imageUri ? (
                        <Image
                          source={{ uri: message.imageUri }}
                          style={styles.messageImage}
                        />
                      ) : (
                        <View
                          style={[
                            styles.imagePlaceholder,
                            {
                              backgroundColor: `${theme.primary}10`,
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              message.failed
                                ? "alert-circle-outline"
                                : "image-outline"
                            }
                            size={28}
                            color={
                              message.failed
                                ? "#EF4444"
                                : theme.onSurfaceVariant
                            }
                          />
                        </View>
                      )}

                      {message.failed && (
                        <View style={styles.imageErrorRow}>
                          <Ionicons
                            name="alert-circle"
                            size={14}
                            color="#EF4444"
                          />

                          <Text
                            style={[
                              styles.imageErrorText,
                              {
                                color: "#EF4444",
                              },
                            ]}
                          >
                            Couldn't send image
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.messageBubble,
                        isUser ? styles.userBubble : styles.supportBubble,
                        {
                          backgroundColor: isUser
                            ? theme.primary
                            : theme.surfaceVariant,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          {
                            color: isUser ? theme.buttonText : theme.onSurface,
                          },
                        ]}
                      >
                        {message.text}
                      </Text>
                    </View>
                  )}

                  {/* Only show timestamp once for a group */}
                  {isLast && (
                    <Text
                      style={[
                        styles.timestamp,
                        isUser ? styles.userTimestamp : styles.supportTimestamp,
                        {
                          color: theme.onSurfaceVariant,
                        },
                      ]}
                    >
                      {message.time}
                    </Text>
                  )}
                </View>

                {/* User avatar */}
                {isUser && isFirst ? (
                  <View
                    style={[
                      styles.userAvatar,
                      {
                        backgroundColor: theme.surfaceVariant,
                      },
                    ]}
                  >
                    {avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={styles.userAvatarImage}
                      />
                    ) : (
                      <Ionicons
                        name="person"
                        size={18}
                        color={theme.onSurfaceVariant}
                      />
                    )}
                  </View>
                ) : isUser ? (
                  <View style={styles.avatarSpacer} />
                ) : null}
              </Animated.View>
            );
          })}

          {/* Rate limit error */}
          {showRateLimitError && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={[
                styles.errorContainer,
                {
                  backgroundColor: "#EF444412",
                  borderColor: "#EF444430",
                },
              ]}
            >
              <View
                style={[
                  styles.errorIcon,
                  {
                    backgroundColor: "#EF444420",
                  },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#EF4444"
                />
              </View>

              <View style={styles.errorContent}>
                <Text
                  style={[
                    styles.errorTitle,
                    {
                      color: theme.onSurface,
                    },
                  ]}
                >
                  You're sending messages too quickly
                </Text>

                <Text
                  style={[
                    styles.errorText,
                    {
                      color: theme.onSurfaceVariant,
                    },
                  ]}
                >
                  Please wait a moment before sending another message.
                </Text>
              </View>

              <Pressable
                onPress={() => setShowRateLimitError(false)}
                hitSlop={8}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={theme.onSurfaceVariant}
                />
              </Pressable>
            </Animated.View>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* Composer */}
        <View
          style={[
            styles.composerArea,
            {
              backgroundColor: "transparent",
            },
          ]}
        >
          <View
            style={[
              styles.composer,
              {
                backgroundColor: theme.surfaceVariant,
                borderColor: "transparent",
              },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={(value) => {
                setInput(value);

                if (showRateLimitError) {
                  setShowRateLimitError(false);
                }
              }}
              placeholder="Type your message..."
              placeholderTextColor={theme.onSurfaceVariant}
              multiline
              maxLength={2000}
              style={[
                styles.input,
                {
                  color: theme.onSurface,
                },
              ]}
              textAlignVertical="center"
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={sendMessage}
            />

            <Pressable
              onPress={sendMessage}
              disabled={!input.trim()}
              hitSlop={8}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: input.trim()
                    ? theme.primary
                    : `${theme.primary}35`,
                  transform: [
                    {
                      scale: pressed && input.trim() ? 0.9 : 1,
                    },
                  ],
                },
              ]}
            >
              <Ionicons
                name="send"
                size={17}
                color={input.trim() ? theme.buttonText : theme.onSurfaceVariant}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardContainer: {
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

  bottomAmbientGlow: {
    position: "absolute",
    bottom: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.35,
    borderRadius: width,
  },

  header: {
    paddingHorizontal: 4,
    paddingTop: 10,
    height: 62,
    justifyContent: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  messagesScroll: {
    flex: 1,
  },

  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },

  messageRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
  },

  userMessageRow: {
    justifyContent: "flex-end",
  },

  supportMessageRow: {
    justifyContent: "flex-start",
  },

  messageColumn: {
    maxWidth: "78%",
  },

  userMessageColumn: {
    alignItems: "flex-end",
  },

  messageBubble: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 20,
    minHeight: 42,
  },

  userBubble: {
    borderBottomRightRadius: 6,
  },

  supportBubble: {
    borderBottomLeftRadius: 6,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "400",
  },

  timestamp: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 5,
  },

  userTimestamp: {
    textAlign: "right",
    marginRight: 3,
  },

  supportTimestamp: {
    marginLeft: 3,
  },

  supportAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 8,
  },

  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  userAvatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarSpacer: {
    width: 42,
  },

  imageBubble: {
    borderRadius: 18,
    padding: 5,
    borderWidth: 1,
    overflow: "hidden",
  },

  messageImage: {
    width: 190,
    height: 190,
    borderRadius: 14,
  },

  imagePlaceholder: {
    width: 190,
    height: 140,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  imageErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 7,
    paddingTop: 7,
    paddingBottom: 3,
  },

  imageErrorText: {
    fontSize: 11,
    fontWeight: "600",
  },

  errorContainer: {
    marginTop: 18,
    marginHorizontal: 2,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  errorIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  errorContent: {
    flex: 1,
    marginRight: 8,
  },

  errorTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },

  errorText: {
    fontSize: 11,
    lineHeight: 16,
  },

  bottomSpace: {
    height: 10,
  },

  composerArea: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 8 : 10,
  },

  composer: {
    minHeight: 54,
    maxHeight: 130,
    borderRadius: 28,
    paddingLeft: 17,
    paddingRight: 7,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "flex-end",
  },

  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    maxHeight: 112,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 8,
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
});
