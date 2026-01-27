import type { WorkoutSession, ExerciseProgress, Exercise, WorkoutLog } from '@/lib/types';

const STORAGE_KEY = 'workout-session-v1';

export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function saveWorkoutSession(session: WorkoutSession): void {
  try {
    const serialized = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save workout session:', error);
  }
}

export function loadWorkoutSession(): WorkoutSession | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as WorkoutSession;

    // Validate session
    if (!isSessionValid(parsed)) {
      clearWorkoutSession();
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load workout session:', error);
    clearWorkoutSession();
    return null;
  }
}

export function clearWorkoutSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear workout session:', error);
  }
}

export function isSessionValid(session: WorkoutSession): boolean {
  // Check if session has required fields
  if (!session.workoutId || session.exerciseIndex === undefined || !session.sessionDate) {
    return false;
  }

  // Check if session date matches today
  const today = getTodayDate();
  if (session.sessionDate !== today) {
    return false;
  }

  // Check for inactivity timeout (30 minutes)
  // Use lastSetTime if available, otherwise use startedAt
  if (session.startedAt) {
    const referenceTime = session.lastSetTime 
      ? new Date(session.lastSetTime) 
      : new Date(session.startedAt);
    const now = new Date();
    const inactiveMs = now.getTime() - referenceTime.getTime();
    const thirtyMinutesMs = 30 * 60 * 1000;
    if (inactiveMs > thirtyMinutesMs) {
      return false;
    }
  }

  return true;
}

export function formatElapsedTime(startedAt: Date): string {
  const now = new Date();
  const elapsedMs = now.getTime() - startedAt.getTime();
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function buildExerciseProgress(
  exercises: Exercise[],
  loggedSets: WorkoutLog[]
): Map<number, ExerciseProgress> {
  const progressMap = new Map<number, ExerciseProgress>();

  // Initialize progress for all exercises
  for (const exercise of exercises) {
    progressMap.set(exercise.id, {
      exerciseId: exercise.id,
      completedSets: 0,
      targetSetsCompleted: false,
      lastSetNumber: 0,
    });
  }

  // Update progress based on logged sets
  for (const log of loggedSets) {
    const current = progressMap.get(log.exerciseId);
    if (!current) continue;

    const exercise = exercises.find((e) => e.id === log.exerciseId);
    if (!exercise) continue;

    const newCompletedSets = current.completedSets + 1;
    const targetReached = newCompletedSets >= exercise.targetSets;

    progressMap.set(log.exerciseId, {
      exerciseId: log.exerciseId,
      completedSets: newCompletedSets,
      targetSetsCompleted: targetReached,
      lastSetNumber: Math.max(current.lastSetNumber, log.setNumber),
    });
  }

  return progressMap;
}
