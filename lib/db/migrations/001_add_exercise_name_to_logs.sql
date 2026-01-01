-- Migration: Add exercise_name snapshot column to workout_logs
-- This allows historical logs to retain their original exercise name even if the exercise is renamed

-- Step 1: Add the new column (nullable to allow backfill)
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS exercise_name VARCHAR(100);

-- Step 2: Backfill existing logs with current exercise names
UPDATE workout_logs wl
SET exercise_name = e.name
FROM exercises e
WHERE wl.exercise_id = e.id
  AND wl.exercise_name IS NULL;
