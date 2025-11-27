import { getWorkoutByDay, getWorkouts } from '@/lib/db/queries';
import { getWorkoutDayFromCurrent } from '@/lib/utils/workout';
import { WorkoutTracker } from './workout-tracker';

export default async function WorkoutPage() {
  const currentDay = getWorkoutDayFromCurrent();
  const workout = await getWorkoutByDay(currentDay);
  const allWorkouts = await getWorkouts();

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
