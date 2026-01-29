import { getWorkoutByDay, getWorkouts, getWorkoutWithExercises } from '@/lib/db/queries';
import { getWorkoutDayFromCurrent } from '@/lib/utils/workout';
import { getCurrentUser } from '@/lib/auth/session';
import { WorkoutTracker } from './workout-tracker';

interface WorkoutPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function WorkoutPage({ searchParams }: WorkoutPageProps) {
  const user = await getCurrentUser();
  const userId = user?.id;

  const allWorkouts = await getWorkouts(userId);
  const params = await searchParams;

  let workout;

  if (params.id) {
    // Manual selection via dropdown
    workout = await getWorkoutWithExercises(parseInt(params.id));
  } else {
    // Auto-detect by day
    const currentDay = getWorkoutDayFromCurrent();
    workout = await getWorkoutByDay(currentDay, userId);
  }

  if (!workout) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">No Workout Found</h1>
          <p className="text-muted-foreground mt-2">
            No workout is configured for today.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WorkoutTracker
      initialWorkout={workout}
      allWorkouts={allWorkouts}
    />
  );
}
