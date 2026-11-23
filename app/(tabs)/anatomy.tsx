import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { anatomyById, anatomyMuscles } from '@/data/anatomy';
import { exercises } from '@/data/exercises';
import { useAuth } from '@/contexts/AuthContext';
import { getWorkoutSessions } from '@/lib/workoutStorage';
import { getMuscleInsights } from '@/lib/muscleInsights';
import type { MuscleGroup, WorkoutSession } from '@/types/workouts';
import { colors, radii, spacing } from '@/theme';

const validMuscles = new Set(anatomyMuscles.map((muscle) => muscle.id));

export default function AnatomyScreen() {
  const params = useLocalSearchParams<{ muscle?: string }>();
  const initialMuscle = typeof params.muscle === 'string' && validMuscles.has(params.muscle as MuscleGroup)
    ? params.muscle as MuscleGroup
    : 'chest';
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>(initialMuscle);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const { userId } = useAuth();

  useFocusEffect(useCallback(() => {
    if (!userId) {
      setWorkouts([]);
      return undefined;
    }
    void getWorkoutSessions(userId).then(setWorkouts);
    return undefined;
  }, [userId]));

  const insights = useMemo(() => getMuscleInsights(workouts), [workouts]);
  const selectedInsight = insights.find((item) => item.muscle === selectedMuscle);
  const selectedAnatomy = anatomyById[selectedMuscle];
  const selectedExercises = exercises.filter((exercise) => exercise.muscles.includes(selectedMuscle));
  const highestSetCount = Math.max(1, ...insights.map((item) => item.setCount));

  const heatColor = (muscle: MuscleGroup) => {
    const insight = insights.find((item) => item.muscle === muscle);
    if (!insight || insight.setCount === 0) return colors.surfaceRaised;
    if (insight.status === 'active') return '#E6FF80';
    if (insight.status === 'recovering') return '#AFCF5A';
    return '#668A3A';
  };

  const muscleStatus = (muscle: MuscleGroup) => {
    const insight = insights.find((item) => item.muscle === muscle);
    if (!insight || insight.setCount === 0) return 'No recent sets';
    if (insight.status === 'active') return 'Training load · 24h';
    if (insight.status === 'recovering') return `${Math.ceil(insight.recoveryHours)}h recovery left`;
    return 'Ready to train';
  };

  const openReference = async () => {
    await Linking.openURL(selectedAnatomy.referenceUrl).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PHASE 04 · ANATOMY</Text>
            <Text style={styles.title}>Muscle map</Text>
          </View>
          <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>HEATMAP</Text></View>
        </View>

        <View style={styles.mapPanel}>
          <View style={styles.mapLegend}>
            <Text style={styles.legendTitle}>TRAINING LOAD</Text>
            <View style={styles.legendScale}>
              {['fresh', 'recent', 'active'].map((label, index) => (
                <View key={label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: index === 0 ? '#668A3A' : index === 1 ? '#AFCF5A' : '#E6FF80' }]} />
                  <Text style={styles.legendLabel}>{label.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bodyViews}>
            <BodyView
              label="FRONT"
              selectedMuscle={selectedMuscle}
              onSelect={setSelectedMuscle}
              heatColor={heatColor}
              front
            />
            <BodyView
              label="BACK"
              selectedMuscle={selectedMuscle}
              onSelect={setSelectedMuscle}
              heatColor={heatColor}
            />
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Selected muscle</Text>
          <Text style={styles.sectionMeta}>{muscleStatus(selectedMuscle)}</Text>
        </View>
        <View style={styles.detailPanel}>
          <View style={styles.detailTop}>
            <View>
              <Text style={styles.detailName}>{selectedAnatomy.name}</Text>
              <Text style={styles.detailFunction}>{selectedAnatomy.function}</Text>
            </View>
            <View style={[styles.intensityBadge, { backgroundColor: heatColor(selectedMuscle) }]}>
              <Text style={styles.intensityText}>{selectedInsight?.setCount || 0}</Text>
              <Text style={styles.intensityLabel}>SETS</Text>
            </View>
          </View>
          <View style={styles.cuePanel}>
            <Text style={styles.cueLabel}>MOVEMENT CUE</Text>
            <Text style={styles.cueText}>{selectedAnatomy.visualCue}</Text>
          </View>
          <Pressable accessibilityRole="link" onPress={() => void openReference()} style={styles.referenceButton}>
            <Text style={styles.referenceLabel}>EXERCISE REFERENCE</Text>
            <Text style={styles.referenceArrow}>↗</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <Text style={styles.sectionMeta}>{selectedExercises.length} MOVEMENTS</Text>
        </View>
        <View style={styles.exercisePanel}>
          {selectedExercises.map((exercise, index) => (
            <View key={exercise.id} style={[styles.exerciseRow, index === selectedExercises.length - 1 && styles.exerciseRowLast]}>
              <View style={styles.exerciseMark}><Text style={styles.exerciseMarkText}>{String(index + 1).padStart(2, '0')}</Text></View>
              <View style={styles.exerciseCopy}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>{exercise.equipment.toUpperCase()} · {exercise.compound ? 'COMPOUND' : 'ISOLATION'}</Text>
              </View>
              <Pressable
                accessibilityRole="link"
                onPress={() => void Linking.openURL(anatomyById[exercise.muscles[0]].referenceUrl).catch(() => undefined)}
                style={styles.exerciseReference}
              >
                <Text style={styles.exerciseReferenceText}>REFERENCE</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.note}>HEATMAPS USE COMPLETED SETS FROM YOUR LOCAL / SYNCED SESSION HISTORY.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type BodyViewProps = {
  label: string;
  selectedMuscle: MuscleGroup;
  onSelect: (muscle: MuscleGroup) => void;
  heatColor: (muscle: MuscleGroup) => string;
  front?: boolean;
};

function BodyView({ label, selectedMuscle, onSelect, heatColor, front = false }: BodyViewProps) {
  const frontZones: { muscle: MuscleGroup; style: object }[] = [
    { muscle: 'chest', style: { left: '22%', top: '23%', width: '56%', height: '15%' } },
    { muscle: 'shoulders', style: { left: '7%', top: '20%', width: '86%', height: '10%' } },
    { muscle: 'biceps', style: { left: '4%', top: '34%', width: '20%', height: '23%' } },
    { muscle: 'triceps', style: { left: '76%', top: '34%', width: '20%', height: '23%' } },
    { muscle: 'core', style: { left: '36%', top: '39%', width: '28%', height: '20%' } },
    { muscle: 'quads', style: { left: '24%', top: '61%', width: '52%', height: '24%' } },
    { muscle: 'calves', style: { left: '28%', top: '86%', width: '44%', height: '10%' } },
  ];

  const backZones: { muscle: MuscleGroup; style: object }[] = [
    { muscle: 'shoulders', style: { left: '7%', top: '20%', width: '86%', height: '10%' } },
    { muscle: 'back', style: { left: '28%', top: '29%', width: '44%', height: '27%' } },
    { muscle: 'triceps', style: { left: '6%', top: '34%', width: '19%', height: '23%' } },
    { muscle: 'biceps', style: { left: '75%', top: '34%', width: '19%', height: '23%' } },
    { muscle: 'glutes', style: { left: '31%', top: '55%', width: '38%', height: '13%' } },
    { muscle: 'hamstrings', style: { left: '25%', top: '68%', width: '50%', height: '18%' } },
    { muscle: 'calves', style: { left: '28%', top: '86%', width: '44%', height: '10%' } },
  ];

  const zones = front ? frontZones : backZones;

  return (
    <View style={styles.bodyView}>
      <Text style={styles.bodyLabel}>{label}</Text>
      <View style={styles.silhouette}>
        <View style={[styles.head, selectedMuscle === 'back' && !front && styles.zoneSelected]} />
        {zones.map((zone) => (
          <Pressable
            key={zone.muscle}
            accessibilityRole="button"
            accessibilityLabel={`Select ${anatomyById[zone.muscle].name}`}
            onPress={() => onSelect(zone.muscle)}
            style={[
              styles.zone,
              zone.style as object,
              { backgroundColor: selectedMuscle === zone.muscle ? colors.accent : heatColor(zone.muscle) },
              selectedMuscle === zone.muscle && styles.zoneSelected,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 7 },
  headerBadge: { borderRadius: radii.pill, backgroundColor: colors.accentDim, paddingHorizontal: 10, paddingVertical: 7 },
  headerBadgeText: { color: colors.accent, fontSize: 8, fontWeight: '800' },
  mapPanel: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 12 },
  mapLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
  legendTitle: { color: colors.muted, fontSize: 8, fontWeight: '800' },
  legendScale: { flexDirection: 'row', gap: 9 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: radii.pill },
  legendLabel: { color: colors.muted, fontSize: 7, fontWeight: '700' },
  bodyViews: { height: 330, flexDirection: 'row', gap: 8, paddingTop: 8 },
  bodyView: { flex: 1, alignItems: 'center' },
  bodyLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', marginBottom: 5 },
  silhouette: { width: 128, height: 300, position: 'relative' },
  head: { position: 'absolute', width: 38, height: 38, borderRadius: 19, backgroundColor: '#3A4038', left: 45, top: 8 },
  zone: { position: 'absolute', borderRadius: 10, borderWidth: 1, borderColor: '#5D6659', opacity: 0.96 },
  zoneSelected: { borderWidth: 2, borderColor: colors.text },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginTop: 24, marginBottom: 11 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sectionMeta: { color: colors.muted, fontSize: 8, fontWeight: '700', textAlign: 'right' },
  detailPanel: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  detailTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailName: { color: colors.text, fontSize: 20, fontWeight:'800' },
  detailFunction: { flexShrink: 1, maxWidth: 240, color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  intensityBadge: { marginLeft: 'auto', width: 54, height: 54, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  intensityText: { color: colors.background, fontSize: 15, fontWeight: '900' },
  intensityLabel: { color: colors.background, fontSize: 7, fontWeight: '800', marginTop: 2 },
  cuePanel: { marginTop: 16, borderLeftWidth: 2, borderLeftColor: colors.accent, backgroundColor: colors.surfaceRaised, padding: 12 },
  cueLabel: { color: colors.accent, fontSize: 8, fontWeight: '800' },
  cueText: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 6 },
  referenceButton: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 14, paddingTop: 10 },
  referenceLabel: { color: colors.accent, fontSize: 9, fontWeight: '800' },
  referenceArrow: { color: colors.accent, fontSize: 18 },
  exercisePanel: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  exerciseRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  exerciseRowLast: { borderBottomWidth: 0 },
  exerciseMark: { width: 32, height: 32, borderRadius: radii.sm, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  exerciseMarkText: { color: colors.accent, fontSize: 9, fontWeight: '800' },
  exerciseCopy: { flex: 1, minWidth: 0 },
  exerciseName: { color: colors.text, fontSize: 12, fontWeight: '700' },
  exerciseMeta: { color: colors.muted, fontSize: 8, marginTop: 5 },
  exerciseReference: { borderRadius: radii.sm, backgroundColor: colors.accentDim, paddingHorizontal: 7, paddingVertical: 7 },
  exerciseReferenceText: { color: colors.accent, fontSize: 7, fontWeight: '800' },
  note: { color: colors.muted, fontSize: 8, fontWeight: '700', textAlign: 'center', marginTop: 22 },
});
