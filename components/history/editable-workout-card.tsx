'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Save, X, Trash2 } from 'lucide-react';
import { updateSetAction, deleteSetAction } from '@/app/history/actions';
import { toast } from 'sonner';

interface Set {
  id: number;
  setNumber: number;
  reps: number;
  weight: number;
}

interface Exercise {
  exerciseId: number;
  exerciseName: string;
  sets: Set[];
}

interface EditableWorkoutCardProps {
  exercises: Exercise[];
  dateStr: string;
  relativeTime: string;
  durationStr: string | null;
}

export function EditableWorkoutCard({
  exercises: initialExercises,
  dateStr,
  relativeTime,
  durationStr,
}: EditableWorkoutCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [exercises, setExercises] = useState(initialExercises);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setExercises(initialExercises);
    setIsEditing(false);
  };

  const handleSetChange = (
    exerciseId: number,
    setId: number,
    field: 'reps' | 'weight',
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.exerciseId !== exerciseId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set) => {
            if (set.id !== setId) return set;
            const numValue = field === 'reps' ? parseInt(value, 10) : parseFloat(value);
            if (isNaN(numValue)) return set;
            return { ...set, [field]: numValue };
          }),
        };
      })
    );
  };

  const handleDeleteSet = (exerciseId: number, setId: number) => {
    setExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.exerciseId !== exerciseId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.filter((set) => set.id !== setId),
        };
      })
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    const originalExercises = initialExercises;

    try {
      const updates: Array<{ logId: number; reps: number; weight: number }> = [];
      const deletes: number[] = [];

      exercises.forEach((exercise) => {
        const originalExercise = originalExercises.find(
          (e) => e.exerciseId === exercise.exerciseId
        );
        if (!originalExercise) return;

        const originalSetsMap = new Map(originalExercise.sets.map((s) => [s.id, s]));

        exercise.sets.forEach((set) => {
          const originalSet = originalSetsMap.get(set.id);
          if (!originalSet) return;

          if (set.reps !== originalSet.reps || set.weight !== originalSet.weight) {
            updates.push({ logId: set.id, reps: set.reps, weight: set.weight });
          }
        });

        originalExercise.sets.forEach((originalSet) => {
          const stillExists = exercise.sets.some((s) => s.id === originalSet.id);
          if (!stillExists) {
            deletes.push(originalSet.id);
          }
        });
      });

      const results = await Promise.allSettled([
        ...updates.map((update) =>
          updateSetAction(update.logId, update.reps, update.weight)
        ),
        ...deletes.map((logId) => deleteSetAction(logId)),
      ]);

      const failures = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
      if (failures.length > 0) {
        throw new Error('Some changes failed to save');
      }

      toast.success('Workout updated successfully');
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save workout');
      setExercises(originalExercises);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            {dateStr}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({relativeTime})
            </span>
            {durationStr && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                • {durationStr}
              </span>
            )}
          </CardTitle>
          {!isEditing ? (
            <Button variant="ghost" size="icon-sm" onClick={handleEdit}>
              <Edit2 className="size-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {exercises.map((exercise) => {
            if (isEditing) {
              return (
                <div key={exercise.exerciseId} className="space-y-2">
                  <div className="font-medium">{exercise.exerciseName}</div>
                  <div className="space-y-1 pl-6">
                    {exercise.sets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="w-16 text-muted-foreground text-right">
                          Set {set.setNumber}:
                        </span>
                        <Input
                          type="number"
                          value={set.reps}
                          onChange={(e) =>
                            handleSetChange(exercise.exerciseId, set.id, 'reps', e.target.value)
                          }
                          className="w-20 h-8 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          style={{ textAlign: 'center' }}
                          min="1"
                        />
                        <span className="text-muted-foreground">reps @</span>
                        <Input
                          type="number"
                          step="0.1"
                          value={set.weight}
                          onChange={(e) =>
                            handleSetChange(
                              exercise.exerciseId,
                              set.id,
                              'weight',
                              e.target.value
                            )
                          }
                          className="w-20 h-8 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          style={{ textAlign: 'center' }}
                          min="0"
                        />
                        <span className="text-muted-foreground">kg</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteSet(exercise.exerciseId, set.id)}
                          className="ml-auto"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            const setsDisplay = exercise.sets
              .map((set) => `${set.reps}@${set.weight}kg`)
              .join(', ');

            return (
              <div key={exercise.exerciseId} className="flex justify-between items-center">
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
}

