'use server';

import { revalidatePath } from 'next/cache';
import { logSet as dbLogSet, getLastLogForExercise, getWorkoutWithExercises } from '@/lib/db/queries';
import type { SetLogInput } from '@/lib/types';

export async function logSetAction(input: SetLogInput) {
  try {
    const log = await dbLogSet(input);
    return { success: true, log };
  } catch (error) {
    console.error('Error logging set:', error);
    return { success: false, error: 'Failed to log set' };
  }
}

export async function getLastLogAction(exerciseId: number) {
  try {
    const lastLog = await getLastLogForExercise(exerciseId);
    return { success: true, lastLog };
  } catch (error) {
    console.error('Error fetching last log:', error);
    return { success: false, error: 'Failed to fetch last log' };
  }
}

export async function getWorkoutAction(workoutId: number) {
  try {
    const workout = await getWorkoutWithExercises(workoutId);
    if (!workout) {
      return { success: false, error: 'Workout not found' };
    }
    return { success: true, workout };
  } catch (error) {
    console.error('Error fetching workout:', error);
    return { success: false, error: 'Failed to fetch workout' };
  }
}
