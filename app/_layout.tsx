// app/_layout.tsx
import { Geist_500Medium } from '@expo-google-fonts/geist';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { restoreAuthSession, getAccessToken } from '@/lib/api';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthRedirect({ authReady }: { authReady: boolean }) {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!authReady) return;
    const firstSegment = segments[0];
    const inAuth = firstSegment === '(auth)';
    const inDashboard = firstSegment === '(dashboard)';
    const isRoot = !firstSegment || firstSegment === 'index';
    const hasSession = Boolean(getAccessToken());
    if (hasSession && (inAuth || isRoot)) router.replace('/(dashboard)');
    else if (!hasSession && (inDashboard || isRoot)) router.replace('/login');
  }, [authReady, segments, router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_600SemiBold, Geist_500Medium });
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    restoreAuthSession().finally(() => { if (mounted) setAuthReady(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && authReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError, authReady]);

  if (!fontsLoaded && !fontError) return null;
  if (!authReady) return null;

  return (
    <>
      <AuthRedirect authReady={authReady} />
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
        <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
