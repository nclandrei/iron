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

export async function getLastSessionSetsAction(exerciseId: number) {
  try {
    // Get all sets from the last session for this exercise
    const { rows } = await sql`
      SELECT reps, weight, set_number as "setNumber", DATE(logged_at) as session_date
      FROM workout_logs
      WHERE exercise_id = ${exerciseId}
      ORDER BY logged_at DESC
      LIMIT 10;
    `;

    if (rows.length === 0) {
      return { success: true, sets: [] };
    }

    // Filter to only include sets from the most recent session date
    const mostRecentDate = rows[0].session_date;
    const mostRecentTime = new Date(mostRecentDate).getTime();

    const lastSessionSets = rows.filter(
      (row: any) => {
        const rowTime = new Date(row.session_date).getTime();
        return rowTime === mostRecentTime;
      }
    );

    return {
      success: true,
      sets: lastSessionSets.map((row: any) => ({
        setNumber: row.setNumber,
        reps: row.reps,
        weight: Number(row.weight),
      }))
    };
  } catch (error) {
    console.error('Error fetching last session sets:', error);
    return { success: false, error: 'Failed to fetch last session sets', sets: [] };
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
    // Fetch exercise config
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

    // Get all sets from the last session for this exercise
    const { rows: lastSessionRows } = await sql`
      SELECT reps, weight, DATE(logged_at) as session_date
      FROM workout_logs
      WHERE exercise_id = ${exerciseId}
      ORDER BY logged_at DESC
      LIMIT 10;
    `;

    // No history - return no suggestion
    if (lastSessionRows.length === 0) {
      return {
        success: true,
        suggestion: null,
        averageReps: null,
        midpoint: null,
      };
    }

    // Get the most recent session date and filter sets from that date only
    const mostRecentDate = lastSessionRows[0].session_date;
    const lastSessionSets = lastSessionRows.filter(
      (row: any) => row.session_date === mostRecentDate
    );

    // Check if ALL sets from last session hit max target reps
    const allSetsMaxedOut = lastSessionSets.every(
      (set: any) => set.reps >= exercise.targetRepsMax
    );

    const lastWeight = Number(lastSessionSets[0].weight);

    if (allSetsMaxedOut) {
      // All sets hit max reps - suggest weight increase
      const suggestedWeight = lastWeight + 1.25;

      return {
        success: true,
        suggestion: {
          shouldIncreaseWeight: true,
          suggestedWeight,
          suggestedReps: exercise.targetRepsMin,
        },
        averageReps: null,
        midpoint: exercise.targetRepsMax,
      };
    } else {
      // At least one set didn't hit max - focus on reps
      return {
        success: true,
        suggestion: {
          shouldIncreaseWeight: false,
          suggestedWeight: lastWeight,
          suggestedReps: exercise.targetRepsMax,
        },
        averageReps: null,
        midpoint: exercise.targetRepsMax,
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
