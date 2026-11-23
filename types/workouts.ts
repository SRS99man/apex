export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'calves';

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight';
export type WorkoutSource = 'program' | 'generated' | 'custom';

export type Exercise = {
  id: string;
  name: string;
  muscles: MuscleGroup[];
  equipment: Equipment;
  compound: boolean;
};

export type PlannedExercise = {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
};

export type WorkoutPlan = {
  id: string;
  title: string;
  focus: string;
  durationMinutes: number;
  source: WorkoutSource;
  exercises: PlannedExercise[];
};

export type LoggedSet = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  completedAt: string;
};

export type WorkoutSession = {
  id: string;
  title: string;
  source: WorkoutSource;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  sets: LoggedSet[];
  syncedAt: string | null;
};
