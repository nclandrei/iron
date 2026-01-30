'use server';

import { revalidatePath } from 'next/cache';
import {
  logSet as dbLogSet,
  getLastLogForExercise,
  getLastGripForExercise,
  getWorkoutWithExercises,
  updateExercise,
  getUserPreferences,
  upsertUserCycleOverrides,
} from '@/lib/db/queries';
import { sql } from '@/lib/db/client';
import { requireAuth } from '@/lib/auth/session';
import type { SetLogInput, Exercise, UserPreferences } from '@/lib/types';
import type { ExerciseAlternative } from '@/lib/config/exercise-swaps';

interface SessionRow {
  reps: number;
  weight: number;
  setNumber: number;
  session_date: string;
}

interface LastSessionRow {
  reps: number;
  weight: number;
  session_date: string;
}

interface TodayLogRow {
  workoutId: number;
  exerciseId: number;
  loggedAt: Date;
  setNumber: number;
  reps: number;
  weight: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfIsoWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = (day + 6) % 7; // Monday as start
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
}

function getCycleConfig(preferences: UserPreferences) {
  const hardWeeks = preferences.cycleHardWeeks ?? preferences.hardWeeks;
  const deloadWeeks = preferences.cycleDeloadWeeks ?? preferences.deloadWeeks;
  return { hardWeeks, deloadWeeks };
}

function computeCycleWeek(preferences: UserPreferences, now: Date) {
  if (!preferences.cycleStartDate) {
    return null;
  }

  const { hardWeeks, deloadWeeks } = getCycleConfig(preferences);
  const cycleStart = startOfIsoWeek(new Date(preferences.cycleStartDate));
  const weekStart = startOfIsoWeek(now);
  const daysSinceStart = daysBetween(cycleStart, weekStart);
  const weekIndex = Math.floor(daysSinceStart / 7) + 1;
  const totalWeeks = hardWeeks + deloadWeeks;
  const positionInCycle = ((weekIndex - 1) % totalWeeks) + 1;
  const isDeloadWeek = positionInCycle > hardWeeks;

  return {
    weekIndex,
    totalWeeks,
    hardWeeks,
    deloadWeeks,
    positionInCycle,
    isDeloadWeek,
    cycleStartDate: preferences.cycleStartDate,
  };
}

