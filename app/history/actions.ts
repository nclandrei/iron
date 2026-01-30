'use server';

import { revalidatePath } from 'next/cache';
import { updateWorkoutLog, deleteWorkoutLog, getWorkoutHistory } from '@/lib/db/queries';
import { requireAuth } from '@/lib/auth/session';

export type SessionHistoryItem = {
  date: string;
  durationMinutes: number | null;
  firstLoggedAt: string | null;
  exercises: Array<{
    exerciseId: number;
    exerciseName: string;
    sets: Array<{ id: number; setNumber: number; reps: number; weight: number }>;
  }>;
};

export async function fetchMoreSessionHistory(
  workoutId: number,
  offset: number,
  limit: number = 8
): Promise<{ sessions: SessionHistoryItem[]; hasMore: boolean }> {
  try {
    await requireAuth();
    const sessions = await getWorkoutHistory(workoutId, limit + 1, offset);
    const hasMore = sessions.length > limit;
    return {
      sessions: hasMore ? sessions.slice(0, limit) : sessions,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching session history:', error);
    return { sessions: [], hasMore: false };
  }
}

export async function updateSetAction(logId: number, reps: number, weight: number) {
  try {
    await requireAuth();
    await updateWorkoutLog(logId, reps, weight);
    revalidatePath('/history');
    return { success: true };
  } catch (error) {
    console.error('Error updating set:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update set' };
  }
}

export async function deleteSetAction(logId: number) {
  try {
    await requireAuth();
    await deleteWorkoutLog(logId);
    revalidatePath('/history');
    return { success: true };
  } catch (error) {
    console.error('Error deleting set:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete set' };
  }
}

