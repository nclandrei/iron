'use server';

import { revalidatePath } from 'next/cache';
import { updateExercise, deleteExercise, addExercise, updateUserPreferences } from '@/lib/db/queries';
import { requireAuth } from '@/lib/auth/session';
import type { Exercise } from '@/lib/types';

export async function updateExerciseAction(
  exerciseId: number,
  data: Partial<Pick<Exercise, 'name' | 'targetSets' | 'targetRepsMin' | 'targetRepsMax' | 'defaultWeight'>>
) {
  try {
    await requireAuth();
    const exercise = await updateExercise(exerciseId, data);
    revalidatePath('/manage');
    return { success: true, exercise };
  } catch (error) {
    console.error('Error updating exercise:', error);
    return { success: false, error: 'Failed to update exercise' };
  }
}

export async function deleteExerciseAction(exerciseId: number) {
  try {
    await requireAuth();
    await deleteExercise(exerciseId);
    revalidatePath('/manage');
    return { success: true };
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return { success: false, error: 'Failed to delete exercise' };
  }
}

export async function addExerciseAction(
  workoutId: number,
  exercise: Omit<Exercise, 'id' | 'workoutId'>
) {
  try {
    await requireAuth();
    const newExercise = await addExercise(workoutId, exercise);
    revalidatePath('/manage');
    return { success: true, exercise: newExercise };
  } catch (error) {
    console.error('Error adding exercise:', error);
    return { success: false, error: 'Failed to add exercise' };
  }
}

export async function updateUserPreferencesAction(data: {
  deloadWeeks?: number;
  hardWeeks?: number;
}) {
  try {
    const session = await requireAuth();
    const preferences = await updateUserPreferences(session.user.id, data);
    revalidatePath('/manage');
    return { success: true, preferences };
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}
