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
    const fileName = `workout-full-export-${dateStr}.csv`;

    const firstDate = logs[0].loggedAt;
    const lastDate = logs[logs.length - 1].loggedAt;
    const dateRange = `${formatDate(firstDate)} to ${formatDate(lastDate)}`;

    const totalSets = logs.length;
    const totalReps = logs.reduce((acc, log) => acc + log.reps, 0);

    await resend.emails.send({
      from: 'IRON <onboarding@resend.dev>',
      to: process.env.EXPORT_EMAIL,
      subject: `Monthly IRON Full Data Export - ${dateStr}`,
      html: `
        <p>Your monthly full data backup is attached.</p>
        <ul>
          <li><strong>Total Sets:</strong> ${totalSets}</li>
          <li><strong>Total Reps:</strong> ${totalReps}</li>
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
      message: 'Full export sent successfully',
      stats: {
        totalSets,
        totalReps,
        dateRange,
      },
    });
  } catch (error) {
    console.error('Full export error:', error);
    return Response.json(
      { error: 'Failed to generate and send full export' },
      { status: 500 }
    );
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
