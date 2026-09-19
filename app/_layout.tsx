// app/_layout.tsx
import ErrorOverlay from "@/components/common/ErrorOverlay";
import { installConsoleReporter, reportError } from "@/store/error.store";
import { useAuthStore } from "@/store/auth.store";
import { useUserStore } from "@/store/user.store";
import { Geist_500Medium } from "@expo-google-fonts/geist";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useFonts } from "expo-font";
import { Stack, type ErrorBoundaryProps, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

SplashScreen.preventAutoHideAsync().catch(() => {});
installConsoleReporter();

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <View style={styles.fallback}>
      <ErrorOverlay />
      <Text style={styles.fallbackTitle}>Something went wrong</Text>
      <Text style={styles.fallbackMessage}>{error.message}</Text>
      <Pressable onPress={() => void retry()} style={styles.retryButton}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#101114" },
  fallbackTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  fallbackMessage: { color: "#B9BEC8", fontSize: 14, textAlign: "center", marginBottom: 20 },
  retryButton: { backgroundColor: "#7C5CFC", borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
  retryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});

function AuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated) {
      void fetchUser().catch(() => {});
    } else {
      clearUser();
    }
  }, [isInitialized, isAuthenticated, fetchUser, clearUser]);

  useEffect(() => {
    if (!isInitialized) return;

    const firstSegment = segments[0];
    const inAuth = firstSegment === "(auth)";
    const inDashboard = firstSegment === "(dashboard)";
    const isRoot = !firstSegment || firstSegment === "index";

    if (isAuthenticated && (inAuth || isRoot)) {
      router.replace("/(dashboard)");
    } else if (!isAuthenticated && (inDashboard || isRoot)) {
      router.replace("/splash");
    }
  }, [isInitialized, isAuthenticated, segments, router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Geist_500Medium,
  });
  const initializeAuth = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
  }, []);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isInitialized)
      SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError, isInitialized]);

  if (!fontsLoaded && !fontError) return null;
  if (!isInitialized) return null;

  return (
    <>
      <AuthRedirect />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="pricing" options={{ headerShown: false }} />
        <Stack.Screen name="preferences" options={{ headerShown: false }} />
        <Stack.Screen name="voices" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="voice-select" options={{ headerShown: false }} />
        <Stack.Screen name="sound-alert" options={{ headerShown: false }} />
        <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
      </Stack>
      <ErrorOverlay />
    </>
  );
}
