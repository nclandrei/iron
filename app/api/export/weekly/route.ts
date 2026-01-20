import { Resend } from 'resend';
import { getWorkoutLogsForDateRange } from '@/lib/db/queries';
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

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const logs = await getWorkoutLogsForDateRange(weekAgo, today);

    if (logs.length === 0) {
      return Response.json({ message: 'No workout data for this week' }, { status: 200 });
    }

    const csv = generateWorkoutCsv(logs);

    const dateStr = today.toISOString().split('T')[0];
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    const fileName = `workout-weekly-${dateStr}.csv`;

    const totalSets = logs.length;
    const totalReps = logs.reduce((acc, log) => acc + log.reps, 0);

    await resend.emails.send({
      from: 'IRON <onboarding@resend.dev>',
      to: process.env.EXPORT_EMAIL,
      subject: `Weekly IRON Workout Summary - ${dateStr}`,
      html: `
        <p>Your weekly workout summary is attached.</p>
        <ul>
          <li><strong>Week:</strong> ${weekAgoStr} to ${dateStr}</li>
          <li><strong>Total Sets:</strong> ${totalSets}</li>
          <li><strong>Total Reps:</strong> ${totalReps}</li>
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
      message: 'Weekly export sent successfully',
      stats: {
        totalSets,
        totalReps,
        dateRange: `${weekAgoStr} to ${dateStr}`,
      },
    });
  } catch (error) {
    console.error('Weekly export error:', error);
    return Response.json(
      { error: 'Failed to generate and send weekly export' },
      { status: 500 }
    );
  }
}
