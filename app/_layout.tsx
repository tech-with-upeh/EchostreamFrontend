// app/_layout.tsx
import { useAuthStore } from "@/store/auth.store";
import { Geist_500Medium } from "@expo-google-fonts/geist";
import { Inter_400Regular, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const { isInitialized, isAuthenticated } = useAuthStore();

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
    </>
  );
}
