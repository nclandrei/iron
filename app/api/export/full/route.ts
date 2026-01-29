import { getAllWorkoutLogsForExport } from '@/lib/db/queries';
import { generateWorkoutCsv } from '@/lib/utils/csv-export';

export async function GET() {
  try {
    const logs = await getAllWorkoutLogsForExport();

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
