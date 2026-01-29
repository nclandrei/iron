import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getWorkouts, getWorkoutByDay } from '@/lib/db/queries';
import { WorkoutHistoryTable } from '@/components/history/workout-history-table';
import { ExportButton } from '@/components/history/export-button';
import { getWorkoutDayFromCurrent } from '@/lib/utils/workout';

export default async function HistoryPage() {
  const workouts = await getWorkouts();
  const currentDay = getWorkoutDayFromCurrent();
  const currentWorkout = await getWorkoutByDay(currentDay);

  // Default to current day's workout, fallback to first workout
  const defaultWorkoutId = currentWorkout?.id.toString() ?? workouts[0]?.id.toString();

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Workout History</h1>
        <ExportButton />
      </div>

      <Tabs defaultValue={defaultWorkoutId} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {workouts.map((workout) => (
            <TabsTrigger key={workout.id} value={workout.id.toString()}>
              {workout.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {workouts.map((workout) => (
          <TabsContent key={workout.id} value={workout.id.toString()}>
            <WorkoutHistoryTable workoutId={workout.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
