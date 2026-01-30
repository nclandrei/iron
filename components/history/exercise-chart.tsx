'use client';

import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Exercise } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ExerciseChartProps {
  exercise: Exercise;
  data: Array<{ date: string; setNumber: number; reps: number; weight: number }>;
}

export function ExerciseChart({ exercise, data }: ExerciseChartProps) {
  const hasData = data.length > 0;
  const [viewMode, setViewMode] = useState<'performance' | 'load'>('performance');

  const { formattedData, insights, recommendation } = useMemo(() => {
    const buildTrend = (points: number[], windowSize = 4) => {
      if (points.length < windowSize + 1) {
        return { direction: 'neutral' as const, delta: 0 };
      }

      const recent = points.slice(-windowSize);
      const previous = points.slice(-windowSize - 1, -1);
      const avgRecent = recent.reduce((sum, value) => sum + value, 0) / recent.length;
      const avgPrev = previous.reduce((sum, value) => sum + value, 0) / previous.length;
      const delta = avgPrev === 0 ? 0 : (avgRecent - avgPrev) / avgPrev;

      if (delta > 0.03) return { direction: 'up' as const, delta };
      if (delta < -0.03) return { direction: 'down' as const, delta };
      return { direction: 'flat' as const, delta };
    };

    // Group by date and calculate average weight and reps
    const chartData = data.reduce((acc, curr) => {
      const weight = Number(curr.weight) || 0;
      const reps = Number(curr.reps) || 0;
      const volume = weight * reps;
      const e1rm = reps > 0 ? weight * (1 + reps / 30) : 0;

      const existingDate = acc.find((d) => d.date === curr.date);
      if (existingDate) {
        existingDate.totalWeight += weight;
        existingDate.totalReps += reps;
        existingDate.totalVolume += volume;
        existingDate.count += 1;
        existingDate.avgWeight = existingDate.totalWeight / existingDate.count;
        existingDate.avgReps = existingDate.totalReps / existingDate.count;
        existingDate.maxWeight = Math.max(existingDate.maxWeight, weight);
        existingDate.maxE1rm = Math.max(existingDate.maxE1rm, e1rm);
      } else {
        acc.push({
          date: curr.date,
          totalWeight: weight,
          totalReps: reps,
          totalVolume: volume,
          count: 1,
          avgWeight: weight,
          avgReps: reps,
          maxWeight: weight,
          maxE1rm: e1rm,
        });
      }
      return acc;
    }, [] as Array<{
      date: string;
      totalWeight: number;
      totalReps: number;
      totalVolume: number;
      count: number;
      avgWeight: number;
      avgReps: number;
      maxWeight: number;
      maxE1rm: number;
      isPR?: boolean;
      weightTrend?: number;
      repsTrend?: number;
      volumeTrend?: number;
      e1rmTrend?: number;
    }>);

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
        d.volumeTrend = window.reduce((sum, p) => sum + p.totalVolume, 0) / 3;
        d.e1rmTrend = window.reduce((sum, p) => sum + p.maxE1rm, 0) / 3;
      }
    });

    // Format dates for display
    const formatted = chartData.map((d) => {
      const avgWeight = Number.isFinite(d.avgWeight) ? d.avgWeight : 0;
      const avgReps = Number.isFinite(d.avgReps) ? d.avgReps : 0;

      return {
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: parseFloat(avgWeight.toFixed(1)),
        reps: parseFloat(avgReps.toFixed(1)),
        volume: parseFloat(d.totalVolume.toFixed(0)),
        e1rm: parseFloat(d.maxE1rm.toFixed(1)),
        weightTrend: d.weightTrend ? parseFloat(d.weightTrend.toFixed(1)) : undefined,
        repsTrend: d.repsTrend ? parseFloat(d.repsTrend.toFixed(1)) : undefined,
        volumeTrend: d.volumeTrend ? parseFloat(d.volumeTrend.toFixed(0)) : undefined,
        e1rmTrend: d.e1rmTrend ? parseFloat(d.e1rmTrend.toFixed(1)) : undefined,
        isPR: d.isPR,
      };
    });

    const volumeTrend = buildTrend(formatted.map((item) => item.volume));
    const e1rmTrend = buildTrend(formatted.map((item) => item.e1rm));
    const weightTrend = buildTrend(formatted.map((item) => item.weight));

    const latest = formatted[formatted.length - 1];
    const previous = formatted.length > 1 ? formatted[formatted.length - 2] : undefined;
    const lastVolumeDelta = previous ? latest.volume - previous.volume : 0;
    const lastE1rmDelta = previous ? latest.e1rm - previous.e1rm : 0;
    const lastWeightDelta = previous ? latest.weight - previous.weight : 0;

    let recommendationText = 'Keep the same plan and focus on clean reps.';
    if (volumeTrend.direction === 'down' && e1rmTrend.direction === 'down') {
      recommendationText = 'Consider a deload or drop 1 set to recover.';
    } else if (volumeTrend.direction === 'flat' && e1rmTrend.direction === 'flat') {
      recommendationText = 'Add 1 set or small weight bump next session.';
    } else if (volumeTrend.direction === 'up' && e1rmTrend.direction === 'flat') {
      recommendationText = 'Increase load slightly to match the volume trend.';
    } else if (volumeTrend.direction === 'flat' && e1rmTrend.direction === 'up') {
      recommendationText = 'Add a back-off set to grow volume.';
    }

    return {
      formattedData: formatted,
      insights: {
        volumeTrend,
        e1rmTrend,
        weightTrend,
        lastVolumeDelta,
        lastE1rmDelta,
        lastWeightDelta,
        latestDate: latest?.date ?? '',
      },
      recommendation: recommendationText,
    };
  }, [data]);

  const insightItems = [
    {
      label: 'Volume',
      direction: insights.volumeTrend.direction,
      delta: insights.lastVolumeDelta,
    },
    {
      label: 'E1RM',
      direction: insights.e1rmTrend.direction,
      delta: insights.lastE1rmDelta,
    },
    {
      label: 'Weight',
      direction: insights.weightTrend.direction,
      delta: insights.lastWeightDelta,
    },
  ];

  const badgeStyles = {
    up: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    down: 'bg-rose-50 text-rose-700 border-rose-200',
    flat: 'bg-amber-50 text-amber-700 border-amber-200',
    neutral: 'bg-muted text-muted-foreground border-border',
  } as const;

  const renderDelta = (value: number, unit: string) => {
    if (!Number.isFinite(value) || value === 0) return '0';
    const formatted = Math.abs(value) < 10 ? value.toFixed(1) : value.toFixed(0);
    return `${value > 0 ? '+' : '-'}${Math.abs(Number(formatted))}${unit}`;
  };

  if (!hasData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{exercise.name}</CardTitle>
        <CardDescription>Progressive overload tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {insightItems.map((item) => (
              <span
                key={item.label}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${badgeStyles[item.direction]}`}
              >
                <span>{item.label}</span>
                <span className="font-semibold">
                  {item.direction === 'neutral' ? '—' : item.direction.toUpperCase()}
                </span>
                <span className="text-[11px]">
                  {item.label === 'Volume'
                    ? renderDelta(item.delta, '')
                    : renderDelta(item.delta, 'kg')}
                </span>
              </span>
            ))}
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
              Last: {insights.latestDate || '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('performance')}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                viewMode === 'performance'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Performance
            </button>
            <button
              type="button"
              onClick={() => setViewMode('load')}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                viewMode === 'load'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Load
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Recommendation: {recommendation}</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />

            {viewMode === 'performance' ? (
              <>
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
                {formattedData.some((d) => d.weightTrend) && (
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
                {formattedData.some((d) => d.repsTrend) && (
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
              </>
            ) : (
              <>
                {/* Volume line - purple */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="volume"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                  name="Volume"
                />

                {/* Volume trend - dashed purple */}
                {formattedData.some((d) => d.volumeTrend) && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="volumeTrend"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Volume Trend"
                    opacity={0.5}
                  />
                )}

                {/* E1RM line - amber */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="e1rm"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                  name="E1RM (kg)"
                />

                {/* E1RM trend - dashed amber */}
                {formattedData.some((d) => d.e1rmTrend) && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="e1rmTrend"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="E1RM Trend"
                    opacity={0.5}
                  />
                )}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
