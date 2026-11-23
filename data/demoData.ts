import type { Profile } from '@/types/database';
import type { LoggedSet, WorkoutSession } from '@/types/workouts';

export const DEMO_USER_ID = 'apex-local-preview';

export const DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  full_name: 'Alex Morgan',
  primary_goal: 'build_muscle',
  experience_level: 'intermediate',
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function makeSet(
  id: string,
  exerciseId: string,
  exerciseName: string,
  setNumber: number,
  reps: number,
  weightKg: number,
  completedAt: string,
): LoggedSet {
  return { id, exerciseId, exerciseName, setNumber, reps, weightKg, completedAt };
}

export function createDemoSessions(now = new Date()): WorkoutSession[] {
  const sessionData = [
    {
      daysAgo: 0,
      title: 'Upper body',
      durationSeconds: 2730,
      sets: [
        ['bench-1', 'barbell-bench-press', 'Barbell bench press', 1, 10, 50],
        ['bench-2', 'barbell-bench-press', 'Barbell bench press', 2, 8, 55],
        ['bench-3', 'barbell-bench-press', 'Barbell bench press', 3, 8, 55],
        ['row-1', 'seated-cable-row', 'Seated cable row', 1, 12, 42.5],
        ['row-2', 'seated-cable-row', 'Seated cable row', 2, 10, 47.5],
        ['press-1', 'incline-dumbbell-press', 'Incline dumbbell press', 1, 10, 20],
      ] as const,
    },
    {
      daysAgo: 6,
      title: 'Lower body',
      durationSeconds: 3180,
      sets: [
        ['squat-1', 'barbell-back-squat', 'Barbell back squat', 1, 8, 60],
        ['squat-2', 'barbell-back-squat', 'Barbell back squat', 2, 8, 65],
        ['squat-3', 'barbell-back-squat', 'Barbell back squat', 3, 6, 70],
        ['rdl-1', 'romanian-deadlift', 'Romanian deadlift', 1, 10, 55],
        ['curl-1', 'lying-leg-curl', 'Lying leg curl', 1, 12, 30],
      ] as const,
    },
    {
      daysAgo: 10,
      title: 'Push day',
      durationSeconds: 2460,
      sets: [
        ['bench-4', 'barbell-bench-press', 'Barbell bench press', 1, 8, 52.5],
        ['bench-5', 'barbell-bench-press', 'Barbell bench press', 2, 8, 52.5],
        ['shoulder-1', 'dumbbell-shoulder-press', 'Dumbbell shoulder press', 1, 10, 17.5],
        ['lateral-1', 'lateral-raise', 'Lateral raise', 1, 14, 7.5],
      ] as const,
    },
    {
      daysAgo: 17,
      title: 'Pull day',
      durationSeconds: 2580,
      sets: [
        ['lat-1', 'lat-pulldown', 'Lat pulldown', 1, 10, 45],
        ['lat-2', 'lat-pulldown', 'Lat pulldown', 2, 10, 50],
        ['row-3', 'barbell-row', 'Barbell row', 1, 8, 45],
        ['curl-2', 'dumbbell-curl', 'Dumbbell curl', 1, 12, 10],
      ] as const,
    },
    {
      daysAgo: 25,
      title: 'Full body',
      durationSeconds: 3000,
      sets: [
        ['squat-4', 'barbell-back-squat', 'Barbell back squat', 1, 8, 55],
        ['bench-6', 'barbell-bench-press', 'Barbell bench press', 1, 10, 47.5],
        ['row-4', 'seated-cable-row', 'Seated cable row', 1, 12, 40],
        ['bridge-1', 'barbell-hip-thrust', 'Barbell hip thrust', 1, 10, 60],
      ] as const,
    },
    {
      daysAgo: 39,
      title: 'Lower body',
      durationSeconds: 2880,
      sets: [
        ['squat-5', 'barbell-back-squat', 'Barbell back squat', 1, 8, 50],
        ['rdl-2', 'romanian-deadlift', 'Romanian deadlift', 1, 10, 45],
        ['press-2', 'leg-press', 'Leg press', 1, 12, 100],
      ] as const,
    },
  ];

  return sessionData.map((item, sessionIndex) => {
    const completed = new Date(now);
    completed.setDate(completed.getDate() - item.daysAgo);
    completed.setHours(17, 30, 0, 0);
    const completedAt = completed.toISOString();
    const started = new Date(completed.getTime() - item.durationSeconds * 1000).toISOString();

    return {
      id: `demo-session-${sessionIndex + 1}`,
      title: item.title,
      source: 'program',
      startedAt: started,
      completedAt,
      durationSeconds: item.durationSeconds,
      sets: item.sets.map((set, setIndex) => makeSet(
        `demo-${set[0]}`,
        set[1],
        set[2],
        set[3],
        set[4],
        set[5],
        new Date(completed.getTime() - (item.sets.length - setIndex) * 60000).toISOString(),
      )),
      syncedAt: 'LOCAL PREVIEW',
    };
  });
}