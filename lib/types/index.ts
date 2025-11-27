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
}

export interface ExerciseWithLastLog extends Exercise {
  lastReps?: number;
  lastWeight?: number;
}
