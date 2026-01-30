'use client';

import { useState, useEffect } from 'react';
import type { WorkoutWithExercises, Exercise } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExerciseEditor } from '@/components/manage/exercise-editor';
import { ExerciseCombobox } from '@/components/ui/exercise-combobox';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { addExerciseAction } from './actions';

export default function ManagePage() {
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingExerciseToWorkout, setAddingExerciseToWorkout] = useState<number | null>(null);
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: '3',
    repsMin: '6',
    repsMax: '12',
    weight: '20',
  });

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        const response = await fetch('/api/workouts');
        const data = await response.json();
        setWorkouts(data);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        toast.error('Failed to load workouts');
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkouts();
  }, []);

  async function handleAddExercise(workoutId: number) {
    if (!newExercise.name.trim()) {
      toast.error('Exercise name is required');
      return;
    }

    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;

    const orderIndex = workout.exercises.length + 1;

    const result = await addExerciseAction(workoutId, {
      name: newExercise.name,
      targetSets: parseInt(newExercise.sets),
      targetRepsMin: parseInt(newExercise.repsMin),
      targetRepsMax: parseInt(newExercise.repsMax),
      defaultWeight: parseFloat(newExercise.weight),
      orderIndex,
    });

    if (result.success) {
      toast.success('Exercise added', {
        description: `${newExercise.name} has been added`,
      });

      // Update local state
      setWorkouts(prev => prev.map(w => {
        if (w.id === workoutId && result.exercise) {
          return {
            ...w,
            exercises: [...w.exercises, result.exercise],
          };
        }
        return w;
      }));

      // Reset form
      setNewExercise({
        name: '',
        sets: '3',
        repsMin: '6',
        repsMax: '12',
        weight: '20',
      });
      setAddingExerciseToWorkout(null);
    } else {
      toast.error('Error', {
        description: result.error,
      });
    }
  }

  function handleDeleteExercise(workoutId: number, exerciseId: number) {
    setWorkouts(prev => prev.map(w => {
      if (w.id === workoutId) {
        return {
          ...w,
          exercises: w.exercises.filter(e => e.id !== exerciseId),
        };
      }
      return w;
    }));
  }

  function handleUpdateExercise(workoutId: number, updatedExercise: Exercise) {
    setWorkouts(prev => prev.map(w => {
      if (w.id === workoutId) {
        return {
          ...w,
          exercises: w.exercises.map(e => 
            e.id === updatedExercise.id ? updatedExercise : e
          ),
        };
      }
      return w;
    }));
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading workouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Manage Workouts</h1>

      <Tabs defaultValue={workouts[0]?.id.toString()} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {workouts.map((workout) => (
            <TabsTrigger key={workout.id} value={workout.id.toString()}>
              {workout.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {workouts.map((workout) => (
          <TabsContent key={workout.id} value={workout.id.toString()} className="space-y-4">
            {workout.exercises.map((exercise) => (
              <ExerciseEditor
                key={exercise.id}
                exercise={exercise}
                onDelete={() => handleDeleteExercise(workout.id, exercise.id)}
                onUpdate={(updated) => handleUpdateExercise(workout.id, updated)}
              />
            ))}

            {addingExerciseToWorkout === workout.id ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New Exercise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Exercise Name</Label>
                    <ExerciseCombobox
                      value={newExercise.name}
                      onValueChange={(name, exerciseDef) => {
                        setNewExercise({
                          ...newExercise,
                          name,
                          weight: exerciseDef ? exerciseDef.defaultWeight.toString() : newExercise.weight,
                        });
                      }}
                      placeholder="Select exercise..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-exercise-sets">Target Sets</Label>
                      <Input
                        id="new-exercise-sets"
                        type="number"
                        value={newExercise.sets}
                        onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                        min="1"
                        max="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-exercise-weight">Default Weight (kg)</Label>
                      <Input
                        id="new-exercise-weight"
                        type="number"
                        step="0.1"
                        value={newExercise.weight}
                        onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-exercise-reps-min">Min Reps</Label>
                      <Input
                        id="new-exercise-reps-min"
                        type="number"
                        value={newExercise.repsMin}
                        onChange={(e) => setNewExercise({ ...newExercise, repsMin: e.target.value })}
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-exercise-reps-max">Max Reps</Label>
                      <Input
                        id="new-exercise-reps-max"
                        type="number"
                        value={newExercise.repsMax}
                        onChange={(e) => setNewExercise({ ...newExercise, repsMax: e.target.value })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleAddExercise(workout.id)} className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Exercise
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAddingExerciseToWorkout(null)}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setAddingExerciseToWorkout(workout.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Exercise
              </Button>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
