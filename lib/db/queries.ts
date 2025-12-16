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
  // Validate workoutId is a positive number
  if (!Number.isInteger(workoutId) || workoutId <= 0) {
    throw new Error('workoutId must be a positive integer');
  }

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
  // Validate exerciseId is a positive number
  if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
    throw new Error('exerciseId must be a positive integer');
  }

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

// Get average reps for an exercise in the past week
export async function getExerciseAverageRepsPastWeek(
  exerciseId: number
): Promise<number | null> {
  // Validate exerciseId is a positive number
  if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
    throw new Error('exerciseId must be a positive integer');
  }

  const { rows } = await sql`
    SELECT AVG(reps) as "averageReps"
    FROM workout_logs
    WHERE exercise_id = ${exerciseId}
      AND logged_at >= NOW() - INTERVAL '7 days';
  `;

  if (rows.length === 0 || rows[0].averageReps === null) {
    return null;
  }

  return parseFloat(rows[0].averageReps);
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
    durationMinutes: number | null;
    exercises: Array<{
      exerciseId: number;
      exerciseName: string;
      sets: Array<{ id: number; setNumber: number; reps: number; weight: number }>;
    }>;
  }>
> {
  // Validate workoutId is a positive number
  if (!Number.isInteger(workoutId) || workoutId <= 0) {
    throw new Error('workoutId must be a positive integer');
  }

  // Validate limit is a positive number with reasonable maximum
  if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
    throw new Error('limit must be a positive integer between 1 and 100');
  }

  const { rows } = await sql`
    SELECT
      DATE(wl.logged_at)::text as date,
      wl.id,
      wl.exercise_id as "exerciseId",
      e.name as "exerciseName",
      e.order_index as "orderIndex",
      wl.set_number as "setNumber",
      wl.reps,
      wl.weight,
      wl.logged_at as "loggedAt"
    FROM workout_logs wl
    JOIN exercises e ON e.id = wl.exercise_id
    WHERE wl.workout_id = ${workoutId}
    ORDER BY wl.logged_at DESC;
  `;

  // Group by date and exercise, tracking timestamps for duration calculation
  const grouped = new Map<
    string,
    {
      exerciseMap: Map<
        number,
        {
          exerciseId: number;
          exerciseName: string;
          orderIndex: number;
          sets: Array<{ id: number; setNumber: number; reps: number; weight: number }>;
        }
      >;
      timestamps: Date[];
    }
  >();

  for (const row of rows as any[]) {
    const dateStr = String(row.date);

    if (!grouped.has(dateStr)) {
      grouped.set(dateStr, {
        exerciseMap: new Map(),
        timestamps: [],
      });
    }

    const dateData = grouped.get(dateStr)!;
    dateData.timestamps.push(new Date(row.loggedAt));

    if (!dateData.exerciseMap.has(row.exerciseId)) {
      dateData.exerciseMap.set(row.exerciseId, {
        exerciseId: row.exerciseId,
        exerciseName: row.exerciseName,
        orderIndex: row.orderIndex,
        sets: [],
      });
    }

    dateData.exerciseMap.get(row.exerciseId)!.sets.push({
      id: row.id,
      setNumber: row.setNumber,
      reps: row.reps,
      weight: row.weight,
    });
  }

  // Convert to array, calculate duration, and take last N sessions
  const result = Array.from(grouped.entries())
    .slice(0, limit)
    .map(([date, dateData]) => {
      const timestamps = dateData.timestamps;
      let durationMinutes: number | null = null;
      if (timestamps.length > 0) {
        const firstSet = new Date(Math.min(...timestamps.map((t) => t.getTime())));
        const lastSet = new Date(Math.max(...timestamps.map((t) => t.getTime())));
        const diffMs = lastSet.getTime() - firstSet.getTime();
        durationMinutes = Math.round(diffMs / 1000 / 60);
      }

      return {
        date,
        durationMinutes,
        exercises: Array.from(dateData.exerciseMap.values())
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((exercise) => ({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            sets: exercise.sets.sort((a, b) => a.setNumber - b.setNumber),
          })),
      };
    });

  return result;
}

