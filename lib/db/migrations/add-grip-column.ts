import { sql } from '@vercel/postgres';

async function migrate() {
  try {
    console.log('Adding grip column to workout_logs...');

    await sql`
      ALTER TABLE workout_logs
      ADD COLUMN IF NOT EXISTS grip VARCHAR(20);
    `;

    console.log('✅ Migration complete: grip column added to workout_logs');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrate();