export async function logSetAction(input: SetLogInput) {
  try {
    await requireAuth();
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

export async function getLastGripAction(exerciseId: number) {
  try {
    const lastGrip = await getLastGripForExercise(exerciseId);
    return { success: true, lastGrip };
  } catch (error) {
    console.error('Error fetching last grip:', error);
    return { success: false, error: 'Failed to fetch last grip' };
  }
}

export async function getLastSessionSetsAction(exerciseId: number, grip?: string | null) {
  try {
    // Get all sets from the last session for this exercise (excluding today)
    // Filter by grip if provided
    const { rows } = grip
      ? await sql`
          SELECT reps, weight, set_number as "setNumber", DATE(logged_at) as session_date
          FROM workout_logs
          WHERE exercise_id = ${exerciseId}
            AND DATE(logged_at) < CURRENT_DATE
            AND grip = ${grip}
          ORDER BY logged_at DESC
          LIMIT 10;
        `
      : await sql`
          SELECT reps, weight, set_number as "setNumber", DATE(logged_at) as session_date
          FROM workout_logs
          WHERE exercise_id = ${exerciseId}
            AND DATE(logged_at) < CURRENT_DATE
          ORDER BY logged_at DESC
          LIMIT 10;
        `;

    if (rows.length === 0) {
      return { success: true, sets: [] };
    }

    // Filter to only include sets from the most recent session date (before today)
    const mostRecentDate = rows[0].session_date;
    const mostRecentTime = new Date(mostRecentDate).getTime();

    const lastSessionSets = (rows as SessionRow[]).filter((row) => {
      const rowTime = new Date(row.session_date).getTime();
      return rowTime === mostRecentTime;
    });

    return {
      success: true,
      sets: lastSessionSets.map((row) => ({
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

export async function getExerciseSuggestionAction(exerciseId: number, grip?: string | null) {
  try {
    const session = await requireAuth();
    const preferences = await getUserPreferences(session.user.id);
    if (!preferences) {
      return { success: false, error: 'User preferences not found' };
    }
    const cycleInfo = computeCycleWeek(preferences, new Date());
    const isDeloadWeek = cycleInfo?.isDeloadWeek ?? false;

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

    // Get all sets from the last session for this exercise (excluding today)
    // Filter by grip if provided
    const { rows: lastSessionRows } = grip
      ? await sql`
          SELECT reps, weight, DATE(logged_at) as session_date
          FROM workout_logs
          WHERE exercise_id = ${exerciseId}
            AND DATE(logged_at) < CURRENT_DATE
            AND grip = ${grip}
          ORDER BY logged_at DESC
          LIMIT 10;
        `
      : await sql`
          SELECT reps, weight, DATE(logged_at) as session_date
          FROM workout_logs
          WHERE exercise_id = ${exerciseId}
            AND DATE(logged_at) < CURRENT_DATE
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
        cycleInfo,
      };
    }

    // Get the most recent session date and filter sets from that date only
    const mostRecentDate = lastSessionRows[0].session_date;
    const lastSessionSets = (lastSessionRows as LastSessionRow[]).filter(
      (row) => row.session_date === mostRecentDate
    );

    // Check if ALL sets from last session hit max target reps
    const allSetsMaxedOut = lastSessionSets.every((set) => set.reps >= exercise.targetRepsMax);

    const lastWeight = Number(lastSessionSets[0].weight);

    if (allSetsMaxedOut) {
      // All sets hit max reps - suggest weight increase
      const baseSuggestedWeight = lastWeight + 1.25;
      const suggestedWeight = isDeloadWeek
        ? Math.round(baseSuggestedWeight * 0.75 * 100) / 100
        : baseSuggestedWeight;

      return {
        success: true,
        suggestion: {
          shouldIncreaseWeight: true,
          suggestedWeight,
          suggestedReps: exercise.targetRepsMin,
        },
        averageReps: null,
        midpoint: exercise.targetRepsMax,
        cycleInfo,
      };
    } else {
      // At least one set didn't hit max - focus on reps
      const suggestedWeight = isDeloadWeek
        ? Math.round(lastWeight * 0.75 * 100) / 100
        : lastWeight;
      return {
        success: true,
        suggestion: {
          shouldIncreaseWeight: false,
          suggestedWeight,
          suggestedReps: exercise.targetRepsMax,
        },
        averageReps: null,
        midpoint: exercise.targetRepsMax,
        cycleInfo,
      };
    }
  } catch (error) {
    console.error('Error fetching exercise suggestion:', error);
    return { success: false, error: 'Failed to fetch exercise suggestion' };
  }
}

export async function getCycleStatusAction() {
  try {
    const session = await requireAuth();
    const preferences = await getUserPreferences(session.user.id);
    if (!preferences) {
      return { success: false, error: 'User preferences not found' };
    }

    const cycleInfo = computeCycleWeek(preferences, new Date());
    return { success: true, preferences, cycleInfo };
  } catch (error) {
    console.error('Error fetching cycle status:', error);
    return { success: false, error: 'Failed to fetch cycle status' };
  }
}

export async function startNewCycleAction(data: { hardWeeks: number; deloadWeeks: number }) {
  try {
    const session = await requireAuth();
    const now = new Date();
    const cycleStartDate = startOfIsoWeek(now).toISOString().split('T')[0];

    const preferences = await upsertUserCycleOverrides(session.user.id, {
      cycleStartDate,
      cycleHardWeeks: data.hardWeeks,
      cycleDeloadWeeks: data.deloadWeeks,
    });

    revalidatePath('/workout');
    return { success: true, preferences };
  } catch (error) {
    console.error('Error starting new cycle:', error);
    return { success: false, error: 'Failed to start new cycle' };
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

    return { success: true, logs: rows as TodayLogRow[] };
  } catch (error) {
    console.error('Error fetching today logs:', error);
    return { success: false, error: 'Failed to fetch today logs' };
  }
}

export async function swapExercisePermanentlyAction(
  exerciseId: number,
  alternative: ExerciseAlternative
) {
  try {
    await requireAuth();
    const updated = await updateExercise(exerciseId, {
      name: alternative.name,
      defaultWeight: alternative.defaultWeight,
    });
    revalidatePath('/workout');
    return { success: true, exercise: updated };
  } catch (error) {
    console.error('Error swapping exercise:', error);
    return { success: false, error: 'Failed to swap exercise' };
  }
}
