'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Exercise } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ExerciseChartProps {
  exercise: Exercise;
  data: Array<{ date: string; setNumber: number; reps: number; weight: number }>;
}

export function ExerciseChart({ exercise, data }: ExerciseChartProps) {
  if (data.length === 0) {
    return null;
  }

  // Group by date and calculate average weight and reps
  const chartData = data.reduce((acc, curr) => {
    const existingDate = acc.find((d) => d.date === curr.date);
    if (existingDate) {
      existingDate.totalWeight += curr.weight;
      existingDate.totalReps += curr.reps;
      existingDate.count += 1;
      existingDate.avgWeight = existingDate.totalWeight / existingDate.count;
      existingDate.avgReps = existingDate.totalReps / existingDate.count;
    } else {
      acc.push({
        date: curr.date,
        totalWeight: curr.weight,
        totalReps: curr.reps,
        count: 1,
        avgWeight: curr.weight,
        avgReps: curr.reps,
      });
    }
    return acc;
  }, [] as Array<{ date: string; totalWeight: number; totalReps: number; count: number; avgWeight: number; avgReps: number }>);

  // Format dates for display
  const formattedData = chartData.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: parseFloat(d.avgWeight.toFixed(1)),
    reps: parseFloat(d.avgReps.toFixed(1)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{exercise.name}</CardTitle>
        <CardDescription>Progressive overload tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="weight"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Weight (kg)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="reps"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Reps"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
