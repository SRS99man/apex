export type Goal = 'build_muscle' | 'lose_fat' | 'improve_fitness' | 'get_stronger';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type Profile = {
  id: string;
  full_name: string;
  primary_goal: Goal | null;
  experience_level: ExperienceLevel;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name?: string;
          primary_goal?: Goal | null;
          experience_level?: ExperienceLevel;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          primary_goal?: Goal | null;
          experience_level?: ExperienceLevel;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          source: 'program' | 'generated' | 'custom';
          started_at: string;
          completed_at: string;
          duration_seconds: number;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          title: string;
          source: 'program' | 'generated' | 'custom';
          started_at: string;
          completed_at: string;
          duration_seconds: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          source?: 'program' | 'generated' | 'custom';
          started_at?: string;
          completed_at?: string;
          duration_seconds?: number;
        };
        Relationships: [];
      };
      workout_sets: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          exercise_id: string;
          exercise_name: string;
          set_number: number;
          reps: number;
          weight_kg: number;
          completed_at: string;
        };
        Insert: {
          id: string;
          session_id: string;
          user_id: string;
          exercise_id: string;
          exercise_name: string;
          set_number: number;
          reps: number;
          weight_kg: number;
          completed_at: string;
        };
        Update: {
          exercise_name?: string;
          set_number?: number;
          reps?: number;
          weight_kg?: number;
          completed_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
