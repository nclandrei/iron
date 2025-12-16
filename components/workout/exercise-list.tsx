'use client';

import { useState } from 'react';
import type { Exercise, ExerciseProgress } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CheckCircle, ArrowRight, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExerciseListProps {
  exercises: Exercise[];
  currentExerciseIndex: number;
  exerciseProgress: Map<number, ExerciseProgress>;
  onSelectExercise: (index: number) => void;
}

export function ExerciseList({
  exercises,
  currentExerciseIndex,
  exerciseProgress,
  onSelectExercise,
}: ExerciseListProps) {
  const [open, setOpen] = useState(false);

  function getExerciseStatus(exercise: Exercise, index: number): 'current' | 'completed' | 'not-started' {
    if (index === currentExerciseIndex) {
      return 'current';
    }

    const progress = exerciseProgress.get(exercise.id);
    if (progress?.targetSetsCompleted) {
      return 'completed';
    }

    return 'not-started';
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-9 px-3 py-2 shadow-xs font-normal">
          Exercises ({currentExerciseIndex + 1}/{exercises.length})
        </Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Exercises</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-2 pb-20 md:pb-0">
            {exercises.map((exercise, index) => {
            const status = getExerciseStatus(exercise, index);
            const progress = exerciseProgress.get(exercise.id);

            return (
              <button
                key={exercise.id}
                onClick={() => {
                  onSelectExercise(index);
                  setOpen(false);
                }}
                className={cn(
                  'w-full p-4 text-left rounded-lg border transition-colors',
                  status === 'current' && 'border-primary bg-primary/10',
                  status === 'completed' && 'border-green-500 bg-green-500/10',
                  status === 'not-started' && 'border-muted'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                      {status === 'current' && (
                        <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                      {status === 'not-started' && (
                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}

                      <span className="font-medium">{exercise.name}</span>
                    </div>

                    <div className="mt-1 text-sm text-muted-foreground ml-7">
                      {progress ? (
                        <span>
                          {progress.completedSets}/{exercise.targetSets} sets
                        </span>
                      ) : (
                        <span>0/{exercise.targetSets} sets</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
