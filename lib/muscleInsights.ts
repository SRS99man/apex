import { exercises } from '@/data/exercises';
import type { MuscleGroup, WorkoutSession } from '@/types/workouts';

export type MuscleInsight = {
  muscle: MuscleGroup;
  setCount: number;
  lastTrainedAt: string | null;
  recoveryHours: number;
  status: 'fresh' | 'recovering' | 'active';
};

const muscleFromExercise = (exerciseId: string) =>
  exercises.find((exercise) => exercise.id === exerciseId)?.muscles || [];

export function getMuscleInsights(sessions: WorkoutSession[], now = new Date()): MuscleInsight[] {
  const allMuscles: MuscleGroup[] = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps', 'core', 'calves'];

  return allMuscles.map((muscle) => {
    let setCount = 0;
    let lastTrainedAt: string | null = null;

    for (const session of sessions) {
      for (const set of session.sets) {
        if (!muscleFromExercise(set.exerciseId).includes(muscle)) continue;
        setCount += 1;
        if (!lastTrainedAt || new Date(set.completedAt).getTime() > new Date(lastTrainedAt).getTime()) {
          lastTrainedAt = set.completedAt;
        }
      }
    }

    const elapsedHours = lastTrainedAt
      ? Math.max(0, (now.getTime() - new Date(lastTrainedAt).getTime()) / 3_600_000)
      : 999;
    const recoveryHours = lastTrainedAt ? Math.max(0, 48 - elapsedHours) : 0;
    const status = !lastTrainedAt || elapsedHours >= 48
      ? 'fresh'
      : elapsedHours < 24
        ? 'active'
        : 'recovering';

    return { muscle, setCount, lastTrainedAt, recoveryHours, status };
  });
}
