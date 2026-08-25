import { useAppTheme } from '@/hooks/use-theme-color';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    SharedValue,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const SPRING = { damping: 16, stiffness: 180, mass: 0.9 };

interface SegmentedTabsProps {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export default function SegmentedTabs({ tabs, activeIndex, onChange }: SegmentedTabsProps) {
  const { theme } = useAppTheme();
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth > 0 ? (barWidth - 8) / tabs.length : 0;

  const progress = useSharedValue(activeIndex);
  useEffect(() => {
    progress.value = withSpring(activeIndex, SPRING);
  }, [activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: tabWidth,
    transform: [{ translateX: progress.value * tabWidth }],
  }));

  return (
    <View
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      style={[styles.container, { backgroundColor: theme.surfaceVariant }]}
    >
      {tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.indicator, { backgroundColor: theme.primary }, indicatorStyle]}
        />
      )}
      {tabs.map((tab, index) => (
        <TabLabel
          key={tab}
          label={tab}
          index={index}
          progress={progress}
          onPress={() => onChange(index)}
          activeColor={theme.buttonText}
          inactiveColor={theme.onSurfaceVariant}
        />
      ))}
    </View>
  );
}

function TabLabel({
  label,
  index,
  progress,
  onPress,
  activeColor,
  inactiveColor,
}: {
  label: string;
  index: number;
  progress: SharedValue<number>;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
}) {
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [index - 1, index, index + 1], [inactiveColor, activeColor, inactiveColor]),
  }));

  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <Animated.Text style={[styles.tabText, textStyle]} numberOfLines={1}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 4,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 9999,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
});