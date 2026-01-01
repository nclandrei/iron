'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface SetLoggerProps {
  onLogSet: (reps: number, weight: number) => Promise<void>;
  defaultReps?: number;
  defaultWeight?: number;
  isLoading?: boolean;
  suggestion?: { type: 'weight' | 'reps'; message: string };
  currentSetNumber?: number;
  lastSessionSets?: Array<{ setNumber: number; reps: number; weight: number }>;
}

export function SetLogger({ onLogSet, defaultReps, defaultWeight, isLoading, suggestion, currentSetNumber, lastSessionSets }: SetLoggerProps) {
  const [reps, setReps] = useState(defaultReps?.toString() || '');
  const [weight, setWeight] = useState(defaultWeight?.toString() || '');

  // Update state when default values change (e.g., moving to next exercise)
  useEffect(() => {
    setReps(defaultReps?.toString() || '');
    setWeight(defaultWeight?.toString() || '');
  }, [defaultReps, defaultWeight]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const repsNum = parseInt(reps, 10);
    // Normalize comma to period for parsing
    const weightNum = parseFloat(weight.replace(',', '.'));

    if (isNaN(repsNum) || isNaN(weightNum) || repsNum <= 0 || weightNum <= 0) {
      return;
    }

    await onLogSet(repsNum, weightNum);

    // Keep the values for next set, normalized to period
    setReps(repsNum.toString());
    setWeight(weightNum.toString().replace(',', '.'));
  }

  const isValid = reps && weight && parseInt(reps) > 0 && parseFloat(weight.replace(',', '.')) > 0;

  // Find matching set from last session by set number
  const lastSetData = currentSetNumber && lastSessionSets
    ? lastSessionSets.find(set => set.setNumber === currentSetNumber)
    : undefined;

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {suggestion && (
            <p className="text-sm text-muted-foreground text-center">
              {suggestion.message}
            </p>
          )}
          {lastSetData && (
            <p className="text-xs text-muted-foreground text-center">
              Last workout: {lastSetData.weight}kg × {lastSetData.reps} reps
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reps" className="text-lg">Reps</Label>
              <Input
                id="reps"
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="text-2xl h-16 text-center"
                min="1"
                max="999"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-lg">Weight (kg)</Label>
              <Input
                id="weight"
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-2xl h-16 text-center"
                placeholder="0.0"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-16 text-xl"
            disabled={!isValid}
            loading={isLoading}
          >
            Log Set
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
