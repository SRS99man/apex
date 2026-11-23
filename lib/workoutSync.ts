import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getWorkoutSessions, saveWorkoutSession } from '@/lib/workoutStorage';

export async function syncWorkoutSessions(userId: string): Promise<{ synced: number; failed: number }> {
  if (!isSupabaseConfigured) return { synced: 0, failed: 0 };

  const pending = (await getWorkoutSessions(userId)).filter((workout) => !workout.syncedAt);
  let synced = 0;
  let failed = 0;

  for (const workout of pending) {
    try {
      const { error: sessionError } = await supabase.from('workout_sessions').upsert({
        id: workout.id,
        user_id: userId,
        title: workout.title,
        source: workout.source,
        started_at: workout.startedAt,
        completed_at: workout.completedAt,
        duration_seconds: workout.durationSeconds,
      }, { onConflict: 'id' });

      if (sessionError) {
        failed += 1;
        continue;
      }

      if (workout.sets.length) {
        const { error: setsError } = await supabase.from('workout_sets').upsert(workout.sets.map((set) => ({
          id: set.id,
          session_id: workout.id,
          user_id: userId,
          exercise_id: set.exerciseId,
          exercise_name: set.exerciseName,
          set_number: set.setNumber,
          reps: set.reps,
          weight_kg: set.weightKg,
          completed_at: set.completedAt,
        })), { onConflict: 'id' });

        if (setsError) {
          failed += 1;
          continue;
        }
      }

      await saveWorkoutSession(userId, { ...workout, syncedAt: new Date().toISOString() });
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
}
