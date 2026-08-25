import FloatingTabBar from '@/components/FloatingTabBar';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="tts" options={{ title: 'TTS' }} />
      <Tabs.Screen name="mic" options={{ title: 'Mic' }} />
    </Tabs>
  );
}