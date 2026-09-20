import { useAppTheme } from "@/hooks/use-theme-color";
import { useErrorStore, type AppError } from "@/store/error.store";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp, FadeOutUp, Layout } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Severity = AppError["severity"];

const ICONS: Record<Severity, keyof typeof Ionicons.glyphMap> = {
  error: "alert-circle",
  warning: "warning",
  info: "information-circle",
};

const COLORS: Record<Severity, string> = {
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
};

// Tablet breakpoint (iPad portrait is 744–834pt wide, split view can be narrower)
const TABLET_MIN_WIDTH = 700;

export default function ErrorOverlay() {
  const errors = useErrorStore((s) => s.errors);
  const dismiss = useErrorStore((s) => s.dismiss);
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  if (errors.length === 0) return null;

  const isTablet = width >= TABLET_MIN_WIDTH;
  const size = isTablet ? SIZES.tablet : SIZES.phone;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: insets.top + (isTablet ? 16 : 8),
          paddingHorizontal: isTablet ? 24 : 12,
        },
      ]}
    >
      {errors.map((err) => {
        const accent = COLORS[err.severity];

        return (
          <Animated.View
            key={err.id}
            entering={FadeInUp.duration(240)}
            exiting={FadeOutUp.duration(180)}
            layout={Layout.springify()}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
            style={[
              styles.shadow,
              {
                maxWidth: size.maxWidth,
                borderRadius: size.radius,
                shadowColor: accent,
              },
            ]}
          >
            {/* Clipped inner layer so the accent bar follows the rounded corners */}
            <View
              style={[
                styles.card,
                {
                  borderRadius: size.radius,
                  backgroundColor: theme.surface ?? theme.surfaceVariant,
                  borderColor: accent + "40",
                },
              ]}
            >
              {/* Opaque surface + severity tint = readable on any screen */}
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: accent + "1A" },
                ]}
              />

              <View
                style={[
                  styles.row,
                  {
                    paddingVertical: size.padV,
                    paddingLeft: size.padH + 4,
                    paddingRight: size.padH - 2,
                    gap: size.gap,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconBadge,
                    {
                      width: size.badge,
                      height: size.badge,
                      borderRadius: size.badge / 2,
                      backgroundColor: accent + "26",
                    },
                  ]}
                >
                  <Ionicons
                    name={ICONS[err.severity]}
                    size={size.icon}
                    color={accent}
                  />
                </View>

                <Text
                  style={[
                    styles.message,
                    {
                      color: theme.onSurface,
                      fontSize: size.font,
                      lineHeight: size.font * 1.4,
                    },
                  ]}
                  numberOfLines={isTablet ? 3 : 2}
                >
                  {err.message}
                </Text>

                <Pressable
                  onPress={() => dismiss(err.id)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss"
                  style={({ pressed }) => [
                    styles.closeBtn,
                    {
                      width: size.close,
                      height: size.close,
                      borderRadius: size.close / 2,
                      backgroundColor: pressed
                        ? accent + "33"
                        : theme.onSurface + "14",
                    },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={size.close * 0.58}
                    color={theme.onSurfaceVariant}
                  />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const SIZES = {
  phone: {
    maxWidth: 520,
    radius: 18,
    padV: 12,
    padH: 14,
    gap: 12,
    badge: 32,
    icon: 20,
    font: 14,
    close: 26,
  },
  tablet: {
    maxWidth: 560,
    radius: 22,
    padV: 16,
    padH: 18,
    gap: 14,
    badge: 40,
    icon: 24,
    font: 16,
    close: 30,
  },
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
    alignItems: "center",
    gap: 10,
  },
  // Outer layer carries the shadow (iOS clips shadows on overflow:hidden views)
  shadow: {
    width: "100%",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  card: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    flex: 1,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  closeBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
});
