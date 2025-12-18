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
    const weight = Number(curr.weight) || 0;
    const reps = Number(curr.reps) || 0;

    const existingDate = acc.find((d) => d.date === curr.date);
    if (existingDate) {
      existingDate.totalWeight += weight;
      existingDate.totalReps += reps;
      existingDate.count += 1;
      existingDate.avgWeight = existingDate.totalWeight / existingDate.count;
      existingDate.avgReps = existingDate.totalReps / existingDate.count;
      existingDate.maxWeight = Math.max(existingDate.maxWeight, weight);
    } else {
      acc.push({
        date: curr.date,
        totalWeight: weight,
        totalReps: reps,
        count: 1,
        avgWeight: weight,
        avgReps: reps,
        maxWeight: weight,
      });
    }
    return acc;
  }, [] as Array<{ date: string; totalWeight: number; totalReps: number; count: number; avgWeight: number; avgReps: number; maxWeight: number }>);

  // Detect PRs
  let runningMax = 0;
  chartData.forEach((d) => {
    d.isPR = d.maxWeight > runningMax;
    runningMax = Math.max(runningMax, d.maxWeight);
  });

  // Calculate 3-point moving average for trend
  chartData.forEach((d, idx) => {
    if (idx >= 2) {
      const window = chartData.slice(idx - 2, idx + 1);
      d.weightTrend = window.reduce((sum, p) => sum + p.avgWeight, 0) / 3;
      d.repsTrend = window.reduce((sum, p) => sum + p.avgReps, 0) / 3;
    }
  });

  // Format dates for display
  const formattedData = chartData.map((d) => {
    const avgWeight = Number.isFinite(d.avgWeight) ? d.avgWeight : 0;
    const avgReps = Number.isFinite(d.avgReps) ? d.avgReps : 0;

    return {
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: parseFloat(avgWeight.toFixed(1)),
      reps: parseFloat(avgReps.toFixed(1)),
      weightTrend: d.weightTrend ? parseFloat(d.weightTrend.toFixed(1)) : undefined,
      repsTrend: d.repsTrend ? parseFloat(d.repsTrend.toFixed(1)) : undefined,
      isPR: d.isPR,
    };
  });

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

            {/* Weight line - blue */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="weight"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={(props) => {
                const isPR = formattedData[props.index]?.isPR;
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={isPR ? 6 : 4}
                    fill={isPR ? "#ef4444" : "#3b82f6"}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 6 }}
              name="Weight (kg)"
            />

            {/* Weight trend - dashed blue */}
            {formattedData.some(d => d.weightTrend) && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="weightTrend"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Weight Trend"
                opacity={0.5}
              />
            )}

            {/* Reps line - green */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="reps"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6 }}
              name="Reps"
            />

            {/* Reps trend - dashed green */}
            {formattedData.some(d => d.repsTrend) && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="repsTrend"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Reps Trend"
                opacity={0.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
