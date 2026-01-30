import { getWorkoutHistory, getWorkoutWithExercises, getExerciseHistory } from '@/lib/db/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExerciseChart } from './exercise-chart';
import { SessionHistoryList } from './session-history-list';

const PAGE_SIZE = 8;

interface WorkoutHistoryTableProps {
  workoutId: number;
}

export async function WorkoutHistoryTable({ workoutId }: WorkoutHistoryTableProps) {
  const history = await getWorkoutHistory(workoutId, PAGE_SIZE + 1);
  const hasMore = history.length > PAGE_SIZE;
  const initialSessions = hasMore ? history.slice(0, PAGE_SIZE) : history;
  const workout = await getWorkoutWithExercises(workoutId);

  if (!workout) {
    return null;
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No workout history yet. Start logging sets!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Fetch exercise history for all exercises
  const exerciseHistories = await Promise.all(
    workout.exercises.map(async (exercise) => ({
      exercise,
      data: await getExerciseHistory(exercise.id),
    }))
  );

  return (
    <Tabs defaultValue="table" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="table">Session History</TabsTrigger>
        <TabsTrigger value="charts">Exercise Charts</TabsTrigger>
      </TabsList>

      <TabsContent value="table">
        <SessionHistoryList
          workoutId={workoutId}
          initialSessions={initialSessions}
          initialHasMore={hasMore}
        />
      </TabsContent>

      <TabsContent value="charts" className="space-y-6">
        {exerciseHistories
          .filter(({ data }) => data.length > 0)
          .map(({ exercise, data }) => (
            <ExerciseChart key={exercise.id} exercise={exercise} data={data} />
          ))}
      </TabsContent>
    </Tabs>
  );
}
