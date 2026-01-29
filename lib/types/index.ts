export interface Workout {
  id: number;
  name: string;
  dayOfWeek: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: number;
  workoutId: number;
  orderIndex: number;
  name: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  defaultWeight: number;
}

export interface WorkoutLog {
  id: number;
  workoutId: number;
  exerciseId: number;
  loggedAt: Date;
  setNumber: number;
  reps: number;
  weight: number;
  exerciseName?: string; // Snapshot of exercise name at log time
  grip?: string | null; // Grip used for this set (for exercises with grip variations)
}

export interface WorkoutWithExercises extends Workout {
  exercises: Exercise[];
}

export interface SetLogInput {
  exerciseId: number;
  workoutId: number;
  setNumber: number;
  reps: number;
  weight: number;
  grip?: string | null; // Grip used for this set
}

export interface ExerciseWithLastLog extends Exercise {
  lastReps?: number;
  lastWeight?: number;
}

export interface ExerciseProgress {
  exerciseId: number;
  completedSets: number;
  targetSetsCompleted: boolean;
  lastSetNumber: number;
}

export interface TemporarySwap {
  originalExerciseId: number;
  swappedName: string;
  swappedDefaultWeight: number;
}

export interface WorkoutSession {
  workoutId: number;
  exerciseIndex: number;
  currentSet: number;
  extraSetUsed: boolean;
  totalSetsLogged: number;
  firstSetTime: string | null;
  lastSetTime: string | null;
  sessionDate: string;
  exerciseProgress: [number, ExerciseProgress][];
  startedAt: string | null; // ISO timestamp when workout was started
  temporarySwaps?: TemporarySwap[]; // Swaps that only apply to this session
  currentGrips?: Record<number, string>; // exerciseId -> current grip for this session
}
