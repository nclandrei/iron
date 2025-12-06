import { getWorkoutHistory, getWorkoutWithExercises, getExerciseHistory } from '@/lib/db/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistance } from 'date-fns';
import { ExerciseChart } from './exercise-chart';
import { EditableWorkoutCard } from './editable-workout-card';

interface WorkoutHistoryTableProps {
  workoutId: number;
}

export async function WorkoutHistoryTable({ workoutId }: WorkoutHistoryTableProps) {
  const history = await getWorkoutHistory(workoutId, 8);
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

      <TabsContent value="table" className="space-y-4">
        {history.map((session) => {
          const date = new Date(session.date);
          const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          const relativeTime = formatDistance(date, new Date(), { addSuffix: true });

          const formatDuration = (minutes: number | null) => {
            if (minutes === null) return null;
            if (minutes < 60) return `${minutes}m`;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
          };

          const durationStr = formatDuration(session.durationMinutes);

          return (
            <EditableWorkoutCard
              key={session.date}
              exercises={session.exercises}
              dateStr={dateStr}
              relativeTime={relativeTime}
              durationStr={durationStr}
            />
          );
        })}
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
