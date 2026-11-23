import type { MuscleGroup } from '@/types/workouts';

export type AnatomyMuscle = {
  id: MuscleGroup;
  name: string;
  shortName: string;
  function: string;
  visualCue: string;
  referenceUrl: string;
};

export const anatomyMuscles: AnatomyMuscle[] = [
  { id: 'chest', name: 'Chest', shortName: 'Chest', function: 'Pushes the arm forward and across the body.', visualCue: 'Keep shoulders down and control the lowering phase.', referenceUrl: 'https://exrx.net/Lists/ExList/Chest' },
  { id: 'back', name: 'Back', shortName: 'Back', function: 'Moves the arm behind the body and stabilizes the spine.', visualCue: 'Set your shoulder blades before pulling.', referenceUrl: 'https://exrx.net/Lists/ExList/Back' },
  { id: 'shoulders', name: 'Shoulders', shortName: 'Shoulders', function: 'Raises and rotates the arm in multiple directions.', visualCue: 'Keep elbows in a comfortable range and avoid shrugging.', referenceUrl: 'https://exrx.net/Lists/ExList/ShouldWt' },
  { id: 'quads', name: 'Quadriceps', shortName: 'Quads', function: 'Straightens the knee and supports squatting and lunging.', visualCue: 'Track the knee with the toes and control depth.', referenceUrl: 'https://exrx.net/Lists/ExList/Thigh' },
  { id: 'hamstrings', name: 'Hamstrings', shortName: 'Hamstrings', function: 'Bends the knee and extends the hip.', visualCue: 'Hinge from the hips without rounding the lower back.', referenceUrl: 'https://exrx.net/Lists/ExList/Hamstrings' },
  { id: 'glutes', name: 'Glutes', shortName: 'Glutes', function: 'Extends and externally rotates the hip.', visualCue: 'Brace before each rep and finish without leaning back.', referenceUrl: 'https://exrx.net/Lists/ExList/Hips' },
  { id: 'biceps', name: 'Biceps', shortName: 'Biceps', function: 'Bends the elbow and assists forearm rotation.', visualCue: 'Keep the upper arm still and avoid swinging.', referenceUrl: 'https://exrx.net/Lists/ExList/ArmWt' },
  { id: 'triceps', name: 'Triceps', shortName: 'Triceps', function: 'Straightens the elbow during pressing and extension.', visualCue: 'Keep the elbows facing forward and extend fully.', referenceUrl: 'https://exrx.net/Lists/ExList/ArmWt' },
  { id: 'core', name: 'Core', shortName: 'Core', function: 'Resists extension, rotation, and lateral movement.', visualCue: 'Keep ribs down and breathe without losing brace.', referenceUrl: 'https://exrx.net/Lists/ExList/Back' },
  { id: 'calves', name: 'Calves', shortName: 'Calves', function: 'Points the ankle and supports walking and jumping.', visualCue: 'Pause at full height and control the stretch.', referenceUrl: 'https://exrx.net/Lists/ExList/Gastroc' },
];

export const anatomyById = Object.fromEntries(anatomyMuscles.map((muscle) => [muscle.id, muscle])) as Record<MuscleGroup, AnatomyMuscle>;
