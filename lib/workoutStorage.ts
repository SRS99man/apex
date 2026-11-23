import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDemoSessions, DEMO_USER_ID } from '@/data/demoData';
import type { LoggedSet, WorkoutPlan, WorkoutSession } from '@/types/workouts';

const sessionsKey = (userId: string) => `@apex/workout-sessions/v1/${userId}`;
const draftKey = (userId: string) => `@apex/workout-draft/v1/${userId}`;

export type WorkoutDraft = {
  plan: WorkoutPlan;
  startedAt: string;
  sets?: LoggedSet[];
};

export async function getWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(sessionsKey(userId));
    if (raw) return JSON.parse(raw) as WorkoutSession[];
    return userId === DEMO_USER_ID ? createDemoSessions() : [];
  } catch {
    return userId === DEMO_USER_ID ? createDemoSessions() : [];
  }
}

export async function saveWorkoutSession(userId: string, session: WorkoutSession): Promise<void> {
  const sessions = await getWorkoutSessions(userId);
  const next = [session, ...sessions.filter((item) => item.id !== session.id)];
  await AsyncStorage.setItem(sessionsKey(userId), JSON.stringify(next));
}

export async function saveWorkoutDraft(userId: string, draft: WorkoutDraft): Promise<void> {
  await AsyncStorage.setItem(draftKey(userId), JSON.stringify(draft));
}

export async function getWorkoutDraft(userId: string): Promise<WorkoutDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(draftKey(userId));
    return raw ? JSON.parse(raw) as WorkoutDraft : null;
  } catch {
    return null;
  }
}

export async function clearWorkoutDraft(userId: string): Promise<void> {
  await AsyncStorage.removeItem(draftKey(userId));
}
