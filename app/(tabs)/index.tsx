import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/contexts/AuthContext';
import { getWorkoutSessions } from '@/lib/workoutStorage';
import type { WorkoutSession } from '@/types/workouts';
import { colors, radii, spacing } from '@/theme';

const goalLabels: Record<string, string> = {
  build_muscle: 'Build muscle',
  lose_fat: 'Lose fat',
  get_stronger: 'Get stronger',
  improve_fitness: 'Feel fitter',
};

const startOfWeek = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
};

export default function DashboardScreen() {
  const { profile, userId, previewMode } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  useFocusEffect(useCallback(() => {
    if (userId) void getWorkoutSessions(userId).then(setWorkouts);
    else setWorkouts([]);
    return undefined;
  }, [userId]));
  const firstName = profile?.full_name.trim().split(/\s+/)[0] || 'Athlete';
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const weekStart = startOfWeek(new Date());
  const weeklySessions = workouts.filter((workout) => new Date(workout.completedAt) >= weekStart);
  const trainingMinutes = Math.floor(weeklySessions.reduce((total, workout) => total + workout.durationSeconds, 0) / 60);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{today.toUpperCase()}</Text>
            <Text style={styles.greeting}>Good to have you,</Text>
            <Text style={styles.name}>{firstName}<Text style={styles.nameDot}>.</Text></Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text></View>
        </View>

        {previewMode ? <View style={styles.previewNotice}><Text style={styles.previewNoticeText}>LOCAL PREVIEW · SAMPLE WORKOUT HISTORY</Text></View> : null}

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroEyebrow}>YOUR STARTING POINT</Text>
            <View style={styles.status}><View style={styles.statusDot} /><Text style={styles.statusText}>PROFILE READY</Text></View>
          </View>
          <Text style={styles.heroTitle}>Progress, made{ '\n' }personal.</Text>
          <Text style={styles.heroBody}>Your training history, weekly rhythm, and next session all start here.</Text>
          <View style={styles.heroRule} />
          <View style={styles.goalSummary}>
            <View>
              <Text style={styles.summaryLabel}>CURRENT FOCUS</Text>
              <Text style={styles.summaryValue}>{profile?.primary_goal ? goalLabels[profile.primary_goal] : 'Choose your focus'}</Text>
            </View>
            <Text style={styles.arrow}>↗</Text>
          </View>
        </View>
        <View style={styles.startButton}><PrimaryButton label="Choose a workout" onPress={() => router.push('/(tabs)/train')} /></View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>This week</Text>
          <Text style={styles.sectionMeta}>YOUR ACTIVITY</Text>
        </View>
        <View style={styles.weekCard}>
          <View style={styles.weekNumbers}>
            <View>
              <Text style={styles.bigNumber}>{String(weeklySessions.length).padStart(2, '0')}</Text>
              <Text style={styles.metricLabel}>SESSIONS</Text>
            </View>
            <View style={styles.metricDivider} />
            <View>
              <Text style={styles.bigNumber}>{trainingMinutes ? `${trainingMinutes}m` : '0m'}</Text>
              <Text style={styles.metricLabel}>TRAINING TIME</Text>
            </View>
            <View style={styles.weekTag}><Text style={styles.weekTagText}>THIS WEEK</Text></View>
          </View>
          <View style={styles.weekBars}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
              const hasWorkout = weeklySessions.some((workout) => ((new Date(workout.completedAt).getDay() + 6) % 7) === index);
              const isToday = ((new Date().getDay() + 6) % 7) === index;
              return (
              <View key={`${day}-${index}`} style={styles.dayColumn}>
                <View style={[styles.dayBar, hasWorkout && styles.dayBarActive, isToday && styles.todayBar]} />
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
            );})}
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Training log</Text>
          <Text style={styles.sectionMeta}>RECENT</Text>
        </View>
        {workouts.length ? (
          <View style={styles.recentList}>
            {workouts.slice(0, 3).map((workout, index) => (
              <View key={workout.id} style={[styles.recentRow, index === Math.min(workouts.length, 3) - 1 && styles.recentRowLast]}>
                <View style={styles.recentIcon}><Text style={styles.recentIconText}>{String(workout.sets.length).padStart(2, '0')}</Text></View>
                <View style={styles.emptyCopy}><Text style={styles.emptyTitle}>{workout.title}</Text><Text style={styles.emptyBody}>{new Date(workout.completedAt).toLocaleDateString()} · {workout.sets.length} sets</Text></View>
                <Text style={styles.recentTime}>{Math.max(1, Math.round(workout.durationSeconds / 60))}m</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>+</Text></View>
            <View style={styles.emptyCopy}><Text style={styles.emptyTitle}>A clean slate.</Text><Text style={styles.emptyBody}>Your sessions will show up here once you start logging.</Text></View>
          </View>
        )}
        <Text style={styles.bottomNote}>SMALL STEPS. STRONGER DAYS.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  previewNotice: { alignSelf: 'flex-start', borderRadius: radii.sm, backgroundColor: colors.accentDim, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 12 },
  previewNoticeText: { color: colors.accent, fontSize: 9, fontWeight: '800' },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0 },
  greeting: { color: colors.muted, fontSize: 15, marginTop: 11 },
  name: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 1 },
  nameDot: { color: colors.accent },
  avatar: { width: 42, height: 42, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accent, fontSize: 15, fontWeight: '800' },
  hero: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroEyebrow: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accentDim, borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 9 },
  statusDot: { width: 5, height: 5, borderRadius: radii.pill, backgroundColor: colors.accent },
  statusText: { color: colors.accent, fontSize: 8, fontWeight: '800', letterSpacing: 0 },
  heroTitle: { color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: '800', marginTop: 28, letterSpacing: 0 },
  heroBody: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 10, maxWidth: 285 },
  startButton: { marginTop: 14 },
  heroRule: { height: 1, backgroundColor: colors.border, marginTop: 22, marginBottom: 16 },
  goalSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0 },
  summaryValue: { color: colors.accent, fontSize: 15, fontWeight: '700', marginTop: 6 },
  arrow: { color: colors.accent, fontSize: 20 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 27, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sectionMeta: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0 },
  weekCard: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  weekNumbers: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  bigNumber: { color: colors.text, fontSize: 25, fontWeight: '800' },
  metricLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0, marginTop: 3 },
  metricDivider: { width: 1, height: 38, backgroundColor: colors.border },
  weekTag: { marginLeft: 'auto', alignSelf: 'flex-start', borderRadius: radii.sm, backgroundColor: colors.surfaceRaised, paddingVertical: 6, paddingHorizontal: 8 },
  weekTagText: { color: colors.accent, fontSize: 8, fontWeight: '800', letterSpacing: 0 },
  weekBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 62, marginTop: 18 },
  dayColumn: { alignItems: 'center', gap: 7 },
  dayBar: { width: 19, height: 28, borderRadius: 4, backgroundColor: colors.surfaceRaised },
  dayBarActive: { backgroundColor: colors.accent },
  todayBar: { backgroundColor: colors.accentDim, borderWidth: 1, borderColor: '#53752E' },
  dayLabel: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  emptyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 13 },
  recentList: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  recentRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  recentRowLast: { borderBottomWidth: 0 },
  recentIcon: { width: 34, height: 34, borderRadius: radii.sm, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  recentIconText: { color: colors.accent, fontSize: 10, fontWeight: '800' },
  recentTime: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  emptyIcon: { width: 36, height: 36, borderRadius: radii.sm, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: colors.accent, fontSize: 21, fontWeight: '400', marginTop: -2 },
  emptyCopy: { flex: 1 },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  emptyBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  bottomNote: { color: '#687067', fontSize: 9, fontWeight: '700', letterSpacing: 0, textAlign: 'center', marginTop: 26 },
});
