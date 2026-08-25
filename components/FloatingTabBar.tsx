import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SPRING = { damping: 16, stiffness: 180, mass: 0.9 };

type IconMeta = { lib: 'ion' | 'mci'; active: string; inactive: string };

// Maps route name -> icon. Keys must match your screen filenames in app/(tabs)/
const ICONS: Record<string, IconMeta> = {
  index: { lib: 'ion', active: 'home', inactive: 'home-outline' },
  tts: { lib: 'mci', active: 'waveform', inactive: 'waveform' },
  mic: { lib: 'ion', active: 'mic', inactive: 'mic-outline' },
};

export default function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);

  const routeCount = state.routes.length;
  const tabWidth = barWidth > 0 ? barWidth / routeCount : 0;

  const indicatorX = useSharedValue(0);
  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, SPRING);
  }, [state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: tabWidth,
  }));

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
      <View
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.outline }]}
      >
        {tabWidth > 0 && (
          <Animated.View style={[styles.indicator, { backgroundColor: theme.primary }, indicatorStyle]} />
        )}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = ICONS[route.name] ?? ICONS.index;
          const iconName = isFocused ? meta.active : meta.inactive;
          const color = isFocused ? theme.buttonText : theme.onSurfaceVariant;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabButton} hitSlop={6}>
              {meta.lib === 'mci' ? (
                <MaterialCommunityIcons name={iconName as any} size={22} color={color} />
              ) : (
                <Ionicons name={iconName as any} size={22} color={color} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 32,
    right: 32,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 300,
    borderRadius: 9999,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 0,
    borderRadius: 9999,
  },
  tabButton: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});