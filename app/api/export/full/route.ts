import { getAllWorkoutLogsForExport } from '@/lib/db/queries';
import { generateWorkoutCsv } from '@/lib/utils/csv-export';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await getAllWorkoutLogsForExport(user.id);

    if (logs.length === 0) {
      return Response.json({ message: 'No workout data to export' }, { status: 200 });
    }

    const csv = generateWorkoutCsv(logs);

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const fileName = `workout-export-${dateStr}.csv`;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}
