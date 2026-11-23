import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { getWorkoutSessions } from '@/lib/workoutStorage';
import { getProgressInsights, type ProgressPeriod } from '@/lib/progressInsights';
import type { WorkoutSession } from '@/types/workouts';
import { colors, radii, spacing } from '@/theme';

const periods: { value: ProgressPeriod; label: string }[] = [
  { value: '4w', label: '4 WEEKS' },
  { value: '12w', label: '12 WEEKS' },
  { value: 'all', label: 'ALL TIME' },
];

const formatNumber = (value: number) => Math.round(value).toLocaleString();
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

export default function ProgressScreen() {
  const { userId, previewMode } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [period, setPeriod] = useState<ProgressPeriod>('12w');

  useFocusEffect(useCallback(() => {
    if (!userId) {
      setWorkouts([]);
      return undefined;
    }
    void getWorkoutSessions(userId).then(setWorkouts);
    return undefined;
  }, [userId]));

  const insights = getProgressInsights(workouts, period);
  const maxWeeklyVolume = Math.max(1, ...insights.weeklyVolume.map((week) => week.volumeKg));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PHASE 03 · YOUR TRAINING</Text>
            <Text style={styles.title}>Progress</Text>
          </View>
          <Text style={styles.headerMark}>↗</Text>
        </View>

        {previewMode ? <View style={styles.previewNotice}><Text style={styles.previewNoticeText}>DEMO HISTORY · LOCAL ONLY</Text></View> : null}

        <View style={styles.periodControl} accessibilityRole="tablist">
          {periods.map((option) => {
            const selected = period === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setPeriod(option.value)}
                style={[styles.periodButton, selected && styles.periodButtonSelected]}
              >
                <Text style={[styles.periodLabel, selected && styles.periodLabelSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.summaryPanel}>
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{insights.sessions}</Text>
              <Text style={styles.metricLabel}>SESSIONS</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{formatNumber(insights.volumeKg)}<Text style={styles.metricUnit}> kg</Text></Text>
              <Text style={styles.metricLabel}>TOTAL VOLUME</Text>
            </View>
          </View>
          <View style={[styles.metricRow, styles.metricRowBottom]}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{insights.sets}</Text>
              <Text style={styles.metricLabel}>SETS LOGGED</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{formatDuration(insights.durationSeconds)}</Text>
              <Text style={styles.metricLabel}>TIME TRAINING</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Weekly volume</Text>
          <Text style={styles.sectionMeta}>LAST 8 WEEKS · KG × REPS</Text>
        </View>
        <View style={styles.chartPanel}>
          <View style={styles.chartValues}>
            {insights.weeklyVolume.map((week, index) => (
              <View key={`${week.label}-${index}`} style={styles.chartColumn}>
                <Text style={styles.chartValue}>{week.volumeKg ? formatNumber(week.volumeKg) : '–'}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${Math.max(4, (week.volumeKg / maxWeeklyVolume) * 100)}%` },
                      index === insights.weeklyVolume.length - 1 && styles.barCurrent,
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{week.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Best logged sets</Text>
          <Text style={styles.sectionMeta}>{insights.records.length} MOVEMENTS</Text>
        </View>
        {insights.records.length ? (
          <View style={styles.recordsPanel}>
            {insights.records.slice(0, 8).map((record, index) => (
              <View key={record.exerciseId} style={[styles.recordRow, index === Math.min(insights.records.length, 8) - 1 && styles.recordRowLast]}>
                <Text style={styles.recordRank}>{String(index + 1).padStart(2, '0')}</Text>
                <View style={styles.recordCopy}>
                  <Text style={styles.recordName} numberOfLines={1}>{record.exerciseName}</Text>
                  <Text style={styles.recordDate}>{new Date(record.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <Text style={styles.recordLoad}>{record.weightKg ? `${record.weightKg} kg` : 'Bodyweight'}<Text style={styles.recordReps}> × {record.reps}</Text></Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Your first data point is one workout away.</Text>
            <Text style={styles.emptyBody}>Log completed sets to see volume trends and your strongest entries here.</Text>
          </View>
        )}
        <Text style={styles.note}>VOLUME = REPS × LOGGED WEIGHT. BODYWEIGHT IS NOT INCLUDED.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 8 },
  headerMark: { color: colors.accent, fontSize: 25, fontWeight: '700' },
  previewNotice: { alignSelf: 'flex-start', borderRadius: radii.sm, backgroundColor: colors.accentDim, paddingHorizontal: 10, paddingVertical: 7, marginTop: -10, marginBottom: 14 },
  previewNoticeText: { color: colors.accent, fontSize: 9, fontWeight: '800' },
  periodControl: { flexDirection: 'row', padding: 4, borderRadius: radii.sm, backgroundColor: colors.surfaceRaised, marginBottom: 16 },
  periodButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  periodButtonSelected: { backgroundColor: colors.accent },
  periodLabel: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  periodLabelSelected: { color: colors.background },
  summaryPanel: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  metricRow: { minHeight: 92, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  metricRowBottom: { borderBottomWidth: 0 },
  metric: { flex: 1, justifyContent: 'center' },
  metricValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  metricUnit: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  metricLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 5 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginTop: 27, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sectionMeta: { color: colors.muted, fontSize: 8, fontWeight: '700', textAlign: 'right' },
  chartPanel: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingTop: 15, paddingBottom: 12 },
  chartValues: { height: 150, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-between', gap: 5 },
  chartColumn: { flex: 1, alignItems: 'center', minWidth: 0 },
  chartValue: { color: colors.muted, fontSize: 8, fontWeight: '600', height: 14 },
  barTrack: { width: '100%', maxWidth: 24, flex: 1, justifyContent: 'flex-end', overflow: 'hidden', backgroundColor: colors.surfaceRaised, borderRadius: 4, marginTop: 5 },
  bar: { width: '100%', minHeight: 3, backgroundColor: '#769C48', borderRadius: 4 },
  barCurrent: { backgroundColor: colors.accent },
  chartLabel: { color: colors.muted, fontSize: 8, marginTop: 6 },
  recordsPanel: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  recordRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  recordRowLast: { borderBottomWidth: 0 },
  recordRank: { width: 25, color: colors.accent, fontSize: 11, fontWeight: '800' },
  recordCopy: { flex: 1, minWidth: 0 },
  recordName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  recordDate: { color: colors.muted, fontSize: 10, marginTop: 4 },
  recordLoad: { color: colors.text, fontSize: 12, fontWeight: '700' },
  recordReps: { color: colors.muted, fontWeight: '500' },
  emptyState: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  emptyBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  note: { color: colors.muted, fontSize: 8, fontWeight: '700', textAlign: 'center', marginTop: 22 },
});