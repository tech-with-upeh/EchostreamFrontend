import GamerTTSMascot from "@/components/common/Mascot";
import { useAppTheme } from "@/hooks/use-theme-color";
import {
  createHelpConversation,
  getHelpConversation,
  sendHelpMessage,
  ApiError,
} from "@/lib/api";
import type { HelpMessage } from "@/lib/schema";
import { useUserStore } from "@/store/user.store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HelpChatScreen() {
  const { theme, isDark } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ chatId?: string }>();
  const user = useUserStore((state) => state.user);
  const scrollRef = useRef<ScrollView>(null);

  const [conversationId, setConversationId] = useState<string | null>(
    params.chatId ?? null,
  );
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [needsHumanSupport, setNeedsHumanSupport] = useState(false);

  const loadConversation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (params.chatId) {
        const conversation = await getHelpConversation(params.chatId);
        setConversationId(conversation.id);
        setMessages(conversation.messages.filter((m) => m.role !== "system"));
      } else {
        const conversation = await createHelpConversation();
        setConversationId(conversation.id);
        setMessages([]);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to open the help assistant.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.chatId]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages, sending]);

  const sendMessage = async () => {
    const content = input.trim();

    if (!content || !conversationId || loading || sending) return;

    setInput("");
    setError(null);
    setRateLimited(false);
    setSending(true);

    try {
      const result = await sendHelpMessage(conversationId, content);

      setMessages((current) => [
        ...current,
        result.user_message,
        result.assistant_message,
      ]);

      setNeedsHumanSupport(result.needs_human_support);
    } catch (err) {
      setInput(content);

      if (err instanceof ApiError && err.status === 429) {
        setRateLimited(true);
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to send your message. Please try again.",
        );
      }
    } finally {
      setSending(false);
    }
  };

  const avatarUri = user?.tt_image;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <LinearGradient
        pointerEvents="none"
        colors={theme.bgGradient}
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        pointerEvents="none"
        colors={[theme.topGlow, "transparent"]}
        style={styles.topGlow}
      />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={21} color={theme.onSurface} />
        </Pressable>

        <GamerTTSMascot width={38} height={38} />

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
            EchoStream Assistant
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.onSurfaceVariant },
            ]}
          >
            AI Help Center
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={theme.primary} />
              <Text
                style={[
                  styles.stateText,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                Opening your conversation…
              </Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.welcome}>
              <GamerTTSMascot width={92} height={92} />
              <Text style={[styles.welcomeTitle, { color: theme.onSurface }]}>
                How can I help?
              </Text>
              <Text
                style={[
                  styles.welcomeText,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                Ask about EchoStream setup, voices, alerts, live runtime,
                billing, or troubleshooting.
              </Text>
            </View>
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <View
                  key={String(message.id)}
                  style={[
                    styles.messageRow,
                    isUser ? styles.userRow : styles.assistantRow,
                  ]}
                >
                  {!isUser && <GamerTTSMascot width={32} height={32} />}

                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: isUser
                          ? theme.primary
                          : theme.surfaceVariant,
                      },
                      isUser
                        ? styles.userBubble
                        : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        {
                          color: isUser
                            ? theme.buttonText
                            : theme.onSurface,
                        },
                      ]}
                    >
                      {message.content}
                    </Text>

                    <Text
                      style={[
                        styles.time,
                        {
                          color: isUser
                            ? theme.buttonText
                            : theme.onSurfaceVariant,
                        },
                      ]}
                    >
                      {formatTime(message.created_at)}
                    </Text>
                  </View>

                  {isUser && (
                    <View
                      style={[
                        styles.userAvatar,
                        { backgroundColor: theme.surfaceVariant },
                      ]}
                    >
                      {avatarUri ? (
                        <Image
                          source={{ uri: avatarUri }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Ionicons
                          name="person"
                          size={17}
                          color={theme.onSurfaceVariant}
                        />
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}

          {sending && (
            <View style={[styles.messageRow, styles.assistantRow]}>
              <GamerTTSMascot width={32} height={32} />
              <View
                style={[
                  styles.typing,
                  { backgroundColor: theme.surfaceVariant },
                ]}
              >
                <ActivityIndicator size="small" color={theme.primary} />
                <Text
                  style={[
                    styles.typingText,
                    { color: theme.onSurfaceVariant },
                  ]}
                >
                  Thinking…
                </Text>
              </View>
            </View>
          )}

          {needsHumanSupport && (
            <View
              style={[
                styles.handoff,
                {
                  backgroundColor: theme.surfaceVariant,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Ionicons
                name="headset-outline"
                size={20}
                color={theme.primary}
              />
              <Text
                style={[
                  styles.handoffText,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                This question needs human support. Please contact EchoStream
                support for further help.
              </Text>
            </View>
          )}

          {(error || rateLimited) && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color="#EF4444"
              />
              <Text style={styles.errorText}>
                {rateLimited
                  ? "You're sending messages too quickly. Please wait a moment."
                  : error}
              </Text>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.composerArea,
            { backgroundColor: theme.background },
          ]}
        >
          <View
            style={[
              styles.composer,
              { backgroundColor: theme.surfaceVariant },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={(value) => {
                setInput(value);
                if (error) setError(null);
                if (rateLimited) setRateLimited(false);
              }}
              placeholder="Ask EchoStream anything…"
              placeholderTextColor={theme.onSurfaceVariant}
              multiline
              maxLength={4000}
              editable={!loading && !sending}
              style={[styles.input, { color: theme.onSurface }]}
              textAlignVertical="center"
            />

            <Pressable
              onPress={() => void sendMessage()}
              disabled={!input.trim() || loading || sending}
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    input.trim() && !sending
                      ? theme.primary
                      : theme.primary + "35",
                },
              ]}
            >
              {sending ? (
                <ActivityIndicator
                  size="small"
                  color={theme.buttonText}
                />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color={
                    input.trim()
                      ? theme.buttonText
                      : theme.onSurfaceVariant
                  }
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  topGlow: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.35,
    borderRadius: width,
  },
  header: {
    height: 68,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: "700" },
  headerSubtitle: { fontSize: 11, marginTop: 2 },
  messages: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 18,
  },
  centerState: {
    flex: 1,
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stateText: { fontSize: 12 },
  welcome: {
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  messageRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
    marginTop: 10,
  },
  userRow: { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: { borderBottomRightRadius: 5 },
  assistantBubble: { borderBottomLeftRadius: 5 },
  messageText: { fontSize: 14.5, lineHeight: 21 },
  time: { fontSize: 9.5, marginTop: 5 },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  typing: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingText: { fontSize: 12 },
  handoff: {
    marginTop: 14,
    borderRadius: 15,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    gap: 9,
    alignItems: "flex-start",
  },
  handoffText: { flex: 1, fontSize: 12, lineHeight: 18 },
  errorBox: {
    marginTop: 12,
    padding: 11,
    borderRadius: 14,
    backgroundColor: "#EF444412",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    color: "#EF4444",
    fontSize: 12,
    lineHeight: 17,
  },
  composerArea: { padding: 10 },
  composer: {
    minHeight: 54,
    maxHeight: 135,
    borderRadius: 27,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    maxHeight: 118,
    fontSize: 14.5,
    lineHeight: 20,
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
  },
});
