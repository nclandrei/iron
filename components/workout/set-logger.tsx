'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface SetLoggerProps {
  onLogSet: (reps: number, weight: number) => Promise<void>;
  defaultReps?: number;
  defaultWeight?: number;
  isLoading?: boolean;
}

export function SetLogger({ onLogSet, defaultReps, defaultWeight, isLoading }: SetLoggerProps) {
  const [reps, setReps] = useState(defaultReps?.toString() || '');
  const [weight, setWeight] = useState(defaultWeight?.toString() || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const repsNum = parseInt(reps, 10);
    const weightNum = parseFloat(weight);

    if (isNaN(repsNum) || isNaN(weightNum) || repsNum <= 0 || weightNum <= 0) {
      return;
    }

    await onLogSet(repsNum, weightNum);

    // Keep the values for next set
    setReps(repsNum.toString());
    setWeight(weightNum.toString());
  }

  const isValid = reps && weight && parseInt(reps) > 0 && parseFloat(weight) > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-2xl h-16 text-center"
                min="0.1"
                max="999.9"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-16 text-xl"
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Logging...' : 'Log Set'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
