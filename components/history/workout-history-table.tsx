import { getWorkoutHistory } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistance } from 'date-fns';

interface WorkoutHistoryTableProps {
  workoutId: number;
}

export async function WorkoutHistoryTable({ workoutId }: WorkoutHistoryTableProps) {
  const history = await getWorkoutHistory(workoutId, 8);

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

  return (
    <div className="space-y-4">
      {history.map((session) => {
        const date = new Date(session.date);
        const dateStr = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const relativeTime = formatDistance(date, new Date(), { addSuffix: true });

        return (
          <Card key={session.date}>
            <CardHeader>
              <CardTitle className="text-xl">
                {dateStr}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({relativeTime})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {session.exercises.map((exercise) => {
                  const setsDisplay = exercise.sets
                    .map((set) => `${set.reps}@${set.weight}kg`)
                    .join(', ');

                  return (
                    <div key={exercise.exerciseId} className="flex justify-between items-start">
                      <span className="font-medium">{exercise.exerciseName}</span>
                      <span className="text-sm text-muted-foreground text-right">
                        {exercise.sets.length}× [{setsDisplay}]
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
