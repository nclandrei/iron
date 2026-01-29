import { NextResponse } from 'next/server';
import { getWorkouts, getWorkoutWithExercises } from '@/lib/db/queries';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workouts = await getWorkouts(user.id);
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
