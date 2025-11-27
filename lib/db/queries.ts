import { sql } from './client';
import type {
  Workout,
  Exercise,
  WorkoutLog,
  WorkoutWithExercises,
  ExerciseWithLastLog,
  SetLogInput,
} from '../types';

// Get all workouts
export async function getWorkouts(): Promise<Workout[]> {
  const { rows } = await sql`
    SELECT id, name, day_of_week as "dayOfWeek", created_at as "createdAt", updated_at as "updatedAt"
    FROM workouts
    ORDER BY day_of_week;
  `;
  return rows as Workout[];
}

// Get workout by ID with exercises
export async function getWorkoutWithExercises(
  workoutId: number
): Promise<WorkoutWithExercises | null> {
  const { rows: workoutRows } = await sql`
    SELECT id, name, day_of_week as "dayOfWeek", created_at as "createdAt", updated_at as "updatedAt"
    FROM workouts
    WHERE id = ${workoutId};
  `;

  if (workoutRows.length === 0) return null;

  const { rows: exerciseRows } = await sql`
    SELECT
      id,
      workout_id as "workoutId",
      order_index as "orderIndex",
      name,
      target_sets as "targetSets",
      target_reps_min as "targetRepsMin",
      target_reps_max as "targetRepsMax",
      default_weight as "defaultWeight"
    FROM exercises
    WHERE workout_id = ${workoutId}
    ORDER BY order_index;
  `;

  return {
    ...(workoutRows[0] as Workout),
    exercises: exerciseRows as Exercise[],
  };
}

// Get workout by day of week
export async function getWorkoutByDay(
  dayOfWeek: number
): Promise<WorkoutWithExercises | null> {
  const { rows: workoutRows } = await sql`
    SELECT id, name, day_of_week as "dayOfWeek", created_at as "createdAt", updated_at as "updatedAt"
    FROM workouts
    WHERE day_of_week = ${dayOfWeek};
  `;

  if (workoutRows.length === 0) return null;

  const workout = workoutRows[0] as Workout;
  return getWorkoutWithExercises(workout.id);
}

// Get last logged set for an exercise
export async function getLastLogForExercise(
  exerciseId: number
): Promise<{ reps: number; weight: number } | null> {
  const { rows } = await sql`
    SELECT reps, weight
    FROM workout_logs
    WHERE exercise_id = ${exerciseId}
    ORDER BY logged_at DESC
    LIMIT 1;
  `;

  if (rows.length === 0) return null;

  return rows[0] as { reps: number; weight: number };
}

// Log a set
export async function logSet(input: SetLogInput): Promise<WorkoutLog> {
  const { rows } = await sql`
    INSERT INTO workout_logs (workout_id, exercise_id, set_number, reps, weight)
    VALUES (${input.workoutId}, ${input.exerciseId}, ${input.setNumber}, ${input.reps}, ${input.weight})
    RETURNING
      id,
      workout_id as "workoutId",
      exercise_id as "exerciseId",
      logged_at as "loggedAt",
      set_number as "setNumber",
      reps,
      weight;
  `;

  return rows[0] as WorkoutLog;
}

// Get workout history for a specific workout (last N sessions)
export async function getWorkoutHistory(
  workoutId: number,
  limit: number = 8
): Promise<
  Array<{
    date: string;
    exercises: Array<{
      exerciseId: number;
      exerciseName: string;
      sets: Array<{ setNumber: number; reps: number; weight: number }>;
    }>;
  }>
