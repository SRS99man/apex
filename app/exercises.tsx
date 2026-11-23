import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from '@/components/TextField';
import { exercises } from '@/data/exercises';
import type { Equipment, MuscleGroup } from '@/types/workouts';
import { colors, radii, spacing } from '@/theme';

const muscles: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' }, { value: 'back', label: 'Back' }, { value: 'shoulders', label: 'Shoulders' },
  { value: 'quads', label: 'Quads' }, { value: 'hamstrings', label: 'Hamstrings' }, { value: 'glutes', label: 'Glutes' },
  { value: 'biceps', label: 'Biceps' }, { value: 'triceps', label: 'Triceps' }, { value: 'core', label: 'Core' }, { value: 'calves', label: 'Calves' },
];

const equipmentOptions: { value: Equipment | 'all'; label: string }[] = [
  { value: 'all', label: 'Any equipment' }, { value: 'barbell', label: 'Barbell' }, { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'machine', label: 'Machine' }, { value: 'cable', label: 'Cable' }, { value: 'bodyweight', label: 'Bodyweight' },
];

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function ExerciseLibraryScreen() {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | 'all'>('all');

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return exercises.filter((exercise) => {
      const matchesQuery = !normalizedQuery || exercise.name.toLowerCase().includes(normalizedQuery) || exercise.muscles.some((item) => item.includes(normalizedQuery));
      const matchesMuscle = !muscle || exercise.muscles.includes(muscle);
      const matchesEquipment = equipment === 'all' || exercise.equipment === equipment;
      return matchesQuery && matchesMuscle && matchesEquipment;
    });
  }, [equipment, muscle, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backGlyph}>‹</Text><Text style={styles.backLabel}>TRAINING</Text></Pressable>
        <Text style={styles.eyebrow}>MOVEMENT INDEX · {exercises.length} EXERCISES</Text>
        <Text style={styles.title}>Exercise library</Text>
        <Text style={styles.subtitle}>Find a movement by name, muscle group, or equipment.</Text>
        <View style={styles.search}><TextField label="Search" value={query} onChangeText={setQuery} placeholder="Try 'row' or 'hamstrings'" returnKeyType="search" /></View>

        <Text style={styles.filterHeading}>MUSCLE GROUP</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <FilterChip label="All" selected={!muscle} onPress={() => setMuscle(null)} />
          {muscles.map((item) => <FilterChip key={item.value} label={item.label} selected={muscle === item.value} onPress={() => setMuscle(muscle === item.value ? null : item.value)} />)}
        </ScrollView>

        <Text style={styles.filterHeading}>EQUIPMENT</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {equipmentOptions.map((item) => <FilterChip key={item.value} label={item.label} selected={equipment === item.value} onPress={() => setEquipment(item.value)} />)}
        </ScrollView>

        <View style={styles.resultHeader}><Text style={styles.results}>{filteredExercises.length} movements</Text><Text style={styles.resultHint}>FILTERED</Text></View>
        <View style={styles.list}>
          {filteredExercises.map((exercise, index) => (
            <Pressable
              key={exercise.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/(tabs)/anatomy', params: { muscle: exercise.muscles[0] } })}
              style={[styles.exercise, index === filteredExercises.length - 1 && styles.exerciseLast]}
            >
              <View style={styles.exerciseMark}><Text style={styles.exerciseMarkText}>{String(index + 1).padStart(2, '0')}</Text></View>
              <View style={styles.exerciseCopy}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>{exercise.muscles.map(titleCase).join(' · ')}</Text>
              </View>
              <View style={styles.equipmentBadge}><Text style={styles.equipmentText}>{titleCase(exercise.equipment)}</Text></View>
            </Pressable>
          ))}
          {filteredExercises.length === 0 ? <Text style={styles.empty}>No matches. Try a different name or filter.</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 36 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', marginBottom: 27 },
  backGlyph: { color: colors.accent, fontSize: 25, lineHeight: 27 },
  backLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  eyebrow: { color: colors.accent, fontSize: 9, fontWeight: '800' },
  title: { color: colors.text, fontSize: 29, fontWeight: '800', marginTop: 7 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 19 },
  search: { marginBottom: 18 },
  filterHeading: { color: colors.muted, fontSize: 9, fontWeight: '800', marginTop: 5, marginBottom: 9 },
  chips: { gap: 8, paddingRight: 20, paddingBottom: 14 },
  chip: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 13, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  chipTextSelected: { color: colors.accent },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10, marginBottom: 10 },
  results: { color: colors.text, fontSize: 15, fontWeight: '700' },
  resultHint: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  list: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.surface, paddingHorizontal: 13 },
  exercise: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  exerciseLast: { borderBottomWidth: 0 },
  exerciseMark: { width: 31, height: 31, backgroundColor: colors.surfaceRaised, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  exerciseMarkText: { color: colors.accent, fontSize: 9, fontWeight: '800' },
  exerciseCopy: { flex: 1 },
  exerciseName: { color: colors.text, fontSize: 12, fontWeight: '700' },
  exerciseMeta: { color: colors.muted, fontSize: 9, marginTop: 4 },
  equipmentBadge: { backgroundColor: colors.surfaceRaised, paddingHorizontal: 7, paddingVertical: 5, borderRadius: radii.sm },
  equipmentText: { color: colors.muted, fontSize: 8, fontWeight: '700' },
  empty: { color: colors.muted, fontSize: 12, textAlign: 'center', padding: 22 },
});
