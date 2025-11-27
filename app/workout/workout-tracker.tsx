'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutWithExercises, Workout } from '@/lib/types';
import { logSetAction, getLastLogAction } from './actions';
import { ExerciseDisplay } from '@/components/workout/exercise-display';
import { SetLogger } from '@/components/workout/set-logger';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface WorkoutTrackerProps {
  initialWorkout: WorkoutWithExercises;
  allWorkouts: Workout[];
}

export function WorkoutTracker({ initialWorkout, allWorkouts }: WorkoutTrackerProps) {
  const router = useRouter();

  const [workout, setWorkout] = useState(initialWorkout);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [extraSetUsed, setExtraSetUsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultValues, setDefaultValues] = useState<{ reps?: number; weight?: number }>({});
  const [isComplete, setIsComplete] = useState(false);
  const [totalSetsLogged, setTotalSetsLogged] = useState(0);

  const currentExercise = workout.exercises[exerciseIndex];
  const isLastExercise = exerciseIndex === workout.exercises.length - 1;
  const maxSets = currentExercise.targetSets + (extraSetUsed ? 0 : 1); // Allow 1 extra
  const completedTargetSets = currentSet > currentExercise.targetSets;

  // Load last logged values for current exercise
  useEffect(() => {
    async function loadLastLog() {
      const result = await getLastLogAction(currentExercise.id);
      if (result.success && result.lastLog) {
        setDefaultValues({
          reps: result.lastLog.reps,
          weight: result.lastLog.weight,
        });
      } else {
        setDefaultValues({
          weight: currentExercise.defaultWeight,
        });
      }
    }
    loadLastLog();
  }, [currentExercise.id, currentExercise.defaultWeight]);

  async function handleLogSet(reps: number, weight: number) {
    setIsLoading(true);

    const result = await logSetAction({
      workoutId: workout.id,
      exerciseId: currentExercise.id,
      setNumber: currentSet,
      reps,
      weight,
    });

    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error || 'Failed to log set');
      return;
    }

    toast.success(`Set logged! ${reps} reps @ ${weight}kg`);

    setTotalSetsLogged((prev) => prev + 1);
    setCurrentSet((prev) => prev + 1);
    setDefaultValues({ reps, weight });
  }

  function handleAddExtraSet() {
    setExtraSetUsed(true);
    // Already incremented by handleLogSet, so no need to increment again
  }

  function handleNextExercise() {
    if (isLastExercise) {
      setIsComplete(true);
    } else {
      setExerciseIndex((prev) => prev + 1);
      setCurrentSet(1);
      setExtraSetUsed(false);
    }
  }

  function handleChangeWorkout(workoutId: string) {
    router.push(`/workout?id=${workoutId}`);
    router.refresh();
  }

  if (isComplete) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Workout Complete!</CardTitle>
            <CardDescription className="text-center text-lg">
              {workout.exercises.length} exercises, {totalSetsLogged} total sets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push('/history')}
            >
              View History
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => router.refresh()}
            >
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      {/* Workout selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{workout.name}</h1>
        <Select value={workout.id.toString()} onValueChange={handleChangeWorkout}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allWorkouts.map((w) => (
              <SelectItem key={w.id} value={w.id.toString()}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress */}
      <div className="text-sm text-muted-foreground">
        Exercise {exerciseIndex + 1} of {workout.exercises.length}
      </div>

      {/* Exercise info */}
      <ExerciseDisplay
        exercise={currentExercise}
        currentSet={currentSet}
        totalSets={maxSets}
      />

      {/* Set logger */}
      {!completedTargetSets && (
        <SetLogger
          onLogSet={handleLogSet}
          defaultReps={defaultValues.reps}
          defaultWeight={defaultValues.weight}
          isLoading={isLoading}
        />
      )}

      {/* Action buttons after target sets */}
      {completedTargetSets && (
        <div className="space-y-4">
          {!extraSetUsed && currentSet === currentExercise.targetSets + 1 && (
            <>
              <SetLogger
                onLogSet={async (reps, weight) => {
                  await handleLogSet(reps, weight);
                  handleAddExtraSet();
                }}
                defaultReps={defaultValues.reps}
                defaultWeight={defaultValues.weight}
                isLoading={isLoading}
              />
              <p className="text-center text-sm text-muted-foreground">
                Feeling strong? Add one more set above, or move to next exercise below.
              </p>
            </>
          )}

          <Button
            size="lg"
            variant={extraSetUsed || currentSet > currentExercise.targetSets + 1 ? 'default' : 'secondary'}
            className="w-full h-16 text-xl"
            onClick={handleNextExercise}
          >
            {isLastExercise ? 'Finish Workout' : 'Next Exercise'}
          </Button>
        </div>
      )}
    </div>
  );
}
