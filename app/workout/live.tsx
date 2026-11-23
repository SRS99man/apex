import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/contexts/AuthContext';
import { createId } from '@/lib/ids';
import { clearWorkoutDraft, getWorkoutDraft, saveWorkoutDraft, saveWorkoutSession, type WorkoutDraft } from '@/lib/workoutStorage';
import { syncWorkoutSessions } from '@/lib/workoutSync';
import type { LoggedSet, WorkoutSession } from '@/types/workouts';
import { colors, radii, spacing } from '@/theme';

const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export default function LiveWorkoutScreen() {
  const { userId, authenticated, loading: authLoading } = useAuth();
  const [draft, setDraft] = useState<WorkoutDraft | null>(null);
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('0');
  const [loading, setLoading] = useState(true);
  const [loggingSet, setLoggingSet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entryError, setEntryError] = useState('');
  const [finishedSession, setFinishedSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    void getWorkoutDraft(userId).then((savedDraft) => {
      setDraft(savedDraft);
      setSets(savedDraft?.sets || []);
      if (savedDraft) setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(savedDraft.startedAt).getTime()) / 1000)));
      setLoading(false);
    });
  }, [authLoading, userId]);

  useEffect(() => {
    if (!draft || finishedSession) return;
    const timer = setInterval(() => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(draft.startedAt).getTime()) / 1000))), 1000);
    return () => clearInterval(timer);
  }, [draft, finishedSession]);

  useEffect(() => {
    if (restSeconds <= 0) return;
    const timer = setInterval(() => setRestSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [restSeconds]);

  const currentExercise = draft?.plan.exercises[exerciseIndex];
  const completedForExercise = useMemo(() => currentExercise ? sets.filter((item) => item.exerciseId === currentExercise.exerciseId).length : 0, [currentExercise, sets]);
  const totalSets = draft?.plan.exercises.reduce((total, item) => total + item.targetSets, 0) || 0;
  const loggedSetCount = sets.length;
  const isExerciseComplete = Boolean(currentExercise && completedForExercise >= currentExercise.targetSets);

  const addSet = async () => {
    if (!draft || !currentExercise || isExerciseComplete || loggingSet || !userId) return;
    const parsedReps = Number.parseInt(reps, 10);
    const parsedWeight = Number.parseFloat(weight);
    if (!Number.isFinite(parsedReps) || parsedReps < 1 || !Number.isFinite(parsedWeight) || parsedWeight < 0) {
      setEntryError('Enter a valid rep count and a weight of zero or more.');
      return;
    }

    const entry: LoggedSet = {
      id: createId('set'),
      exerciseId: currentExercise.exerciseId,
      exerciseName: currentExercise.exerciseName,
      setNumber: completedForExercise + 1,
      reps: parsedReps,
      weightKg: parsedWeight,
      completedAt: new Date().toISOString(),
    };
    const nextSets = [...sets, entry];
    setEntryError('');
    setLoggingSet(true);
    try {
      await saveWorkoutDraft(userId, { ...draft, sets: nextSets });
      setSets(nextSets);
      setRestSeconds(currentExercise.restSeconds);
    } catch {
      setEntryError('This set could not be saved. Check device storage and try again.');
    } finally {
      setLoggingSet(false);
    }
  };

  const goToNextExercise = () => {
    if (!draft || !isExerciseComplete) return;
    if (exerciseIndex + 1 >= draft.plan.exercises.length) {
      void finishWorkout();
      return;
    }
    const nextExerciseIndex = exerciseIndex + 1;
    setExerciseIndex(nextExerciseIndex);
    setReps(String(draft.plan.exercises[nextExerciseIndex].targetReps));
    setWeight('0');
    setRestSeconds(0);
  };

  const finishWorkout = async () => {
    if (!draft || !userId) return;
    setSaving(true);
    const completedAt = new Date().toISOString();
    const result: WorkoutSession = {
      id: createId('workout'),
      title: draft.plan.title,
      source: draft.plan.source,
      startedAt: draft.startedAt,
      completedAt,
      durationSeconds: Math.max(1, Math.floor((Date.parse(completedAt) - Date.parse(draft.startedAt)) / 1000)),
      sets,
      syncedAt: null,
    };
    await saveWorkoutSession(userId, result);
    await clearWorkoutDraft(userId);
    if (authenticated && userId !== 'apex-local-preview') void syncWorkoutSessions(userId);
    setFinishedSession(result);
    setSaving(false);
  };

  if (authLoading || loading) return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>;
  if (!authenticated) return <Redirect href="/sign-in" />;

  if (finishedSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.completeContent}>
          <View style={styles.completeMark}><Text style={styles.completeMarkText}>✓</Text></View>
          <Text style={styles.eyebrow}>SESSION SAVED ON THIS DEVICE</Text>
          <Text style={styles.completeTitle}>Work well done.</Text>
          <Text style={styles.completeSubtitle}>{finishedSession.title} · {formatTime(finishedSession.durationSeconds)}</Text>
          <View style={styles.summaryCard}>
            <Summary label="SETS LOGGED" value={String(finishedSession.sets.length)} />
            <View style={styles.summaryDivider} />
            <Summary label="MOVEMENTS" value={String(new Set(finishedSession.sets.map((item) => item.exerciseId)).size)} />
          </View>
          <PrimaryButton label="Back to training" onPress={() => router.replace('/(tabs)/train')} />
          <Pressable onPress={() => router.replace('/')} style={styles.secondaryAction}><Text style={styles.secondaryText}>Go to dashboard</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!draft || !currentExercise) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.completeContent}>
          <Text style={styles.eyebrow}>NO ACTIVE SESSION</Text>
          <Text style={styles.completeTitle}>Choose a workout first.</Text>
          <PrimaryButton label="Go to training" onPress={() => router.replace('/(tabs)/train')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.exit}><Text style={styles.exitText}>×</Text></Pressable>
          <View style={styles.sessionTitleWrap}><Text style={styles.sessionEyebrow}>LIVE SESSION</Text><Text numberOfLines={1} style={styles.sessionTitle}>{draft.plan.title}</Text></View>
          <View style={styles.clock}><Text style={styles.clockValue}>{formatTime(elapsedSeconds)}</Text></View>
        </View>

        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${totalSets ? Math.min(100, (loggedSetCount / totalSets) * 100) : 0}%` }]} /></View>
        <View style={styles.progressCaption}><Text style={styles.progressText}>{loggedSetCount} OF {totalSets} SETS</Text><Text style={styles.progressText}>{exerciseIndex + 1} / {draft.plan.exercises.length} EXERCISES</Text></View>

        <View style={styles.exerciseCard}>
          <Text style={styles.eyebrow}>MOVEMENT {String(exerciseIndex + 1).padStart(2, '0')}</Text>
          <Text style={styles.exerciseName}>{currentExercise.exerciseName}</Text>
          <Text style={styles.target}>{currentExercise.targetSets} sets · target {currentExercise.targetReps} reps</Text>

          <View style={styles.setTable}>
            <View style={styles.tableHeader}><Text style={styles.columnSet}>SET</Text><Text style={styles.columnValue}>KG</Text><Text style={styles.columnValue}>REPS</Text><Text style={styles.columnDone}>LOGGED</Text></View>
            {Array.from({ length: currentExercise.targetSets }, (_, index) => {
              const logged = sets.find((item) => item.exerciseId === currentExercise.exerciseId && item.setNumber === index + 1);
              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.columnSet}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text style={styles.columnValue}>{logged ? logged.weightKg : '—'}</Text>
                  <Text style={styles.columnValue}>{logged ? logged.reps : '—'}</Text>
                  <View style={[styles.loggedMark, logged && styles.loggedMarkActive]}><Text style={[styles.loggedMarkText, logged && styles.loggedMarkTextActive]}>{logged ? '✓' : '·'}</Text></View>
                </View>
              );
            })}
          </View>

          {!isExerciseComplete ? (
            <View style={styles.inputArea}>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>WEIGHT · KG</Text><TextInput accessibilityLabel="Weight in kilograms" keyboardType="decimal-pad" value={weight} onChangeText={(value) => { setWeight(value); setEntryError(''); }} style={styles.numberInput} selectTextOnFocus /></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>REPS</Text><TextInput accessibilityLabel="Repetitions" keyboardType="number-pad" value={reps} onChangeText={(value) => { setReps(value); setEntryError(''); }} style={styles.numberInput} selectTextOnFocus /></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>NEXT SET</Text><View style={styles.nextSet}><Text style={styles.nextSetText}>{completedForExercise + 1}</Text></View></View>
            </View>
          ) : (
            <View style={styles.exerciseDone}><Text style={styles.exerciseDoneText}>All target sets logged</Text></View>
          )}

          {restSeconds > 0 ? (
            <View style={styles.restCard}>
              <View><Text style={styles.restLabel}>REST TIMER</Text><Text style={styles.restHint}>Breathe. You’re right on track.</Text></View>
              <Text style={styles.restTime}>{formatTime(restSeconds)}</Text>
            </View>
          ) : null}

          {entryError ? <Text accessibilityRole="alert" style={styles.entryError}>{entryError}</Text> : null}
          <PrimaryButton label={isExerciseComplete ? (exerciseIndex === draft.plan.exercises.length - 1 ? 'Finish workout' : 'Next movement') : 'Log set'} onPress={isExerciseComplete ? goToNextExercise : () => void addSet()} loading={saving || loggingSet} disabled={saving || loggingSet} />
        </View>

        <Text style={styles.sessionNote}>Every set saves on this device as you go.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryItem}><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 30 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  exit: { width: 38, height: 38, borderRadius: radii.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  exitText: { color: colors.muted, fontSize: 24, lineHeight: 27 },
  sessionTitleWrap: { flex: 1 },
  sessionEyebrow: { color: colors.accent, fontSize: 8, fontWeight: '800' },
  sessionTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 4 },
  clock: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingVertical: 8, paddingHorizontal: 10, borderRadius: radii.sm },
  clockValue: { color: colors.text, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  progressTrack: { height: 4, backgroundColor: colors.surfaceRaised, borderRadius: radii.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radii.pill },
  progressCaption: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9, marginBottom: 19 },
  progressText: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  exerciseCard: { padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 14 },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '800' },
  exerciseName: { color: colors.text, fontSize: 24, lineHeight: 29, fontWeight: '800', marginTop: -7 },
  target: { color: colors.muted, fontSize: 12, marginTop: -9 },
  setTable: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 4 },
  tableHeader: { minHeight: 29, flexDirection: 'row', alignItems: 'center' },
  tableRow: { minHeight: 41, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  columnSet: { width: '20%', color: colors.muted, fontSize: 10, fontWeight: '700' },
  columnValue: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  columnDone: { width: '20%', color: colors.muted, fontSize: 8, fontWeight: '700', textAlign: 'right' },
  loggedMark: { width: 19, height: 19, marginLeft: 'auto', borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  loggedMarkActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  loggedMarkText: { color: colors.muted, fontSize: 12, lineHeight: 15 },
  loggedMarkTextActive: { color: colors.background, fontWeight: '800' },
  inputArea: { flexDirection: 'row', gap: 9 },
  inputGroup: { flex: 1, gap: 6 },
  inputLabel: { color: colors.muted, fontSize: 8, fontWeight: '700' },
  entryError: { color: colors.danger, fontSize: 11, lineHeight: 16 },
  numberInput: { height: 47, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.background, color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  nextSet: { height: 47, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentDim, borderRadius: radii.sm },
  nextSetText: { color: colors.accent, fontSize: 17, fontWeight: '800' },
  exerciseDone: { minHeight: 42, borderRadius: radii.sm, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  exerciseDoneText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  restCard: { minHeight: 67, borderRadius: radii.sm, backgroundColor: colors.surfaceRaised, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  restLabel: { color: colors.accent, fontSize: 9, fontWeight: '800' },
  restHint: { color: colors.muted, fontSize: 10, marginTop: 5 },
  restTime: { color: colors.text, fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  sessionNote: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 18 },
  completeContent: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: 15 },
  completeMark: { width: 54, height: 54, borderRadius: radii.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  completeMarkText: { color: colors.background, fontSize: 28, fontWeight: '800' },
  completeTitle: { color: colors.text, fontSize: 31, fontWeight: '800' },
  completeSubtitle: { color: colors.muted, fontSize: 13 },
  summaryCard: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingVertical: 20, marginVertical: 7 },
  summaryItem: { alignItems: 'center', gap: 5 },
  summaryValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: colors.muted, fontSize: 8, fontWeight: '700' },
  summaryDivider: { width: 1, height: 35, backgroundColor: colors.border },
  secondaryAction: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});
