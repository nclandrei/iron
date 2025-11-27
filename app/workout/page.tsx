import { getWorkoutByDay, getWorkouts, getWorkoutWithExercises } from '@/lib/db/queries';
import { getWorkoutDayFromCurrent } from '@/lib/utils/workout';
import { WorkoutTracker } from './workout-tracker';

interface WorkoutPageProps {
  searchParams: { id?: string };
}

export default async function WorkoutPage({ searchParams }: WorkoutPageProps) {
  const allWorkouts = await getWorkouts();

  let workout;

  if (searchParams.id) {
    // Manual selection via dropdown
    workout = await getWorkoutWithExercises(parseInt(searchParams.id));
  } else {
    // Auto-detect by day
    const currentDay = getWorkoutDayFromCurrent();
    workout = await getWorkoutByDay(currentDay);
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
