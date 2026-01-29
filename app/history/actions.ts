'use server';

import { revalidatePath } from 'next/cache';
import { updateWorkoutLog, deleteWorkoutLog } from '@/lib/db/queries';
import { requireAuth } from '@/lib/auth/session';

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

