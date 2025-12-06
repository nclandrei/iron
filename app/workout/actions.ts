'use server';

import { revalidatePath } from 'next/cache';
import { logSet as dbLogSet, getLastLogForExercise, getWorkoutWithExercises, getExerciseAverageRepsPastWeek } from '@/lib/db/queries';
import { sql } from '@/lib/db/client';
import type { SetLogInput, Exercise } from '@/lib/types';

export async function logSetAction(input: SetLogInput) {
  try {
    const log = await dbLogSet(input);
    return { success: true, log };
  } catch (error) {
    console.error('Error logging set:', error);
    return { success: false, error: 'Failed to log set' };
  }
}

export async function getLastLogAction(exerciseId: number) {
  try {
    const lastLog = await getLastLogForExercise(exerciseId);
    return { success: true, lastLog };
  } catch (error) {
    console.error('Error fetching last log:', error);
    return { success: false, error: 'Failed to fetch last log' };
  }
}

export async function getWorkoutAction(workoutId: number) {
  try {
    const workout = await getWorkoutWithExercises(workoutId);
    if (!workout) {
      return { success: false, error: 'Workout not found' };
    }
    return { success: true, workout };
  } catch (error) {
    console.error('Error fetching workout:', error);
    return { success: false, error: 'Failed to fetch workout' };
  }
}

export async function getExerciseSuggestionAction(exerciseId: number) {
  try {
    const averageReps = await getExerciseAverageRepsPastWeek(exerciseId);

    if (averageReps === null) {
      return {
        success: true,
        suggestion: null,
        averageReps: null,
        midpoint: null,
      };
    }

    const { rows } = await sql`
      SELECT
        id,
        target_reps_min as "targetRepsMin",
        target_reps_max as "targetRepsMax",
        default_weight as "defaultWeight"
      FROM exercises
      WHERE id = ${exerciseId};
    `;

    if (rows.length === 0) {
      return { success: false, error: 'Exercise not found' };
    }

    const exercise = rows[0] as Pick<Exercise, 'targetRepsMin' | 'targetRepsMax' | 'defaultWeight'>;
    const midpoint = (exercise.targetRepsMin + exercise.targetRepsMax) / 2;
    const shouldIncreaseWeight = averageReps > midpoint;

    const lastLog = await getLastLogForExercise(exerciseId);
    const currentWeight = Number(lastLog?.weight ?? exercise.defaultWeight ?? 0);

    if (shouldIncreaseWeight) {
      const weightIncrement = currentWeight < 20 ? 1.25 : 2.5;
      const suggestedWeight = currentWeight + weightIncrement;

      return {
        success: true,
        suggestion: {
          shouldIncreaseWeight: true,
          suggestedWeight,
          suggestedReps: exercise.targetRepsMin,
        },
        averageReps,
        midpoint,
      };
    } else {
      // Focus on reps - aim for the high end of the range
      const suggestedReps = exercise.targetRepsMax;

      return {
        success: true,
        suggestion: {
          shouldIncreaseWeight: false,
          suggestedWeight: currentWeight,
          suggestedReps,
        },
        averageReps,
        midpoint,
      };
    }
  } catch (error) {
    console.error('Error fetching exercise suggestion:', error);
    return { success: false, error: 'Failed to fetch exercise suggestion' };
  }
}

export async function getTodayLogsAction(workoutId: number) {
  try {
    const { rows } = await sql`
      SELECT
        id,
        workout_id as "workoutId",
        exercise_id as "exerciseId",
        logged_at as "loggedAt",
        set_number as "setNumber",
        reps,
        weight
      FROM workout_logs
      WHERE workout_id = ${workoutId}
        AND DATE(logged_at) = CURRENT_DATE
      ORDER BY logged_at ASC;
    `;

    return { success: true, logs: rows as any[] };
  } catch (error) {
    console.error('Error fetching today logs:', error);
    return { success: false, error: 'Failed to fetch today logs' };
  }
}
