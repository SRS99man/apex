import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { ExperienceLevel, Goal } from '@/types/database';
import { colors, radii, spacing } from '@/theme';

const goals: { value: Goal; title: string; detail: string }[] = [
  { value: 'build_muscle', title: 'Build muscle', detail: 'Add size and shape' },
  { value: 'lose_fat', title: 'Lose fat', detail: 'Move with more ease' },
  { value: 'get_stronger', title: 'Get stronger', detail: 'Lift with purpose' },
  { value: 'improve_fitness', title: 'Feel fitter', detail: 'Build everyday capacity' },
];

const levels: { value: ExperienceLevel; title: string }[] = [
  { value: 'beginner', title: 'New' },
  { value: 'intermediate', title: 'Some experience' },
  { value: 'advanced', title: 'Experienced' },
];

export default function OnboardingScreen() {
  const { session, profile, loading, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name || String(session?.user.user_metadata.full_name || ''));
  const [goal, setGoal] = useState<Goal | null>(null);
  const [level, setLevel] = useState<ExperienceLevel>('beginner');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <View style={styles.loading}><ActivityIndicator color={colors.accent} size="large" /></View>;
  if (!session) return <Redirect href="/sign-in" />;
  if (profile?.onboarding_completed) return <Redirect href="/(tabs)" />;

  const completeSetup = async () => {
    setError('');
    if (!name.trim() || !goal) {
      setError('Add your name and choose a primary goal.');
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: name.trim(),
        primary_goal: goal,
        experience_level: level,
        onboarding_completed: true,
      })
      .eq('id', session.user.id);

    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }

    await refreshProfile();
    setBusy(false);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topline}>
          <Text style={styles.brand}>APEX<Text style={styles.brandDot}>.</Text></Text>
          <Text style={styles.step}>01 / 01</Text>
        </View>
        <Text style={styles.eyebrow}>YOUR STARTING POINT</Text>
        <Text style={styles.title}>Make it yours.</Text>
        <Text style={styles.subtitle}>A little context helps us make your training feel personal.</Text>

        <View style={styles.section}>
          <TextField label="What should we call you?" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" textContentType="name" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What matters most right now?</Text>
          <View style={styles.goalGrid}>
            {goals.map((item, index) => {
              const selected = goal === item.value;
              return (
                <Pressable key={item.value} onPress={() => setGoal(item.value)} style={[styles.goal, selected && styles.goalSelected, index % 2 === 0 && styles.goalLeft]}>
                  <View style={[styles.selectionMark, selected && styles.selectionMarkActive]} />
                  <Text style={[styles.goalTitle, selected && styles.selectedText]}>{item.title}</Text>
                  <Text style={styles.goalDetail}>{item.detail}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your training experience</Text>
          <View style={styles.levelRow}>
            {levels.map((item) => {
              const selected = level === item.value;
              return (
                <Pressable key={item.value} onPress={() => setLevel(item.value)} style={[styles.level, selected && styles.levelSelected]}>
                  <Text style={[styles.levelText, selected && styles.selectedText]}>{item.title}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Set up my profile" onPress={completeSetup} loading={busy} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 42 },
  brand: { color: colors.text, fontSize: 16, fontWeight: '900', letterSpacing: 0 },
  brandDot: { color: colors.accent },
  step: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0, marginBottom: 10 },
  title: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: 0 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 9, marginBottom: spacing.xl, maxWidth: 330 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: spacing.md },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  goal: { width: '48%', minHeight: 104, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10, justifyContent: 'flex-end' },
  goalLeft: { marginRight: '2%' },
  goalSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  selectionMark: { position: 'absolute', top: 13, right: 13, width: 14, height: 14, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.muted },
  selectionMarkActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  goalTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  selectedText: { color: colors.accent },
  goalDetail: { color: colors.muted, fontSize: 11, marginTop: 5 },
  levelRow: { flexDirection: 'row', gap: 8 },
  level: { flex: 1, minHeight: 46, paddingHorizontal: 8, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  levelSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  levelText: { color: colors.muted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.md },
});
