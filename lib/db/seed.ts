import { sql } from '@vercel/postgres';

async function seed() {
  try {
    console.log('Creating tables...');

    // Create workouts table
    await sql`
      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        day_of_week INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(name, day_of_week)
      );
    `;

    // Create exercises table
    await sql`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        target_sets INTEGER NOT NULL,
        target_reps_min INTEGER NOT NULL,
        target_reps_max INTEGER NOT NULL,
        default_weight DECIMAL(5,1) NOT NULL,
        UNIQUE(workout_id, order_index)
      );
    `;

    // Create workout_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id SERIAL PRIMARY KEY,
        workout_id INTEGER NOT NULL REFERENCES workouts(id),
        exercise_id INTEGER NOT NULL REFERENCES exercises(id),
        logged_at TIMESTAMP DEFAULT NOW(),
        set_number INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        weight DECIMAL(5,1) NOT NULL
      );
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_workout_logs_exercise ON workout_logs(exercise_id, logged_at DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_workout_logs_workout ON workout_logs(workout_id, logged_at DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_exercises_workout ON exercises(workout_id, order_index);`;

    console.log('Tables created. Seeding workouts...');

    // Insert workouts
    const workouts = [
      { name: 'Upper 1', day: 1 }, // Monday
      { name: 'Lower 1', day: 2 }, // Tuesday
      { name: 'Upper 2', day: 4 }, // Thursday
      { name: 'Lower 2', day: 5 }, // Friday
    ];

    for (const workout of workouts) {
      await sql`
        INSERT INTO workouts (name, day_of_week)
        VALUES (${workout.name}, ${workout.day})
        ON CONFLICT (name, day_of_week) DO NOTHING;
      `;
    }

    console.log('Workouts seeded. Seeding exercises...');

    // Get workout IDs
    const { rows: workoutRows } = await sql`SELECT id, name FROM workouts ORDER BY id;`;
    const workoutMap = new Map(workoutRows.map((w: any) => [w.name, w.id]));

    // Upper 1 exercises (Monday) - 7 exercises
    const upper1Exercises = [
      { name: 'Flat BB press', sets: 3, repsMin: 6, repsMax: 8, weight: 80 },
      { name: 'Cable row', sets: 3, repsMin: 6, repsMax: 8, weight: 81 },
      { name: 'Incline DB press', sets: 3, repsMin: 10, repsMax: 12, weight: 24 },
      { name: 'Assisted chin-ups', sets: 3, repsMin: 10, repsMax: 12, weight: 20.4 },
      { name: 'Machine lat raises', sets: 3, repsMin: 10, repsMax: 12, weight: 50 },
      { name: 'DB curl', sets: 2, repsMin: 10, repsMax: 12, weight: 12 },
      { name: 'Overhead triceps extension', sets: 2, repsMin: 10, repsMax: 12, weight: 34 },
    ];

    // Lower 1 exercises (Tuesday) - 6 exercises
    const lower1Exercises = [
      { name: 'Back squat', sets: 3, repsMin: 6, repsMax: 8, weight: 110 },
      { name: 'RDL', sets: 3, repsMin: 6, repsMax: 8, weight: 90 },
      { name: 'Leg extensions', sets: 3, repsMin: 10, repsMax: 12, weight: 68 },
      { name: 'Lying curls', sets: 3, repsMin: 10, repsMax: 12, weight: 63 },
      { name: 'Calf raises', sets: 3, repsMin: 10, repsMax: 15, weight: 106 },
      { name: 'Abs', sets: 3, repsMin: 10, repsMax: 15, weight: 81 },
    ];

    // Upper 2 exercises (Thursday) - 7 exercises
    const upper2Exercises = [
      { name: 'Flat BB press', sets: 3, repsMin: 6, repsMax: 8, weight: 80 },
      { name: 'BB row', sets: 3, repsMin: 6, repsMax: 8, weight: 70 },
      { name: 'Incline DB press', sets: 3, repsMin: 10, repsMax: 12, weight: 24 },
      { name: 'Machine lat pulldown', sets: 3, repsMin: 10, repsMax: 12, weight: 52 },
      { name: 'Machine lat raises', sets: 3, repsMin: 10, repsMax: 12, weight: 50 },
      { name: 'BB curl', sets: 2, repsMin: 10, repsMax: 12, weight: 22.5 },
      { name: 'Triceps pressdown', sets: 2, repsMin: 10, repsMax: 12, weight: 50 },
    ];

    // Lower 2 exercises (Friday) - 6 exercises
    const lower2Exercises = [
      { name: 'Leg press', sets: 3, repsMin: 6, repsMax: 8, weight: 255 },
      { name: 'RDL', sets: 3, repsMin: 6, repsMax: 8, weight: 90 },
      { name: 'Leg extensions', sets: 3, repsMin: 10, repsMax: 12, weight: 68 },
      { name: 'Lying curls', sets: 3, repsMin: 10, repsMax: 12, weight: 63 },
      { name: 'Calf raises', sets: 3, repsMin: 10, repsMax: 15, weight: 108 },
      { name: 'Abs', sets: 3, repsMin: 10, repsMax: 15, weight: 86 },
    ];

    const exerciseSets = [
      { workoutName: 'Upper 1', exercises: upper1Exercises },
      { workoutName: 'Lower 1', exercises: lower1Exercises },
      { workoutName: 'Upper 2', exercises: upper2Exercises },
      { workoutName: 'Lower 2', exercises: lower2Exercises },
    ];

    for (const set of exerciseSets) {
      const workoutId = workoutMap.get(set.workoutName);
      if (!workoutId) continue;

      for (let i = 0; i < set.exercises.length; i++) {
        const ex = set.exercises[i];
        await sql`
          INSERT INTO exercises (workout_id, order_index, name, target_sets, target_reps_min, target_reps_max, default_weight)
          VALUES (${workoutId}, ${i + 1}, ${ex.name}, ${ex.sets}, ${ex.repsMin}, ${ex.repsMax}, ${ex.weight})
          ON CONFLICT (workout_id, order_index) DO NOTHING;
        `;
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log('Summary:');
    console.log('- 4 workouts created (Upper 1, Lower 1, Upper 2, Lower 2)');
    console.log('- Upper 1: 7 exercises');
    console.log('- Lower 1: 6 exercises');
    console.log('- Upper 2: 7 exercises');
    console.log('- Lower 2: 6 exercises');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed();
