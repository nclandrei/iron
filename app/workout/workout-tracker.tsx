'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutWithExercises, Workout, ExerciseProgress, Exercise, WorkoutLog, TemporarySwap } from '@/lib/types';
import type { ExerciseAlternative } from '@/lib/config/exercise-swaps';
import { logSetAction, getLastLogAction, getWorkoutAction, getExerciseSuggestionAction, getTodayLogsAction, getLastSessionSetsAction, swapExercisePermanentlyAction } from './actions';
import { ExerciseDisplay } from '@/components/workout/exercise-display';
import { SetLogger } from '@/components/workout/set-logger';
import { ExerciseList } from '@/components/workout/exercise-list';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  saveWorkoutSession,
  loadWorkoutSession,
  clearWorkoutSession,
  buildExerciseProgress,
  getTodayDate,
  formatElapsedTime,
} from '@/lib/utils/workout-session';

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
  const [firstSetTime, setFirstSetTime] = useState<Date | null>(null);
  const [lastSetTime, setLastSetTime] = useState<Date | null>(null);
  const [suggestion, setSuggestion] = useState<{ type: 'weight' | 'reps'; message: string } | undefined>();
  const [lastSessionSets, setLastSessionSets] = useState<Array<{ setNumber: number; reps: number; weight: number }>>([]);
  const [exerciseProgress, setExerciseProgress] = useState<Map<number, ExerciseProgress>>(new Map());
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('0:00');
  const [temporarySwaps, setTemporarySwaps] = useState<TemporarySwap[]>([]);

  const isWorkoutActive = startedAt !== null;

  const currentExercise = workout.exercises[exerciseIndex];
  const isLastExercise = exerciseIndex === workout.exercises.length - 1;
  const maxSets = currentExercise.targetSets + (extraSetUsed ? 0 : 1); // Allow 1 extra
  const completedTargetSets = currentSet > currentExercise.targetSets;

  // Get display name for current exercise (check for temporary swap)
  const currentExerciseSwap = temporarySwaps.find(s => s.originalExerciseId === currentExercise.id);
  const currentExerciseDisplayName = currentExerciseSwap?.swappedName;

  // Sync workout state when initialWorkout prop changes (only if workout ID actually changed)
  // This handles cases where the URL changes directly (e.g., browser back/forward)
  useEffect(() => {
    if (workout.id !== initialWorkout.id) {
      setWorkout(initialWorkout);
      setExerciseIndex(0);
      setCurrentSet(1);
      setExtraSetUsed(false);
      setIsComplete(false);
      setTotalSetsLogged(0);
      setFirstSetTime(null);
      setLastSetTime(null);
      setExerciseProgress(new Map());
      setStartedAt(null);
      setTemporarySwaps([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWorkout.id]);

  // Helper function to find current exercise index based on progress
  function findCurrentExerciseIndex(
    exercises: Exercise[],
    progress: Map<number, ExerciseProgress>
  ): number {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const prog = progress.get(ex.id);

      if (!prog || !prog.targetSetsCompleted) {
        return i; // First incomplete exercise
      }
    }

    return exercises.length - 1; // All complete, stay on last
  }

  // Session restoration on mount
  useEffect(() => {
    let isCancelled = false;

    async function restoreSession() {
      setIsRestoringSession(true);

      // Capture workout ID at start to prevent race conditions
      const currentWorkoutId = workout.id;
      const currentExercises = workout.exercises;

      // Try to load from localStorage
      const savedSession = loadWorkoutSession();

      if (savedSession && savedSession.workoutId === currentWorkoutId) {
        // Verify workout hasn't changed before applying state
        if (isCancelled || workout.id !== currentWorkoutId) {
          setIsRestoringSession(false);
          return;
        }

        // Valid session for same workout and same day
        setExerciseIndex(savedSession.exerciseIndex);
        setCurrentSet(savedSession.currentSet);
        setExtraSetUsed(savedSession.extraSetUsed);
        setTotalSetsLogged(savedSession.totalSetsLogged);
        setFirstSetTime(savedSession.firstSetTime ? new Date(savedSession.firstSetTime) : null);
        setLastSetTime(savedSession.lastSetTime ? new Date(savedSession.lastSetTime) : null);
        setExerciseProgress(new Map(savedSession.exerciseProgress));
        setStartedAt(savedSession.startedAt ? new Date(savedSession.startedAt) : null);
        setTemporarySwaps(savedSession.temporarySwaps || []);
      } else {
        // No valid session - fetch today's logs from DB
        const result = await getTodayLogsAction(currentWorkoutId);

        // Verify workout hasn't changed while async operation was pending
        if (isCancelled || workout.id !== currentWorkoutId) {
          setIsRestoringSession(false);
          return;
        }

        if (result.success && result.logs && result.logs.length > 0) {
          // User logged sets today, rebuild progress
          const progress = buildExerciseProgress(currentExercises, result.logs as WorkoutLog[]);
          setExerciseProgress(progress);

          // Find current exercise (first incomplete exercise)
          const currentExIdx = findCurrentExerciseIndex(currentExercises, progress);
          setExerciseIndex(currentExIdx);

          // Set current set based on exercise progress
          const currentExProgress = progress.get(currentExercises[currentExIdx].id);
          const currentExercise = currentExercises[currentExIdx];
          const lastSetNumber = currentExProgress ? currentExProgress.lastSetNumber : 0;
          setCurrentSet(lastSetNumber + 1);
          
          // Restore extraSetUsed flag if current exercise has logged sets beyond target
          const hasExtraSet = lastSetNumber > currentExercise.targetSets;
          setExtraSetUsed(hasExtraSet);
          
          setTotalSetsLogged(result.logs.length);

          // Set times from logs
          const firstLog = result.logs[0];
          const lastLog = result.logs[result.logs.length - 1];
          setFirstSetTime(new Date(firstLog.loggedAt));
          setLastSetTime(new Date(lastLog.loggedAt));
        } else {
          // Fresh start - clear any stale session
          clearWorkoutSession();
        }
      }

      setIsRestoringSession(false);
    }

    restoreSession();

    // Cleanup function to cancel if workout changes
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout.id]); // Only run when workout changes

  // Load last logged values for current exercise (only on first set)
  useEffect(() => {
    async function loadLastLog() {
      const result = await getLastLogAction(currentExercise.id);
      const suggestionResult = await getExerciseSuggestionAction(currentExercise.id);
      const lastSessionResult = await getLastSessionSetsAction(currentExercise.id);

      // Store last session sets for reference
      if (lastSessionResult.success && lastSessionResult.sets) {
        setLastSessionSets(lastSessionResult.sets);
      } else {
        setLastSessionSets([]);
      }

      if (suggestionResult.success && suggestionResult.suggestion) {
        const suggestion = suggestionResult.suggestion;
        setDefaultValues({
          reps: suggestion.suggestedReps,
          weight: suggestion.suggestedWeight,
        });
        if (suggestion.shouldIncreaseWeight) {
          setSuggestion({
            type: 'weight',
            message: `Increase to ${suggestion.suggestedWeight}kg`,
          });
        } else {
          setSuggestion({
            type: 'reps',
            message: `Aim for ${suggestion.suggestedReps} reps`,
          });
        }
      } else {
        setSuggestion(undefined);
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
    }
    // Only load suggestions for the first set of each exercise
    // Subsequent sets will use the weight from the first logged set (via handleLogSet)
    if (currentSet === 1) {
      loadLastLog();
    }
  }, [currentExercise.id, currentExercise.defaultWeight, currentSet]);

  // Auto-save session to localStorage
  useEffect(() => {
    // Don't save during restoration or if workout not started
    if (isRestoringSession || !startedAt) return;

    // Debounce saves to avoid excessive writes
    const timeoutId = setTimeout(() => {
      const session = {
        workoutId: workout.id,
        exerciseIndex,
        currentSet,
        extraSetUsed,
        totalSetsLogged,
        firstSetTime: firstSetTime?.toISOString() ?? null,
        lastSetTime: lastSetTime?.toISOString() ?? null,
        sessionDate: getTodayDate(),
        exerciseProgress: Array.from(exerciseProgress.entries()),
        startedAt: startedAt?.toISOString() ?? null,
        temporarySwaps,
      };

      saveWorkoutSession(session);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    workout.id,
    exerciseIndex,
    currentSet,
    extraSetUsed,
    totalSetsLogged,
    firstSetTime,
    lastSetTime,
    exerciseProgress,
    isRestoringSession,
    startedAt,
    temporarySwaps,
  ]);

  // Timer effect - update elapsed time every second when workout is active
  useEffect(() => {
    if (!startedAt) return;

    const updateTimer = () => {
      setElapsedTime(formatElapsedTime(startedAt));
    };

    updateTimer(); // Initial update
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [startedAt]);

  // Auto-end workout after 30 minutes of inactivity
  useEffect(() => {
    if (!isWorkoutActive || !lastSetTime) return;

    const checkInactivity = () => {
      const now = new Date();
      const inactiveMs = now.getTime() - lastSetTime.getTime();
      const thirtyMinutesMs = 30 * 60 * 1000;

      if (inactiveMs > thirtyMinutesMs) {
        handleEndWorkout();
      }
    };

    const intervalId = setInterval(checkInactivity, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
    // handleEndWorkout is stable (only calls clearWorkoutSession and setIsComplete)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorkoutActive, lastSetTime]);

  async function handleLogSet(reps: number, weight: number) {
    setIsLoading(true);

    const now = new Date();
    if (!firstSetTime) {
      setFirstSetTime(now);
    }
    setLastSetTime(now);

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

    // Update exercise progress
    setExerciseProgress((prev) => {
      const updated = new Map(prev);
      const existing = updated.get(currentExercise.id) || {
        exerciseId: currentExercise.id,
        completedSets: 0,
        targetSetsCompleted: false,
        lastSetNumber: 0,
      };

      const newCompletedSets = existing.completedSets + 1;
      const targetReached = newCompletedSets >= currentExercise.targetSets;

      updated.set(currentExercise.id, {
        ...existing,
        completedSets: newCompletedSets,
        targetSetsCompleted: targetReached,
        lastSetNumber: currentSet,
      });

      return updated;
    });

    setCurrentSet((prev) => prev + 1);
    setDefaultValues({ reps, weight });
  }

  function handleAddExtraSet() {
    setExtraSetUsed(true);
    // Already incremented by handleLogSet, so no need to increment again
  }

  function handleNextExercise() {
    if (isLastExercise) {
      handleEndWorkout();
    } else {
      setExerciseIndex((prev) => prev + 1);
      setCurrentSet(1);
      setExtraSetUsed(false);
    }
  }

  function handleStartWorkout() {
    const now = new Date();
    setStartedAt(now);
    // Reset set times for fresh session (prevents old DB-restored times from being used)
    setFirstSetTime(null);
    setLastSetTime(null);
    
    // Save session immediately so it persists across tab navigation
    // Note: We preserve exercise progress from DB but don't carry over old set times
    // since this is a fresh workout start
    saveWorkoutSession({
      workoutId: workout.id,
      exerciseIndex,
      currentSet,
      extraSetUsed,
      totalSetsLogged,
      firstSetTime: null,
      lastSetTime: null,
      sessionDate: getTodayDate(),
      exerciseProgress: Array.from(exerciseProgress.entries()),
      startedAt: now.toISOString(),
      temporarySwaps: [],
    });
    
    toast.success('Workout started!');
  }

  function handleEndWorkout() {
    clearWorkoutSession();
    setIsComplete(true);
  }

  async function handleChangeWorkout(workoutId: string) {
    setIsLoading(true);

    // Clear current session when switching workouts
    clearWorkoutSession();

    const result = await getWorkoutAction(parseInt(workoutId));

    if (!result.success || !result.workout) {
      toast.error(result.error || 'Failed to load workout');
      setIsLoading(false);
      return;
    }

    // Update state with new workout
    setWorkout(result.workout);
    setExerciseIndex(0);
    setCurrentSet(1);
    setExtraSetUsed(false);
    setIsComplete(false);
    setTotalSetsLogged(0);
    setFirstSetTime(null);
    setLastSetTime(null);
    setExerciseProgress(new Map());
    setStartedAt(null);
    setTemporarySwaps([]);
    setIsLoading(false);

    // Update URL for deep linking
    router.replace(`/workout?id=${workoutId}`, { scroll: false });
  }

  async function handleSwapExercise(alternative: ExerciseAlternative, permanent: boolean) {
    if (permanent) {
      const result = await swapExercisePermanentlyAction(currentExercise.id, alternative);
      if (result.success && result.exercise) {
        // Update local workout state with new exercise name/weight
        setWorkout((prev) => ({
          ...prev,
          exercises: prev.exercises.map((ex) =>
            ex.id === currentExercise.id
              ? { ...ex, name: alternative.name, defaultWeight: alternative.defaultWeight }
              : ex
          ),
        }));
        toast.success(`Swapped to ${alternative.name} permanently`);
      } else {
        toast.error(result.error || 'Failed to swap exercise');
      }
    } else {
      // Temporary swap - store in session state
      setTemporarySwaps((prev) => {
        // Remove any existing swap for this exercise
        const filtered = prev.filter((s) => s.originalExerciseId !== currentExercise.id);
        return [
          ...filtered,
          {
            originalExerciseId: currentExercise.id,
            swappedName: alternative.name,
            swappedDefaultWeight: alternative.defaultWeight,
          },
        ];
      });
      // Update default weight for current exercise
      setDefaultValues((prev) => ({ ...prev, weight: alternative.defaultWeight }));
      toast.success(`Swapped to ${alternative.name} for today`);
    }
  }

  function handleSelectExercise(index: number) {
    const targetExercise = workout.exercises[index];
    const progress = exerciseProgress.get(targetExercise.id);

    if (!progress) {
      // Not started → Set 1
      setExerciseIndex(index);
      setCurrentSet(1);
      setExtraSetUsed(false);
    } else if (progress.targetSetsCompleted) {
      // Completed → Review mode (next set after last)
      setExerciseIndex(index);
      setCurrentSet(progress.lastSetNumber + 1);
      setExtraSetUsed(progress.lastSetNumber > targetExercise.targetSets);
    } else {
      // Partial → Continue mode (next set after last)
      setExerciseIndex(index);
      setCurrentSet(progress.lastSetNumber + 1);
      setExtraSetUsed(false);
    }
  }

  if (isComplete) {
    const formatDuration = (minutes: number) => {
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const workoutDuration =
      firstSetTime && lastSetTime
        ? Math.round((lastSetTime.getTime() - firstSetTime.getTime()) / 1000 / 60)
        : null;

    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Workout Complete!</CardTitle>
            <CardDescription className="text-center text-lg">
              {workout.exercises.length} exercises, {totalSetsLogged} total sets
              {workoutDuration !== null && ` • ${formatDuration(workoutDuration)}`}
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
              onClick={() => {
                window.location.href = '/workout';
              }}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{workout.name}</h1>
          {isWorkoutActive && (
            <span className="text-lg font-mono text-muted-foreground">{elapsedTime}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isWorkoutActive && (
            <ExerciseList
              exercises={workout.exercises}
              currentExerciseIndex={exerciseIndex}
              exerciseProgress={exerciseProgress}
              onSelectExercise={handleSelectExercise}
            />
          )}

          <Select value={workout.id.toString()} onValueChange={handleChangeWorkout} disabled={isWorkoutActive}>
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
      </div>

      {/* Start/End Workout buttons */}
      {!isWorkoutActive ? (
        <Button size="lg" className="w-full h-16 text-xl" onClick={handleStartWorkout}>
          Start Workout
        </Button>
      ) : (
        <>
          {/* Progress */}
          <div className="text-sm text-muted-foreground">
            Exercise {exerciseIndex + 1} of {workout.exercises.length}
          </div>

      {/* Exercise info */}
      <ExerciseDisplay
        exercise={currentExercise}
        currentSet={currentSet}
        totalSets={maxSets}
        displayName={currentExerciseDisplayName}
        onSwap={handleSwapExercise}
      />

      {/* Set logger */}
      {!completedTargetSets && (
        <SetLogger
          onLogSet={handleLogSet}
          defaultReps={defaultValues.reps}
          defaultWeight={defaultValues.weight}
          isLoading={isLoading}
          suggestion={suggestion}
          currentSetNumber={currentSet}
          lastSessionSets={lastSessionSets}
        />
      )}

      {/* Review mode indicator */}
      {completedTargetSets && extraSetUsed && (
        <Card className="border-green-500 bg-green-500/10">
          <CardContent>
            <p className="text-center text-sm">
              ✓ All sets completed for this exercise (review mode)
            </p>
          </CardContent>
        </Card>
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
                suggestion={undefined}
                currentSetNumber={currentSet}
                lastSessionSets={lastSessionSets}
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

          {/* End Workout button */}
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={handleEndWorkout}
          >
            End Workout
          </Button>
        </>
      )}
    </div>
  );
}
