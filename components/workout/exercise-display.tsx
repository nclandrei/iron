import type { Exercise } from '@/lib/types';
import type { ExerciseAlternative } from '@/lib/config/exercise-swaps';
import type { GripType } from '@/lib/config/exercise-grips';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExerciseSwap } from './exercise-swap';
import { GripSelector } from './grip-selector';

interface ExerciseDisplayProps {
  exercise: Exercise;
  currentSet: number;
  totalSets: number;
  displayName?: string;
  currentGrip?: GripType | null;
  onSwap?: (alternative: ExerciseAlternative, permanent: boolean) => void;
  onGripChange?: (grip: GripType) => void;
}

export function ExerciseDisplay({ 
  exercise, 
  currentSet, 
  totalSets, 
  displayName, 
  currentGrip,
  onSwap,
  onGripChange,
}: ExerciseDisplayProps) {
  const name = displayName || exercise.name;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-2xl">{name}</CardTitle>
              {currentGrip && onGripChange && (
                <GripSelector
                  exerciseName={name}
                  currentGrip={currentGrip}
                  onGripChange={onGripChange}
                />
              )}
            </div>
            <CardDescription className="text-lg">
              Target: {exercise.targetSets} × {exercise.targetRepsMin}-{exercise.targetRepsMax}
            </CardDescription>
          </div>
          {onSwap && (
            <ExerciseSwap
              exercise={{ ...exercise, name }}
              onSwap={onSwap}
            />
          )}
        </div>
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
