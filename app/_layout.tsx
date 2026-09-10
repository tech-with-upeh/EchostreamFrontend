// app/_layout.tsx
import { Geist_500Medium } from '@expo-google-fonts/geist';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { getAccessToken } from '@/lib/api';

SplashScreen.preventAutoHideAsync();

function AuthRedirect() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuth = segments[0] === '(auth)';
    const inDashboard = segments[0] === '(dashboard)';
    const hasSession = Boolean(getAccessToken());

    if (hasSession && inAuth) {
      router.replace('/(dashboard)');
    } else if (!hasSession && inDashboard) {
      router.replace('/login');
    }
  }, [segments, router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_600SemiBold, Geist_500Medium });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <AuthRedirect />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="pricing" options={{ headerShown: false }} />
        <Stack.Screen name="preferences" options={{ headerShown: false }} />
        <Stack.Screen name="voices" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="voice-select" options={{ headerShown: false }} />
        <Stack.Screen name="sound-alert" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}