// Update workout log
export async function updateWorkoutLog(
  logId: number,
  reps: number,
  weight: number
): Promise<WorkoutLog> {
  if (!Number.isInteger(logId) || logId <= 0) {
    throw new Error('logId must be a positive integer');
  }

  if (!Number.isInteger(reps) || reps <= 0) {
    throw new Error('reps must be a positive integer');
  }

  if (typeof weight !== 'number' || weight < 0) {
    throw new Error('weight must be a non-negative number');
  }

  const { rows } = await sql`
    UPDATE workout_logs
    SET reps = ${reps}, weight = ${weight}
    WHERE id = ${logId}
    RETURNING
      id,
      workout_id as "workoutId",
      exercise_id as "exerciseId",
      logged_at as "loggedAt",
      set_number as "setNumber",
      reps,
      weight;
  `;

  if (rows.length === 0) {
    throw new Error(`Workout log with id ${logId} not found`);
  }

  return rows[0] as WorkoutLog;
}

// Delete workout log
export async function deleteWorkoutLog(logId: number): Promise<void> {
  if (!Number.isInteger(logId) || logId <= 0) {
    throw new Error('logId must be a positive integer');
  }

  const { rows } = await sql`
    DELETE FROM workout_logs
    WHERE id = ${logId}
    RETURNING id;
  `;

  if (rows.length === 0) {
    throw new Error(`Workout log with id ${logId} not found`);
  }
}

// Get exercise history for charts (all time)
export async function getExerciseHistory(
  exerciseId: number
): Promise<Array<{ date: string; setNumber: number; reps: number; weight: number }>> {
  // Validate exerciseId is a positive number
  if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
    throw new Error('exerciseId must be a positive integer');
  }

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

  return rows.map((row) => ({
    date: String(row.date),
    setNumber: Number(row.setNumber),
    reps: Number(row.reps),
    weight: parseFloat(String(row.weight)),
  }));
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
  // Validate exerciseId is a positive number
  if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
    throw new Error('exerciseId must be a positive integer');
  }

  // Validate name length if provided (max 100 chars per schema)
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.length === 0 || data.name.length > 100)) {
    throw new Error('name must be a non-empty string with max length of 100 characters');
  }

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

  // Check if exercise was found and updated
  if (result.rows.length === 0) {
    throw new Error(`Exercise with id ${exerciseId} not found`);
  }

  return result.rows[0] as Exercise;
}

// Delete exercise
export async function deleteExercise(exerciseId: number): Promise<void> {
  // Validate exerciseId is a positive number
  if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
    throw new Error('exerciseId must be a positive integer');
  }

  await sql`DELETE FROM exercises WHERE id = ${exerciseId};`;
}

// Add exercise
export async function addExercise(
  workoutId: number,
  exercise: Omit<Exercise, 'id' | 'workoutId'>
): Promise<Exercise> {
  // Validate workoutId is a positive number
  if (!Number.isInteger(workoutId) || workoutId <= 0) {
    throw new Error('workoutId must be a positive integer');
  }

  // Validate name length (max 100 chars per schema)
  if (typeof exercise.name !== 'string' || exercise.name.length === 0 || exercise.name.length > 100) {
    throw new Error('name must be a non-empty string with max length of 100 characters');
  }

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

  // Check if insertion succeeded
  if (rows.length === 0) {
    throw new Error('Failed to insert exercise');
  }

  return rows[0] as Exercise;
}

export interface WorkoutLogExport {
  workoutName: string;
  exerciseName: string;
  loggedAt: Date;
  setNumber: number;
  reps: number;
  weight: number;
}

export async function getAllWorkoutLogsForExport(): Promise<WorkoutLogExport[]> {
  const { rows } = await sql`
    SELECT
      w.name as "workoutName",
      e.name as "exerciseName",
      wl.logged_at as "loggedAt",
      wl.set_number as "setNumber",
      wl.reps,
      wl.weight
    FROM workout_logs wl
    JOIN exercises e ON e.id = wl.exercise_id
    JOIN workouts w ON w.id = wl.workout_id
    ORDER BY wl.logged_at ASC;
  `;

  return rows.map((row) => ({
    workoutName: row.workoutName as string,
    exerciseName: row.exerciseName as string,
    loggedAt: new Date(row.loggedAt as string),
    setNumber: row.setNumber as number,
    reps: row.reps as number,
    weight: parseFloat(row.weight as string),
  }));
}
