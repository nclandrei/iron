-- Better Auth tables
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  deload_weeks INTEGER NOT NULL DEFAULT 1,
  hard_weeks INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope TEXT,
  id_token TEXT,
  password TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Workouts table: 4 workout templates (per user)
CREATE TABLE IF NOT EXISTS workouts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  day_of_week INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name, day_of_week)
);

-- Exercises table: exercises within each workout
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  target_sets INTEGER NOT NULL,
  target_reps_min INTEGER NOT NULL,
  target_reps_max INTEGER NOT NULL,
  default_weight DECIMAL(5,2) NOT NULL,
  UNIQUE(workout_id, order_index)
);

-- Workout logs table: append-only set logging
CREATE TABLE IF NOT EXISTS workout_logs (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER NOT NULL REFERENCES workouts(id),
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  logged_at TIMESTAMP DEFAULT NOW(),
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  exercise_name VARCHAR(100) -- Snapshot of exercise name at log time
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_exercise ON workout_logs(exercise_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout ON workout_logs(workout_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_workout ON exercises(workout_id, order_index);
