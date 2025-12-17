import type { Exercise } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ExerciseDisplayProps {
  exercise: Exercise;
  currentSet: number;
  totalSets: number;
}

export function ExerciseDisplay({ exercise, currentSet, totalSets }: ExerciseDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{exercise.name}</CardTitle>
        <CardDescription className="text-lg">
          Target: {exercise.targetSets} × {exercise.targetRepsMin}-{exercise.targetRepsMax}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="text-4xl font-bold">
            Set {currentSet} of {totalSets}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
