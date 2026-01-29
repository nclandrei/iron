// Exercise swap suggestions organized by muscle group/movement pattern
// Each exercise maps to a list of alternatives

export interface ExerciseAlternative {
  name: string;
  defaultWeight: number;
}

// Map of exercise name -> suggested alternatives
export const exerciseSwapMap: Record<string, ExerciseAlternative[]> = {
  // Chest - Horizontal Press
  'Flat BB press': [
    { name: 'DB bench press', defaultWeight: 30 },
    { name: 'Chest press machine', defaultWeight: 60 },
    { name: 'Dips', defaultWeight: 0 },
    { name: 'Incline DB press', defaultWeight: 26 },
  ],
  'Incline DB press': [
    { name: 'Incline BB press', defaultWeight: 50 },
    { name: 'Flat BB press', defaultWeight: 80 },
    { name: 'Pec fly', defaultWeight: 73 },
    { name: 'Dips', defaultWeight: 0 },
    { name: 'Assisted dips', defaultWeight: 0 },
  ],
  'Pec fly': [
    { name: 'Incline DB press', defaultWeight: 26 },
    { name: 'Cable flyes', defaultWeight: 15 },
    { name: 'Flat BB press', defaultWeight: 80 },
  ],

  // Back - Rowing
  'Cable row': [
    { name: 'BB row', defaultWeight: 70 },
    { name: 'Seated machine row', defaultWeight: 60 },
    { name: 'Single-arm DB row', defaultWeight: 30 },
    { name: 'T-bar row', defaultWeight: 40 },
  ],
  'BB row': [
    { name: 'Cable row', defaultWeight: 81 },
    { name: 'Seated machine row', defaultWeight: 60 },
    { name: 'Single-arm DB row', defaultWeight: 30 },
    { name: 'T-bar row', defaultWeight: 40 },
  ],

  // Back - Vertical Pull
  'Lat pulldown': [
    { name: 'Assisted chin-ups', defaultWeight: 20 },
    { name: 'Cable pulldown', defaultWeight: 50 },
    { name: 'Neutral grip pulldown', defaultWeight: 50 },
  ],

  // Shoulders
  'Machine lat raises': [
    { name: 'DB lat raises', defaultWeight: 10 },
    { name: 'Cable lat raises', defaultWeight: 10 },
    { name: 'Rear delt flyes', defaultWeight: 12 },
  ],

  // Biceps
  'DB curl': [
    { name: 'BB curl', defaultWeight: 22.5 },
    { name: 'Cable curl', defaultWeight: 25 },
    { name: 'Hammer curl', defaultWeight: 12 },
    { name: 'Preacher curl', defaultWeight: 20 },
  ],
  'BB curl': [
    { name: 'DB curl', defaultWeight: 16 },
    { name: 'Cable curl', defaultWeight: 25 },
    { name: 'Hammer curl', defaultWeight: 12 },
    { name: 'Preacher curl', defaultWeight: 20 },
  ],

  // Triceps
  'Overhead triceps extension': [
    { name: 'Triceps pressdown', defaultWeight: 50 },
    { name: 'Triceps extension', defaultWeight: 41 },
    { name: 'Skull crushers', defaultWeight: 25 },
    { name: 'Dips', defaultWeight: 0 },
  ],
  'Triceps overhead extension': [
    { name: 'Triceps pressdown', defaultWeight: 50 },
    { name: 'Triceps extension', defaultWeight: 41 },
    { name: 'Skull crushers', defaultWeight: 25 },
    { name: 'Dips', defaultWeight: 0 },
  ],
  'Triceps extension': [
    { name: 'Overhead triceps extension', defaultWeight: 34 },
    { name: 'Triceps overhead extension', defaultWeight: 40 },
    { name: 'Triceps pressdown', defaultWeight: 50 },
    { name: 'Dips', defaultWeight: 0 },
  ],

  // Quads - Compound
  'Front squat': [
    { name: 'Back squat', defaultWeight: 110 },
    { name: 'Leg press', defaultWeight: 255 },
    { name: 'Hack squat', defaultWeight: 100 },
    { name: 'Goblet squat', defaultWeight: 30 },
  ],
  'Back squat': [
    { name: 'Front squat', defaultWeight: 40 },
    { name: 'Leg press', defaultWeight: 255 },
    { name: 'Hack squat', defaultWeight: 100 },
    { name: 'Goblet squat', defaultWeight: 30 },
  ],
  'Leg press': [
    { name: 'Back squat', defaultWeight: 110 },
    { name: 'Front squat', defaultWeight: 40 },
    { name: 'Hack squat', defaultWeight: 100 },
    { name: 'Smith machine squat', defaultWeight: 80 },
  ],

  // Quads - Isolation
  'Leg extensions': [
    { name: 'Sissy squat', defaultWeight: 0 },
    { name: 'Walking lunges', defaultWeight: 20 },
    { name: 'Bulgarian split squat', defaultWeight: 20 },
  ],

  // Hamstrings - Compound
  'RDL': [
    { name: 'Deadlift', defaultWeight: 140 },
    { name: 'Stiff-leg deadlift', defaultWeight: 80 },
    { name: 'Good mornings', defaultWeight: 40 },
    { name: 'Hip thrust', defaultWeight: 100 },
  ],
  'Deadlift': [
    { name: 'RDL', defaultWeight: 90 },
    { name: 'Stiff-leg deadlift', defaultWeight: 80 },
    { name: 'Good mornings', defaultWeight: 40 },
    { name: 'Hip thrust', defaultWeight: 100 },
  ],

  // Hamstrings - Isolation
  'Lying curls': [
    { name: 'Seated curls', defaultWeight: 55 },
    { name: 'Standing curls', defaultWeight: 30 },
    { name: 'Nordic curls', defaultWeight: 0 },
  ],

  // Calves
  'Calf raises': [
    { name: 'Seated calf raises', defaultWeight: 60 },
    { name: 'Donkey calf raises', defaultWeight: 80 },
    { name: 'Smith machine calf raises', defaultWeight: 80 },
  ],
};

export function getSwapSuggestions(exerciseName: string): ExerciseAlternative[] {
  return exerciseSwapMap[exerciseName] || [];
}
