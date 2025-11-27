import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getWorkouts } from '@/lib/db/queries';
import { WorkoutHistoryTable } from '@/components/history/workout-history-table';

export default async function HistoryPage() {
  const workouts = await getWorkouts();

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Workout History</h1>

      <Tabs defaultValue={workouts[0]?.id.toString()} className="w-full">
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
