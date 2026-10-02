import { useAppTheme } from "@/hooks/use-theme-color";
import { usePreferencesStore } from "@/store/preference.store";
import { useUserStore } from "@/store/user.store";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const SPRING = { damping: 16, stiffness: 180, mass: 0.9 };
export default function TikTokConnectForm({
  onConnected,
  theme,
}: {
  onConnected: (username: string) => void;
  theme: ReturnType<typeof useAppTheme>["theme"];
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const clean = value.trim().replace(/^@/, "");
  const isValid = clean.length >= 2;
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const buttonWidth = isTablet
    ? Math.min(width * 0.55, 420)
    : Math.min(width - 40, 360);
  const handleSubmit = () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onConnected(clean);
    }, 500);
  };

  const user = useUserStore((state) => state.user);
  const { isDark } = useAppTheme();
  const preferences = usePreferencesStore((state) => state.preferences);
  return (
    <View
      style={[
        styles.connectCard,
        {
          backgroundColor: theme.surfaceVariant,
          borderColor: "transparent",
          boxShadow: isDark
            ? "0px 0px 18px #0000004d"
            : "0px 0px 18px #8681814d",
        },
      ]}
    >
      <View style={[styles.connectIcon, { backgroundColor: theme.surface }]}>
        <FontAwesome5 name="tiktok" size={22} color={theme.onSurface} />
      </View>
      <Text style={[styles.connectTitle, { color: theme.onSurface }]}>
        Connect your TikTok
      </Text>
      <Text style={[styles.connectSubtitle, { color: theme.onSurfaceVariant }]}>
        Enter your TikTok username so we can pull live comments to read out with
        text-to-speech.
      </Text>
      <View
        style={[
          styles.connectInputRow,
          { borderColor: theme.outline, backgroundColor: theme.surface },
        ]}
      >
        <Text style={[styles.atSign, { color: theme.onSurfaceVariant }]}>
          @
        </Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="yourusername"
          placeholderTextColor={theme.onSurfaceVariant}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.connectInput, { color: theme.onSurface }]}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
      </View>
      <Animated.View
        style={[
          scaleStyle,
          { width: buttonWidth, maxWidth: "100%", alignSelf: "center" },
        ]}
      >
        <Pressable
          onPress={handleSubmit}
          onPressIn={() => {
            if (isValid && !submitting) scale.value = withSpring(0.97, SPRING);
          }}
          onPressOut={() => {
            scale.value = withSpring(1, SPRING);
          }}
          disabled={!isValid || submitting}
          style={[
            styles.connectButton,
            {
              backgroundColor: theme.primary,
              opacity: isValid && !submitting ? 1 : 0.5,
            },
          ]}
        >
          <Text
            style={[styles.connectButtonText, { color: theme.buttonText }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {submitting ? "Connecting…" : "Connect Account"}
          </Text>
          {!submitting && (
            <Ionicons name="arrow-forward" size={16} color={theme.buttonText} />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  connectedHandle: { fontSize: 12, marginTop: 4 },
  connectSection: { marginBottom: 24 },
  connectCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  connectIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  connectTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  connectSubtitle: {
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  connectInputRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 4,
  },
  atSign: { fontSize: 14, fontWeight: "700" },
  connectInput: { flex: 1, fontSize: 14, padding: 0 },
  connectButton: {
    width: "100%",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  connectButtonText: { fontSize: 14, fontWeight: "700", flexShrink: 1 },
});