> {
  const { rows } = await sql`
    SELECT
      DATE(wl.logged_at) as date,
      wl.exercise_id as "exerciseId",
      e.name as "exerciseName",
      wl.set_number as "setNumber",
      wl.reps,
      wl.weight
    FROM workout_logs wl
    JOIN exercises e ON e.id = wl.exercise_id
    WHERE wl.workout_id = ${workoutId}
    ORDER BY wl.logged_at DESC;
  `;

  // Group by date and exercise
  const grouped = new Map<
    string,
    Map<
      number,
      {
        exerciseId: number;
        exerciseName: string;
        sets: Array<{ setNumber: number; reps: number; weight: number }>;
      }
    >
  >();

  for (const row of rows as any[]) {
    const dateStr = new Date(row.date).toISOString().split('T')[0];

    if (!grouped.has(dateStr)) {
      grouped.set(dateStr, new Map());
    }

    const dateMap = grouped.get(dateStr)!;

    if (!dateMap.has(row.exerciseId)) {
      dateMap.set(row.exerciseId, {
        exerciseId: row.exerciseId,
        exerciseName: row.exerciseName,
        sets: [],
      });
    }

    dateMap.get(row.exerciseId)!.sets.push({
      setNumber: row.setNumber,
      reps: row.reps,
      weight: row.weight,
    });
  }

  // Convert to array and take last N sessions
  const result = Array.from(grouped.entries())
    .slice(0, limit)
    .map(([date, exerciseMap]) => ({
      date,
      exercises: Array.from(exerciseMap.values()),
    }));

  return result;
}

// Get exercise history for charts (all time)
export async function getExerciseHistory(
  exerciseId: number
): Promise<Array<{ date: string; setNumber: number; reps: number; weight: number }>> {
  const { rows } = await sql`
    SELECT
      DATE(logged_at) as date,
      set_number as "setNumber",
      reps,
      weight
    FROM workout_logs
    WHERE exercise_id = ${exerciseId}
    ORDER BY logged_at ASC;
  `;

  return rows as Array<{ date: string; setNumber: number; reps: number; weight: number }>;
}

// Update exercise
export async function updateExercise(
  exerciseId: number,
  data: Partial<
    Pick<
      Exercise,
      'name' | 'targetSets' | 'targetRepsMin' | 'targetRepsMax' | 'defaultWeight' | 'orderIndex'
    >
  >
): Promise<Exercise> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (data.targetSets !== undefined) {
    updates.push(`target_sets = $${paramCount++}`);
    values.push(data.targetSets);
  }
  if (data.targetRepsMin !== undefined) {
    updates.push(`target_reps_min = $${paramCount++}`);
    values.push(data.targetRepsMin);
  }
  if (data.targetRepsMax !== undefined) {
    updates.push(`target_reps_max = $${paramCount++}`);
    values.push(data.targetRepsMax);
  }
  if (data.defaultWeight !== undefined) {
    updates.push(`default_weight = $${paramCount++}`);
    values.push(data.defaultWeight);
  }
  if (data.orderIndex !== undefined) {
    updates.push(`order_index = $${paramCount++}`);
    values.push(data.orderIndex);
  }

  values.push(exerciseId);

  const query = `
    UPDATE exercises
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING
      id,
      workout_id as "workoutId",
      order_index as "orderIndex",
      name,
      target_sets as "targetSets",
      target_reps_min as "targetRepsMin",
      target_reps_max as "targetRepsMax",
      default_weight as "defaultWeight";
  `;

  const result = await sql.query(query, values);
  return result.rows[0] as Exercise;
}

// Delete exercise
export async function deleteExercise(exerciseId: number): Promise<void> {
  await sql`DELETE FROM exercises WHERE id = ${exerciseId};`;
}

// Add exercise
export async function addExercise(
  workoutId: number,
  exercise: Omit<Exercise, 'id' | 'workoutId'>
): Promise<Exercise> {
  const { rows } = await sql`
    INSERT INTO exercises (workout_id, order_index, name, target_sets, target_reps_min, target_reps_max, default_weight)
    VALUES (
      ${workoutId},
      ${exercise.orderIndex},
      ${exercise.name},
      ${exercise.targetSets},
      ${exercise.targetRepsMin},
      ${exercise.targetRepsMax},
      ${exercise.defaultWeight}
    )
    RETURNING
      id,
      workout_id as "workoutId",
      order_index as "orderIndex",
      name,
      target_sets as "targetSets",
      target_reps_min as "targetRepsMin",
      target_reps_max as "targetRepsMax",
      default_weight as "defaultWeight";
  `;

  return rows[0] as Exercise;
}
