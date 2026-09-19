import { useAppTheme } from "@/hooks/use-theme-color";
import { useErrorStore, type AppError } from "@/store/error.store";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp, Layout } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS: Record<AppError["severity"], keyof typeof Ionicons.glyphMap> = {
  error: "alert-circle",
  warning: "warning",
  info: "information-circle",
};

const COLORS: Record<AppError["severity"], string> = {
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
};

export default function ErrorOverlay() {
  const errors = useErrorStore((s) => s.errors);
  const dismiss = useErrorStore((s) => s.dismiss);
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  if (errors.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { top: insets.top + 8 }]}
    >
      {errors.map((err) => (
        <Animated.View
          key={err.id}
          entering={FadeInUp.duration(220)}
          exiting={FadeOutUp.duration(180)}
          layout={Layout.springify()}
          style={[
            styles.toast,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: COLORS[err.severity],
            },
          ]}
        >
          <Ionicons
            name={ICONS[err.severity]}
            size={18}
            color={COLORS[err.severity]}
          />
          <Text
            style={[styles.message, { color: theme.onSurface }]}
            numberOfLines={2}
          >
            {err.message}
          </Text>
          <Pressable onPress={() => dismiss(err.id)} hitSlop={8}>
            <Ionicons name="close" size={16} color={theme.onSurfaceVariant} />
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  message: { flex: 1, fontSize: 13, fontWeight: "600" },
});
