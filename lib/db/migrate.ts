import { sql } from '@vercel/postgres';

async function migrate() {
  console.log('Running migrations...');

  // Migration 001: Add exercise_name snapshot column to workout_logs
  console.log('001: Adding exercise_name column to workout_logs...');
  
  await sql`
    ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS exercise_name VARCHAR(100);
  `;
  
  console.log('001: Backfilling existing logs with exercise names...');
  
  const result = await sql`
    UPDATE workout_logs wl
    SET exercise_name = e.name
    FROM exercises e
    WHERE wl.exercise_id = e.id
      AND wl.exercise_name IS NULL;
  `;
  
  console.log(`001: Backfilled ${result.rowCount ?? 0} rows`);
  console.log('Migrations complete!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
