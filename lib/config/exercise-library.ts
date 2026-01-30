// Canonical list of exercises for the app
// This is the single source of truth for exercise names

export interface ExerciseDefinition {
  name: string;
  muscleGroup: string;
  defaultWeight: number;
}

export const exerciseLibrary: ExerciseDefinition[] = [
  // Chest
  { name: 'Flat BB press', muscleGroup: 'Chest', defaultWeight: 80 },
  { name: 'Incline BB press', muscleGroup: 'Chest', defaultWeight: 50 },
  { name: 'Incline DB press', muscleGroup: 'Chest', defaultWeight: 26 },
  { name: 'DB bench press', muscleGroup: 'Chest', defaultWeight: 30 },
  { name: 'Chest press machine', muscleGroup: 'Chest', defaultWeight: 60 },
  { name: 'Pec fly', muscleGroup: 'Chest', defaultWeight: 73 },
  { name: 'Cable flyes', muscleGroup: 'Chest', defaultWeight: 15 },
  { name: 'Dips', muscleGroup: 'Chest', defaultWeight: 0 },
  { name: 'Assisted dips', muscleGroup: 'Chest', defaultWeight: 0 },

  // Back - Rowing
  { name: 'Cable row', muscleGroup: 'Back', defaultWeight: 81 },
  { name: 'BB row', muscleGroup: 'Back', defaultWeight: 70 },
  { name: 'Seated machine row', muscleGroup: 'Back', defaultWeight: 60 },
  { name: 'Single-arm DB row', muscleGroup: 'Back', defaultWeight: 30 },
  { name: 'T-bar row', muscleGroup: 'Back', defaultWeight: 40 },

  // Back - Vertical Pull
  { name: 'Lat pulldown', muscleGroup: 'Back', defaultWeight: 50 },
  { name: 'Assisted chin-ups', muscleGroup: 'Back', defaultWeight: 20 },
  { name: 'Cable pulldown', muscleGroup: 'Back', defaultWeight: 50 },
  { name: 'Neutral grip pulldown', muscleGroup: 'Back', defaultWeight: 50 },
  { name: 'Pull-ups', muscleGroup: 'Back', defaultWeight: 0 },
  { name: 'Chin-ups', muscleGroup: 'Back', defaultWeight: 0 },

  // Shoulders
  { name: 'Machine lat raises', muscleGroup: 'Shoulders', defaultWeight: 10 },
  { name: 'DB lat raises', muscleGroup: 'Shoulders', defaultWeight: 10 },
  { name: 'Cable lat raises', muscleGroup: 'Shoulders', defaultWeight: 10 },
  { name: 'Rear delt flyes', muscleGroup: 'Shoulders', defaultWeight: 12 },
  { name: 'Overhead press', muscleGroup: 'Shoulders', defaultWeight: 40 },
  { name: 'DB shoulder press', muscleGroup: 'Shoulders', defaultWeight: 20 },
  { name: 'Arnold press', muscleGroup: 'Shoulders', defaultWeight: 16 },
  { name: 'Face pulls', muscleGroup: 'Shoulders', defaultWeight: 25 },

  // Biceps
  { name: 'DB curl', muscleGroup: 'Biceps', defaultWeight: 16 },
  { name: 'BB curl', muscleGroup: 'Biceps', defaultWeight: 22.5 },
  { name: 'Cable curl', muscleGroup: 'Biceps', defaultWeight: 25 },
  { name: 'Hammer curl', muscleGroup: 'Biceps', defaultWeight: 12 },
  { name: 'Preacher curl', muscleGroup: 'Biceps', defaultWeight: 20 },
  { name: 'Incline DB curl', muscleGroup: 'Biceps', defaultWeight: 10 },
  { name: 'Concentration curl', muscleGroup: 'Biceps', defaultWeight: 12 },

  // Triceps
  { name: 'Overhead triceps extension', muscleGroup: 'Triceps', defaultWeight: 34 },
  { name: 'Triceps overhead extension', muscleGroup: 'Triceps', defaultWeight: 40 },
  { name: 'Triceps pressdown', muscleGroup: 'Triceps', defaultWeight: 50 },
  { name: 'Triceps extension', muscleGroup: 'Triceps', defaultWeight: 41 },
  { name: 'Skull crushers', muscleGroup: 'Triceps', defaultWeight: 25 },
  { name: 'Close-grip bench press', muscleGroup: 'Triceps', defaultWeight: 60 },

  // Quads - Compound
  { name: 'Front squat', muscleGroup: 'Quads', defaultWeight: 40 },
  { name: 'Back squat', muscleGroup: 'Quads', defaultWeight: 110 },
  { name: 'Leg press', muscleGroup: 'Quads', defaultWeight: 255 },
  { name: 'Hack squat', muscleGroup: 'Quads', defaultWeight: 100 },
  { name: 'Goblet squat', muscleGroup: 'Quads', defaultWeight: 30 },
  { name: 'Smith machine squat', muscleGroup: 'Quads', defaultWeight: 80 },

  // Quads - Isolation
  { name: 'Leg extensions', muscleGroup: 'Quads', defaultWeight: 50 },
  { name: 'Sissy squat', muscleGroup: 'Quads', defaultWeight: 0 },
  { name: 'Walking lunges', muscleGroup: 'Quads', defaultWeight: 20 },
  { name: 'Bulgarian split squat', muscleGroup: 'Quads', defaultWeight: 20 },

  // Hamstrings - Compound
  { name: 'RDL', muscleGroup: 'Hamstrings', defaultWeight: 90 },
  { name: 'Deadlift', muscleGroup: 'Hamstrings', defaultWeight: 140 },
  { name: 'Stiff-leg deadlift', muscleGroup: 'Hamstrings', defaultWeight: 80 },
  { name: 'Good mornings', muscleGroup: 'Hamstrings', defaultWeight: 40 },
  { name: 'Hip thrust', muscleGroup: 'Hamstrings', defaultWeight: 100 },

  // Hamstrings - Isolation
  { name: 'Lying curls', muscleGroup: 'Hamstrings', defaultWeight: 50 },
  { name: 'Seated curls', muscleGroup: 'Hamstrings', defaultWeight: 55 },
  { name: 'Standing curls', muscleGroup: 'Hamstrings', defaultWeight: 30 },
  { name: 'Nordic curls', muscleGroup: 'Hamstrings', defaultWeight: 0 },

  // Calves
  { name: 'Calf raises', muscleGroup: 'Calves', defaultWeight: 60 },
  { name: 'Seated calf raises', muscleGroup: 'Calves', defaultWeight: 60 },
  { name: 'Donkey calf raises', muscleGroup: 'Calves', defaultWeight: 80 },
  { name: 'Smith machine calf raises', muscleGroup: 'Calves', defaultWeight: 80 },

  // Core
  { name: 'Plank', muscleGroup: 'Core', defaultWeight: 0 },
  { name: 'Cable crunches', muscleGroup: 'Core', defaultWeight: 40 },
  { name: 'Hanging leg raises', muscleGroup: 'Core', defaultWeight: 0 },
  { name: 'Ab wheel rollout', muscleGroup: 'Core', defaultWeight: 0 },
];

// Get all exercise names for autocomplete
export function getExerciseNames(): string[] {
  return exerciseLibrary.map((e) => e.name);
}

// Get exercise definition by name
export function getExerciseByName(name: string): ExerciseDefinition | undefined {
  return exerciseLibrary.find((e) => e.name.toLowerCase() === name.toLowerCase());
}

// Get exercises grouped by muscle group
export function getExercisesByMuscleGroup(): Record<string, ExerciseDefinition[]> {
  return exerciseLibrary.reduce(
    (acc, exercise) => {
      if (!acc[exercise.muscleGroup]) {
        acc[exercise.muscleGroup] = [];
      }
      acc[exercise.muscleGroup].push(exercise);
      return acc;
    },
    {} as Record<string, ExerciseDefinition[]>
  );
}

// Search exercises by name (case-insensitive partial match)
export function searchExercises(query: string): ExerciseDefinition[] {
  const lowerQuery = query.toLowerCase();
  return exerciseLibrary.filter((e) => e.name.toLowerCase().includes(lowerQuery));
}
