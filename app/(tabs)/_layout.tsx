import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { syncWorkoutSessions } from '@/lib/workoutSync';
import { colors } from '@/theme';

export default function TabLayout() {
  const { session, profile, loading, authenticated, previewMode } = useAuth();

  useEffect(() => {
    if (session?.user.id) void syncWorkoutSessions(session.user.id);
  }, [session?.user.id]);

  if (loading) return <View style={styles.loading}><ActivityIndicator color={colors.accent} size="large" /></View>;
  if (!authenticated) return <Redirect href="/sign-in" />;
  if (!previewMode && !profile?.onboarding_completed) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 68,
          paddingTop: 9,
          paddingBottom: 10,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'HOME' }} />
      <Tabs.Screen name="train" options={{ title: 'TRAIN' }} />
      <Tabs.Screen name="progress" options={{ title: 'PROGRESS' }} />
      <Tabs.Screen name="anatomy" options={{ title: 'ANATOMY' }} />
      <Tabs.Screen name="profile" options={{ title: 'PROFILE' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
