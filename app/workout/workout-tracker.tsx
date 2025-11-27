'use client';

import type { WorkoutWithExercises, Workout } from '@/lib/types';

interface WorkoutTrackerProps {
  initialWorkout: WorkoutWithExercises;
  allWorkouts: Workout[];
}

export function WorkoutTracker({ initialWorkout, allWorkouts }: WorkoutTrackerProps) {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold">{initialWorkout.name}</h1>
      <p className="text-muted-foreground mt-2">
        Workout tracker component (Task 8 - to be implemented)
      </p>
      <div className="mt-4 space-y-2">
        <p className="text-sm">Exercises in this workout:</p>
        <ul className="list-disc list-inside">
          {initialWorkout.exercises.map((exercise) => (
            <li key={exercise.id} className="text-sm text-muted-foreground">
              {exercise.name} - {exercise.targetSets} sets × {exercise.targetRepsMin}-{exercise.targetRepsMax} reps
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
