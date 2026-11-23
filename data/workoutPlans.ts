import type { Goal, ExperienceLevel } from '@/types/database';
import type { Exercise, MuscleGroup, PlannedExercise, WorkoutPlan, WorkoutSource } from '@/types/workouts';

const templates: WorkoutPlan[] = [
  {
    id: 'upper-foundation', title: 'Upper body', focus: 'CHEST · BACK · ARMS', durationMinutes: 45, source: 'program',
    exercises: [
      { exerciseId: 'barbell-bench-press', exerciseName: 'Barbell bench press', targetSets: 3, targetReps: 8, restSeconds: 90 },
      { exerciseId: 'lat-pulldown', exerciseName: 'Lat pulldown', targetSets: 3, targetReps: 10, restSeconds: 75 },
      { exerciseId: 'incline-dumbbell-press', exerciseName: 'Incline dumbbell press', targetSets: 3, targetReps: 10, restSeconds: 75 },
      { exerciseId: 'seated-cable-row', exerciseName: 'Seated cable row', targetSets: 3, targetReps: 10, restSeconds: 75 },
      { exerciseId: 'dumbbell-curl', exerciseName: 'Dumbbell curl', targetSets: 2, targetReps: 12, restSeconds: 60 },
      { exerciseId: 'cable-triceps-pressdown', exerciseName: 'Cable triceps pressdown', targetSets: 2, targetReps: 12, restSeconds: 60 },
    ],
  },
  {
    id: 'lower-foundation', title: 'Lower body', focus: 'LEGS · GLUTES · CORE', durationMinutes: 45, source: 'program',
    exercises: [
      { exerciseId: 'barbell-back-squat', exerciseName: 'Barbell back squat', targetSets: 3, targetReps: 8, restSeconds: 120 },
      { exerciseId: 'romanian-deadlift', exerciseName: 'Romanian deadlift', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { exerciseId: 'leg-press', exerciseName: 'Leg press', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { exerciseId: 'lying-leg-curl', exerciseName: 'Lying leg curl', targetSets: 3, targetReps: 12, restSeconds: 75 },
      { exerciseId: 'standing-calf-raise', exerciseName: 'Standing calf raise', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { exerciseId: 'plank', exerciseName: 'Plank', targetSets: 3, targetReps: 30, restSeconds: 60 },
    ],
  },
  {
    id: 'push-foundation', title: 'Push day', focus: 'CHEST · SHOULDERS · TRICEPS', durationMinutes: 40, source: 'program',
    exercises: [
      { exerciseId: 'barbell-bench-press', exerciseName: 'Barbell bench press', targetSets: 4, targetReps: 8, restSeconds: 90 },
      { exerciseId: 'dumbbell-shoulder-press', exerciseName: 'Dumbbell shoulder press', targetSets: 3, targetReps: 10, restSeconds: 75 },
      { exerciseId: 'incline-dumbbell-press', exerciseName: 'Incline dumbbell press', targetSets: 3, targetReps: 10, restSeconds: 75 },
      { exerciseId: 'lateral-raise', exerciseName: 'Lateral raise', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { exerciseId: 'cable-triceps-pressdown', exerciseName: 'Cable triceps pressdown', targetSets: 3, targetReps: 12, restSeconds: 60 },
    ],
  },
  {
    id: 'pull-foundation', title: 'Pull day', focus: 'BACK · REAR DELTS · BICEPS', durationMinutes: 40, source: 'program',
    exercises: [
      { exerciseId: 'lat-pulldown', exerciseName: 'Lat pulldown', targetSets: 4, targetReps: 10, restSeconds: 90 },
      { exerciseId: 'barbell-row', exerciseName: 'Barbell row', targetSets: 3, targetReps: 8, restSeconds: 90 },
      { exerciseId: 'seated-cable-row', exerciseName: 'Seated cable row', targetSets: 3, targetReps: 10, restSeconds: 75 },
      { exerciseId: 'face-pull', exerciseName: 'Face pull', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { exerciseId: 'dumbbell-curl', exerciseName: 'Dumbbell curl', targetSets: 3, targetReps: 12, restSeconds: 60 },
    ],
  },
  {
    id: 'legs-foundation', title: 'Leg day', focus: 'QUADS · HAMSTRINGS · GLUTES', durationMinutes: 45, source: 'program',
    exercises: [
      { exerciseId: 'barbell-back-squat', exerciseName: 'Barbell back squat', targetSets: 4, targetReps: 8, restSeconds: 120 },
      { exerciseId: 'hip-thrust', exerciseName: 'Barbell hip thrust', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { exerciseId: 'leg-extension', exerciseName: 'Leg extension', targetSets: 3, targetReps: 12, restSeconds: 60 },
      { exerciseId: 'lying-leg-curl', exerciseName: 'Lying leg curl', targetSets: 3, targetReps: 12, restSeconds: 75 },
      { exerciseId: 'dumbbell-lunge', exerciseName: 'Dumbbell lunge', targetSets: 3, targetReps: 10, restSeconds: 75 },
    ],
  },
];

export const workoutPrograms = templates;

const goalMuscles: Record<Goal, MuscleGroup[]> = {
  build_muscle: ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps'],
  lose_fat: ['quads', 'glutes', 'back', 'chest', 'core'],
  improve_fitness: ['quads', 'glutes', 'back', 'chest', 'core'],
  get_stronger: ['quads', 'glutes', 'back', 'chest', 'shoulders'],
};

export function generateWorkout(exercises: Exercise[], goal: Goal, experience: ExperienceLevel): WorkoutPlan {
  const focusMuscles = goalMuscles[goal];
  const pool = exercises.filter((exercise) => exercise.compound && exercise.muscles.some((muscle) => focusMuscles.includes(muscle)));
  const selected: Exercise[] = [];
  const covered = new Set<MuscleGroup>();

  for (const exercise of pool) {
    const uncovered = exercise.muscles.some((muscle) => focusMuscles.includes(muscle) && !covered.has(muscle));
    if (!uncovered || selected.length >= 5) continue;
    selected.push(exercise);
    exercise.muscles.forEach((muscle) => covered.add(muscle));
  }

  const sets = experience === 'beginner' ? 2 : 3;
  const planned: PlannedExercise[] = selected.map((exercise) => ({
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    targetSets: sets,
    targetReps: 10,
    restSeconds: 75,
  }));

  return {
    id: `generated-${Date.now()}`,
    title: 'Your focused session',
    focus: focusMuscles.slice(0, 3).map((muscle) => muscle.toUpperCase()).join(' · '),
    durationMinutes: planned.length * 8,
    source: 'generated' satisfies WorkoutSource,
    exercises: planned,
  };
}
