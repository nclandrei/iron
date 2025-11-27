import { sql } from '@vercel/postgres';

export { sql };

export async function query<T>(
  queryText: string,
  params?: any[]
): Promise<{ rows: T[] }> {
  try {
    const result = await sql.query(queryText, params);
    return { rows: result.rows as T[] };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
