import type { WorkoutLogExport } from '../db/queries';

function escapeCsvField(field: string | number): string {
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatTime(date: Date): string {
  return date.toTimeString().split(' ')[0];
}

export function generateWorkoutCsv(logs: WorkoutLogExport[]): string {
  const headers = [
    'Workout Name',
    'Exercise Name',
    'Date',
    'Time',
    'Set Number',
    'Reps',
    'Weight',
  ];

  const rows = logs.map((log) => [
    escapeCsvField(log.workoutName),
    escapeCsvField(log.exerciseName),
    escapeCsvField(formatDate(log.loggedAt)),
    escapeCsvField(formatTime(log.loggedAt)),
    escapeCsvField(log.setNumber),
    escapeCsvField(log.reps),
    escapeCsvField(log.weight),
  ]);

  const csvRows = [headers.join(','), ...rows.map((row) => row.join(','))];

  return csvRows.join('\n');
}

