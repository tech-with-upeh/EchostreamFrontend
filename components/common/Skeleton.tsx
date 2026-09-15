import { useAppTheme } from "@/hooks/use-theme-color";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { theme } = useAppTheme();
  const [layoutWidth, setLayoutWidth] = useState(0);
  const translateX = useSharedValue(0);

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      if (w && w !== layoutWidth) {
        setLayoutWidth(w);
        translateX.value = -w;
        translateX.value = withRepeat(
          withTiming(w, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          -1,
          false,
        );
      }
    },
    [layoutWidth],
  );

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        { width, height, borderRadius, backgroundColor: theme.surfaceVariant },
        style,
      ]}
    >
      {layoutWidth > 0 && (
        <AnimatedGradient
          colors={["transparent", theme.onSurfaceVariant + "26", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            StyleSheet.absoluteFillObject,
            { width: layoutWidth },
            shimmerStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden" },
});
