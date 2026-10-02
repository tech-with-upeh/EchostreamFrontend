import { useAppTheme } from "@/hooks/use-theme-color";
import { uploadVoiceSample } from "@/lib/api";
import { reportError } from "@/store/error.store";
import { useUserStore } from "@/store/user.store";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const MAX_SAMPLE_SIZE = 10 * 1024 * 1024; // 15 MB

export default function AddVoiceSampleScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { isDark } = useAppTheme();
  const [uploading, setUploading] = useState(false);

  // Upload is a plain "attach a file" action — no trimming/editing here.
  // Recording has its own dedicated screen since it needs the live waveform UI.
  const pickAndUpload = async () => {
    if (uploading) return;

    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    if (asset.size != null && asset.size > MAX_SAMPLE_SIZE) {
      Alert.alert(
        "File too large",
        "Please choose an audio file smaller than 15 MB.",
      );
      return;
    }

    // Spinner starts as soon as the user has picked a file.
    setUploading(true);
    try {
      await uploadVoiceSample(user?.first_name || "My Voice", {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
      });
      router.back();
    } catch (error) {
      reportError("Failed to upload voice sample: " + error);
      Alert.alert(
        "Upload failed",
        "Couldn't upload that file. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={StyleSheet.absoluteFillObject}>
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
      </View>

      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          disabled={uploading}
          hitSlop={12}
          style={[styles.backButton, { opacity: uploading ? 0.3 : 1 }]}
        >
          <Ionicons name="arrow-back" size={22} color={theme.onSurface} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
          Add Voice Sample
        </Text>
        <View style={{ width: 22 }} />
      </Animated.View>

      <View style={styles.content}>
        <Animated.Text
          entering={FadeInUp.duration(450).delay(80)}
          style={[styles.prompt, { color: theme.onSurfaceVariant }]}
        >
          How would you like to add your sample?
        </Animated.Text>

        {/* Record */}
        <Animated.View entering={FadeInUp.duration(500).delay(140)}>
          <Pressable
            onPress={() => router.push("/voice-samples/record")}
            disabled={uploading}
            style={[
              styles.optionCard,

              {
                backgroundColor: theme.surfaceVariant,
                opacity: uploading ? 0.5 : 1,
                borderColor: "transparent",
                boxShadow: isDark
                  ? "0px 0px 18px #0000004d"
                  : "0px 0px 18px #8681814d",
              },
            ]}
          >
            <View
              style={[styles.optionIcon, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="mic-outline" size={26} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: theme.onSurface }]}>
                Record a Sample
              </Text>
              <Text
                style={[
                  styles.optionSubtitle,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                Speak clearly for about 30 seconds
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.onSurfaceVariant}
            />
          </Pressable>
        </Animated.View>

        {/* Upload */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
          <Pressable
            onPress={pickAndUpload}
            disabled={uploading}
            style={[
              styles.optionCard,

              {
                backgroundColor: theme.surfaceVariant,
                borderColor: "transparent",
                boxShadow: isDark
                  ? "0px 0px 18px #0000004d"
                  : "0px 0px 18px #8681814d",
              },
            ]}
          >
            <View
              style={[styles.optionIcon, { backgroundColor: theme.surface }]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Ionicons
                  name="cloud-upload-outline"
                  size={26}
                  color={theme.primary}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: theme.onSurface }]}>
                {uploading ? "Uploading…" : "Upload a Sample"}
              </Text>
              <Text
                style={[
                  styles.optionSubtitle,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                {uploading
                  ? "Cloning your voice, this can take a moment"
                  : "Choose an existing audio file"}
              </Text>
            </View>
            {!uploading && (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.onSurfaceVariant}
              />
            )}
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topAmbientGlow: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.45,
    borderRadius: width,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {},
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  prompt: { fontSize: 13, marginBottom: 18, lineHeight: 18 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  optionSubtitle: { fontSize: 12, lineHeight: 16 },
});
