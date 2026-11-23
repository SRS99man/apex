import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/contexts/AuthContext';
import { exercises } from '@/data/exercises';
import { generateWorkout, workoutPrograms } from '@/data/workoutPlans';
import { getWorkoutDraft, getWorkoutSessions, saveWorkoutDraft } from '@/lib/workoutStorage';
import type { WorkoutPlan } from '@/types/workouts';
import type { Goal, ExperienceLevel } from '@/types/database';
import { colors, radii, spacing } from '@/theme';

const goalFallback: Goal = 'improve_fitness';
const levelFallback: ExperienceLevel = 'beginner';

export default function TrainScreen() {
  const { profile, userId } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useFocusEffect(useCallback(() => {
    if (!userId) {
      setHasDraft(false);
      setPendingCount(0);
      return undefined;
    }
    void Promise.all([getWorkoutDraft(userId), getWorkoutSessions(userId)]).then(([draft, sessions]) => {
      setHasDraft(Boolean(draft));
      setPendingCount(sessions.filter((item) => !item.syncedAt).length);
    });
    return undefined;
  }, [userId]));

  const startWorkout = async (plan: WorkoutPlan) => {
    if (!userId) return;
    const activeDraft = await getWorkoutDraft(userId);
    if (activeDraft) {
      router.push('/workout/live');
      return;
    }
    const startedAt = new Date().toISOString();
    await saveWorkoutDraft(userId, { plan, startedAt, sets: [] });
    router.push('/workout/live');
  };

  const makeGeneratedPlan = () => {
    const generated = generateWorkout(exercises, profile?.primary_goal || goalFallback, profile?.experience_level || levelFallback);
    setSelectedPlan(generated);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PHASE 02 · WORKOUT ENGINE</Text>
            <Text style={styles.title}>Train with intent.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Search exercise library" onPress={() => router.push('/exercises')} style={styles.libraryButton}>
            <Text style={styles.libraryGlyph}>⌕</Text>
          </Pressable>
        </View>

        {pendingCount > 0 ? (
          <View style={styles.syncNotice}><View style={styles.syncDot} /><Text style={styles.syncText}>{pendingCount} {pendingCount === 1 ? 'session' : 'sessions'} waiting to sync</Text></View>
        ) : null}

        {hasDraft ? (
          <Pressable onPress={() => router.push('/workout/live')} style={styles.resume}>
            <View style={styles.resumeMark}><Text style={styles.resumeMarkText}>↗</Text></View>
            <View style={styles.resumeCopy}><Text style={styles.resumeTitle}>Session in progress</Text><Text style={styles.resumeSubtitle}>Your workout is saved on this device.</Text></View>
            <Text style={styles.resumeArrow}>›</Text>
          </Pressable>
        ) : null}

        {selectedPlan ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedTop}>
              <View><Text style={styles.cardEyebrow}>{selectedPlan.source === 'generated' ? 'BUILT FOR YOUR GOAL' : selectedPlan.focus}</Text><Text style={styles.selectedTitle}>{selectedPlan.title}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close selected workout" onPress={() => setSelectedPlan(null)} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
            </View>
            <Text style={styles.selectedMeta}>{selectedPlan.exercises.length} exercises · about {selectedPlan.durationMinutes} min</Text>
            <View style={styles.exercisePreview}>
              {selectedPlan.exercises.map((item, index) => (
                <View key={item.exerciseId} style={styles.previewRow}>
                  <Text style={styles.previewIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text style={styles.previewName}>{item.exerciseName}</Text>
                  <Text style={styles.previewSets}>{item.targetSets} × {item.targetReps}</Text>
                </View>
              ))}
            </View>
            <PrimaryButton label="Start this workout" onPress={() => void startWorkout(selectedPlan)} />
          </View>
        ) : (
          <View style={styles.generator}>
            <View style={styles.generatorCopy}>
              <Text style={styles.cardEyebrow}>QUICK START</Text>
              <Text style={styles.generatorTitle}>A session that fits your focus.</Text>
              <Text style={styles.generatorBody}>A balanced starting plan built from your goal and experience.</Text>
            </View>
            <PrimaryButton label="Generate a workout" onPress={makeGeneratedPlan} />
          </View>
        )}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Workout plans</Text>
          <Text style={styles.sectionHint}>PICK A SESSION</Text>
        </View>
        <View style={styles.planList}>
          {workoutPrograms.map((plan, index) => (
            <Pressable key={plan.id} onPress={() => setSelectedPlan(plan)} style={[styles.planRow, index === workoutPrograms.length - 1 && styles.planRowLast]}>
              <View style={styles.planNumber}><Text style={styles.planNumberText}>{String(index + 1).padStart(2, '0')}</Text></View>
              <View style={styles.planCopy}><Text style={styles.planName}>{plan.title}</Text><Text style={styles.planFocus}>{plan.focus}</Text></View>
              <View style={styles.planTime}><Text style={styles.planMinutes}>{plan.durationMinutes}</Text><Text style={styles.planUnit}>MIN</Text></View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => router.push('/exercises')} style={styles.libraryLink}>
          <View><Text style={styles.libraryTitle}>Exercise library</Text><Text style={styles.librarySubtitle}>{exercises.length} movements · search by muscle or equipment</Text></View>
          <Text style={styles.linkArrow}>↗</Text>
        </Pressable>
        <Text style={styles.bottomNote}>LOG LOCALLY. SYNC WHEN YOU’RE BACK ONLINE.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 23 },
  syncNotice: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, marginTop: -11, marginBottom: 13, borderRadius: radii.sm, backgroundColor: colors.surfaceRaised },
  syncDot: { width: 6, height: 6, borderRadius: radii.pill, backgroundColor: colors.accent },
  syncText: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0 },
  title: { color: colors.text, fontSize: 29, fontWeight: '800', marginTop: 7 },
  libraryButton: { width: 42, height: 42, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  libraryGlyph: { color: colors.text, fontSize: 26, lineHeight: 28 },
  resume: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 18, borderRadius: radii.md, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentDim },
  resumeMark: { width: 36, height: 36, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  resumeMarkText: { color: colors.background, fontSize: 18, fontWeight: '800' },
  resumeCopy: { flex: 1 },
  resumeTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  resumeSubtitle: { color: colors.muted, fontSize: 11, marginTop: 4 },
  resumeArrow: { color: colors.accent, fontSize: 24 },
  generator: { gap: 18, padding: spacing.lg, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  generatorCopy: { gap: 8 },
  cardEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 0 },
  generatorTitle: { color: colors.text, fontSize: 21, lineHeight: 26, fontWeight: '800', maxWidth: 275 },
  generatorBody: { color: colors.muted, fontSize: 12, lineHeight: 18, maxWidth: 300 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sectionHint: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  planList: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  planRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  planRowLast: { borderBottomWidth: 0 },
  planNumber: { width: 32, height: 32, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  planNumberText: { color: colors.accent, fontSize: 10, fontWeight: '800' },
  planCopy: { flex: 1 },
  planName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  planFocus: { color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 5 },
  planTime: { alignItems: 'center', minWidth: 35 },
  planMinutes: { color: colors.text, fontSize: 13, fontWeight: '700' },
  planUnit: { color: colors.muted, fontSize: 8, fontWeight: '700', marginTop: 2 },
  chevron: { color: colors.muted, fontSize: 22, marginLeft: 2 },
  libraryLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginTop: 16, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  libraryTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  librarySubtitle: { color: colors.muted, fontSize: 11, marginTop: 5 },
  linkArrow: { color: colors.accent, fontSize: 20 },
  selectedCard: { gap: 16, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.surface, marginBottom: 5 },
  selectedTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  selectedTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 7 },
  close: { width: 30, height: 30, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.muted, fontSize: 22, lineHeight: 24 },
  selectedMeta: { color: colors.muted, fontSize: 12 },
  exercisePreview: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 5 },
  previewRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewIndex: { color: colors.accent, fontSize: 9, fontWeight: '800', width: 20 },
  previewName: { color: colors.text, fontSize: 11, flex: 1 },
  previewSets: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  bottomNote: { color: colors.muted, fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 24 },
});
