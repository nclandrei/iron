'use client';

import { useState } from 'react';
import type { Exercise } from '@/lib/types';
import { updateExerciseAction, deleteExerciseAction } from '@/app/manage/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExerciseEditorProps {
  exercise: Exercise;
  onDelete: () => void;
}

export function ExerciseEditor({ exercise, onDelete }: ExerciseEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState(exercise.name);
  const [sets, setSets] = useState(exercise.targetSets.toString());
  const [repsMin, setRepsMin] = useState(exercise.targetRepsMin.toString());
  const [repsMax, setRepsMax] = useState(exercise.targetRepsMax.toString());
  const [weight, setWeight] = useState(exercise.defaultWeight.toString());

  async function handleSave() {
    setIsSaving(true);
    const result = await updateExerciseAction(exercise.id, {
      name,
      targetSets: parseInt(sets),
      targetRepsMin: parseInt(repsMin),
      targetRepsMax: parseInt(repsMax),
      defaultWeight: parseFloat(weight),
    });

    if (result.success) {
      toast.success('Exercise updated', {
        description: `${name} has been updated`,
      });
      setIsEditing(false);
    } else {
      toast.error('Error', {
        description: result.error,
      });
    }
    setIsSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete ${exercise.name}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteExerciseAction(exercise.id);

    if (result.success) {
      toast.success('Exercise deleted', {
        description: `${exercise.name} has been deleted`,
      });
      onDelete();
    } else {
      toast.error('Error', {
        description: result.error,
      });
    }
    setIsDeleting(false);
  }

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">{exercise.name}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={isDeleting}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} loading={isDeleting}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {exercise.targetSets} sets × {exercise.targetRepsMin}-{exercise.targetRepsMax} reps @ {exercise.defaultWeight}kg
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`name-${exercise.id}`}>Exercise Name</Label>
          <Input
            id={`name-${exercise.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`sets-${exercise.id}`}>Target Sets</Label>
            <Input
              id={`sets-${exercise.id}`}
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              min="1"
              max="10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`weight-${exercise.id}`}>Default Weight (kg)</Label>
            <Input
              id={`weight-${exercise.id}`}
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`reps-min-${exercise.id}`}>Min Reps</Label>
            <Input
              id={`reps-min-${exercise.id}`}
              type="number"
              value={repsMin}
              onChange={(e) => setRepsMin(e.target.value)}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`reps-max-${exercise.id}`}>Max Reps</Label>
            <Input
              id={`reps-max-${exercise.id}`}
              type="number"
              value={repsMax}
              onChange={(e) => setRepsMax(e.target.value)}
              min="1"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1" loading={isSaving}>
            Save
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1" disabled={isSaving}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
