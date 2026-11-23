import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { colors } from '@/theme';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <Head>
        <title>APEX</title>
        <meta name="description" content="AI-assisted workout and fitness tracking" />
        <meta name="theme-color" content="#080A08" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="APEX" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/apex-icon.svg" />
        <link rel="apple-touch-icon" href="/apex-icon.svg" />
      </Head>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
