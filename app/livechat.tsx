import GamerTTSMascot from "@/components/common/Mascot";
import { useAppTheme } from "@/hooks/use-theme-color";
import { createHelpConversation, getHelpConversation, sendHelpMessage } from "@/lib/api";
import type { HelpMessage } from "@/lib/schema";
import { ApiError } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type ChatMessage = HelpMessage;

function formatCurrentTime() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}  const params = useLocalSearchParams<{ chatId?: string }>();
  const [conversationId, setConversationId] = useState<string | null>(params.chatId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showRateLimitError, setShowRateLimitError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof ApiError ? err.message : "Unable to open the help assistant.");
    } finally {
      setLoading(false);
    }
  }, [params.chatId]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || loading || !conversationId) return;

    setInput("");
    setShowRateLimitError(false);
    setError(null);
    setSending(true);

    try {
      const result = await sendHelpMessage(conversationId, text);
      setMessages((current) => [...current, result.user_message, result.assistant_message]);
    } catch (err) {
      setInput(text);
      if (err instanceof ApiError && err.status === 429) {
        setShowRateLimitError(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Unable to send your message.");
      }
    } finally {
      setSending(false);
    }
  };

  const messageGroups = useMemocomponents/common/Mascot";
import { useAppTheme } from "@/hooks/use-theme-color";
import { createHelpConversation, getHelpConversation, sendHelpMessage } from "@/lib/api";
import type { HelpMessage } from "@/lib/schema";
import { ApiError } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type ChatMessage = HelpMessage;

function formatCurrentTime() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}
