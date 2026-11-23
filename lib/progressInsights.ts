import type { WorkoutSession } from '@/types/workouts';

export type ProgressPeriod = '4w' | '12w' | 'all';

export type ProgressRecord = {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  completedAt: string;
};

export type ProgressInsights = {
  sessions: number;
  sets: number;
  volumeKg: number;
  durationSeconds: number;
  weeklyVolume: { label: string; volumeKg: number }[];
  records: ProgressRecord[];
};

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function roundVolume(value: number): number {
  return Math.round(value * 10) / 10;
}

export function getProgressInsights(
  sessions: WorkoutSession[],
  period: ProgressPeriod,
  now = new Date(),
): ProgressInsights {
  const currentWeek = startOfWeek(now);
  const periodStart = period === 'all' ? null : new Date(currentWeek);
  if (periodStart && period === '4w') periodStart.setDate(periodStart.getDate() - 21);
  if (periodStart && period === '12w') periodStart.setDate(periodStart.getDate() - 77);

  const filteredSessions = sessions.filter((session) => {
    const completedAt = new Date(session.completedAt);
    return !periodStart || completedAt >= periodStart;
  });
  const weeklyVolume = Array.from({ length: 8 }, (_, index) => {
    const week = new Date(currentWeek);
    week.setDate(week.getDate() - (7 * (7 - index)));
    const nextWeek = new Date(week);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const volumeKg = sessions.reduce((total, session) => {
      const completedAt = new Date(session.completedAt);
      if (completedAt < week || completedAt >= nextWeek) return total;
      return total + session.sets.reduce((setTotal, set) => setTotal + set.weightKg * set.reps, 0);
    }, 0);

    return {
      label: week.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      volumeKg: roundVolume(volumeKg),
    };
  });

  const bestByExercise = new Map<string, ProgressRecord>();
  for (const session of filteredSessions) {
    for (const set of session.sets) {
      const record = bestByExercise.get(set.exerciseId);
      if (!record || set.weightKg > record.weightKg || (set.weightKg === record.weightKg && set.reps > record.reps)) {
        bestByExercise.set(set.exerciseId, {
          exerciseId: set.exerciseId,
          exerciseName: set.exerciseName,
          weightKg: set.weightKg,
          reps: set.reps,
          completedAt: set.completedAt,
        });
      }
    }
  }

  const sets = filteredSessions.reduce((total, session) => total + session.sets.length, 0);
  const volumeKg = filteredSessions.reduce(
    (total, session) => total + session.sets.reduce((setTotal, set) => setTotal + set.weightKg * set.reps, 0),
    0,
  );

  return {
    sessions: filteredSessions.length,
    sets,
    volumeKg: roundVolume(volumeKg),
    durationSeconds: filteredSessions.reduce((total, session) => total + session.durationSeconds, 0),
    weeklyVolume,
    records: [...bestByExercise.values()].sort((first, second) =>
      second.weightKg - first.weightKg || second.reps - first.reps || first.exerciseName.localeCompare(second.exerciseName),
    ),
  };
}