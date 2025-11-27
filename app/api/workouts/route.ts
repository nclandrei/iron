import { NextResponse } from 'next/server';
import { getWorkouts, getWorkoutWithExercises } from '@/lib/db/queries';

export async function GET() {
  try {
    const workouts = await getWorkouts();
    const workoutsWithExercises = await Promise.all(
      workouts.map((w) => getWorkoutWithExercises(w.id))
    );

    return NextResponse.json(workoutsWithExercises.filter(w => w !== null));
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}
