import SegmentedTabs from "@/components/common/SegmentedTabs";
import { useAppTheme } from "@/hooks/use-theme-color";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import TtsChatTab from "../../components/dashboard/ttschat";
import TtsGiftTab from "../../components/dashboard/ttsgift";

const { width, height } = Dimensions.get("window");

export default function TtsScreen() {
  const { theme } = useAppTheme();

  const [activeTab, setActiveTab] = useState(0);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
      edges={["top", "left", "right"]}
    >
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={theme.bgGradient}
          style={StyleSheet.absoluteFillObject}
        />

        <LinearGradient
          colors={[theme.topGlow, "transparent"]}
          style={styles.topGlow}
        />

        <LinearGradient
          colors={[theme.bottomGlow, "transparent"]}
          style={styles.bottomGlow}
        />
      </View>

      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <MaterialCommunityIcons
          name="waveform"
          size={20}
          color={theme.primary}
          style={styles.headerIcon}
        />

        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.onSurface,
            },
          ]}
        >
          Alerts & Sounds
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(500).delay(80)}
          style={styles.tabsWrapper}
        >
          <SegmentedTabs
            tabs={["Text to speech Chat", "Text to speech Gifts"]}
            activeIndex={activeTab}
            onChange={setActiveTab}
          />
        </Animated.View>

        {activeTab === 0 ? <TtsChatTab /> : <TtsGiftTab />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topGlow: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.45,
    borderRadius: width,
  },

  bottomGlow: {
    position: "absolute",
    bottom: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.35,
    borderRadius: width,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },

  headerIcon: {
    position: "absolute",
    left: 20,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },

  tabsWrapper: {
    marginBottom: 22,
  },
});
