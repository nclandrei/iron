import { Resend } from 'resend';
import { getAllWorkoutLogsForExport } from '@/lib/db/queries';
import { generateWorkoutCsv } from '@/lib/utils/csv-export';

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    if (!process.env.EXPORT_EMAIL) {
      return Response.json({ error: 'EXPORT_EMAIL not configured' }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const logs = await getAllWorkoutLogsForExport();

    if (logs.length === 0) {
      return Response.json({ message: 'No workout data to export' }, { status: 200 });
    }

    const csv = generateWorkoutCsv(logs);

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const fileName = `workout-export-${dateStr}.csv`;

    const firstDate = logs[0].loggedAt;
    const lastDate = logs[logs.length - 1].loggedAt;
    const dateRange = `${formatDate(firstDate)} to ${formatDate(lastDate)}`;

    const totalSets = logs.length;
    const uniqueWorkouts = new Set(logs.map((log) => log.workoutName)).size;

    await resend.emails.send({
      from: 'Workout Tracker <onboarding@resend.dev>',
      to: process.env.EXPORT_EMAIL,
      subject: `Weekly Workout Export - ${dateStr}`,
      html: `
        <h2>Weekly Workout Export</h2>
        <p>Your weekly workout data export is attached.</p>
        <ul>
          <li><strong>Total Sets:</strong> ${totalSets}</li>
          <li><strong>Unique Workouts:</strong> ${uniqueWorkouts}</li>
          <li><strong>Date Range:</strong> ${dateRange}</li>
        </ul>
      `,
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(csv, 'utf-8').toString('base64'),
        },
      ],
    });

    return Response.json({
      message: 'Export sent successfully',
      stats: {
        totalSets,
        uniqueWorkouts,
        dateRange,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json(
      { error: 'Failed to generate and send export' },
      { status: 500 }
    );
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

