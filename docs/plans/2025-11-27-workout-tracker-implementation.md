# Workout Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first workout tracking web app with authentication, workout logging, history visualization, and workout management.

**Architecture:** Next.js 14+ App Router with TypeScript, Vercel Postgres database, shadcn/ui components, iron-session authentication with 10-year cookie expiration.

**Tech Stack:** Next.js, TypeScript, Vercel Postgres, shadcn/ui, Tailwind CSS, Recharts, iron-session

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: Project root with Next.js 14+
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `.gitignore`

**Step 1: Initialize Next.js with TypeScript**

Run:
```bash
npx create-next-app@latest workout-tracker --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

When prompted:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- App Router: Yes
- Customize default import alias: No (use @/*)

**Step 2: Navigate to project directory**

Run:
```bash
cd workout-tracker
```

**Step 3: Install additional dependencies**

Run:
```bash
npm install @vercel/postgres iron-session recharts zod
npm install -D @types/node
```

**Step 4: Initialize shadcn/ui**

Run:
```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

**Step 5: Install shadcn components**

Run:
```bash
npx shadcn@latest add button input label card tabs select toast navigation-menu
```

**Step 6: Verify installation**

Run:
```bash
npm run dev
```

Expected: Dev server starts on http://localhost:3000

**Step 7: Initialize git repository**

Run:
```bash
git init
git add .
git commit -m "chore: initialize Next.js project with shadcn/ui"
```

---

## Task 2: Set Up Database Schema and Types

**Files:**
- Create: `lib/db/schema.sql`
- Create: `lib/types/index.ts`
- Create: `lib/db/client.ts`

**Step 1: Create database schema file**

Create `lib/db/schema.sql`:

```sql
-- Workouts table: 4 workout templates
CREATE TABLE IF NOT EXISTS workouts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  day_of_week INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Exercises table: exercises within each workout
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  target_sets INTEGER NOT NULL,
  target_reps_min INTEGER NOT NULL,
  target_reps_max INTEGER NOT NULL,
  default_weight DECIMAL(5,1) NOT NULL
);

-- Workout logs table: append-only set logging
CREATE TABLE IF NOT EXISTS workout_logs (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER NOT NULL REFERENCES workouts(id),
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  logged_at TIMESTAMP DEFAULT NOW(),
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight DECIMAL(5,1) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_exercise ON workout_logs(exercise_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout ON workout_logs(workout_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_workout ON exercises(workout_id, order_index);
```

**Step 2: Create TypeScript types**

Create `lib/types/index.ts`:

```typescript
export interface Workout {
  id: number;
  name: string;
  dayOfWeek: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: number;
  workoutId: number;
  orderIndex: number;
  name: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  defaultWeight: number;
}

export interface WorkoutLog {
  id: number;
  workoutId: number;
  exerciseId: number;
  loggedAt: Date;
  setNumber: number;
  reps: number;
  weight: number;
}

export interface WorkoutWithExercises extends Workout {
  exercises: Exercise[];
}

export interface SetLogInput {
  exerciseId: number;
  workoutId: number;
  setNumber: number;
  reps: number;
  weight: number;
}

export interface ExerciseWithLastLog extends Exercise {
  lastReps?: number;
  lastWeight?: number;
}
```

**Step 3: Create database client**

Create `lib/db/client.ts`:

```typescript
import { sql } from '@vercel/postgres';

export { sql };

export async function query<T>(
  queryText: string,
  params?: any[]
): Promise<{ rows: T[] }> {
  try {
    const result = await sql.query(queryText, params);
    return { rows: result.rows as T[] };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
```

**Step 4: Create environment variables template**

Create `.env.local`:

```bash
# Vercel Postgres (will be auto-populated by Vercel)
POSTGRES_URL=""
POSTGRES_PRISMA_URL=""
POSTGRES_URL_NON_POOLING=""
POSTGRES_USER=""
POSTGRES_HOST=""
POSTGRES_PASSWORD=""
POSTGRES_DATABASE=""

# Authentication
WORKOUT_PASSWORD="your-secure-password-here"
SESSION_SECRET="generate-a-32-char-random-string-here"
```

**Step 5: Add .env.local to .gitignore**

Verify `.env.local` is in `.gitignore` (should be by default with Next.js)

**Step 6: Commit database setup**

Run:
```bash
git add lib/db lib/types .env.local
git commit -m "feat: add database schema and TypeScript types"
```

---

## Task 3: Set Up Authentication System

**Files:**
- Create: `lib/auth/session.ts`
- Create: `lib/auth/password.ts`
- Create: `middleware.ts`

**Step 1: Create session management**

Create `lib/auth/session.ts`:

```typescript
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  isAuthenticated: boolean;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'workout_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 years in seconds
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isAuthenticated === true;
}
```

**Step 2: Create password verification utility**

Create `lib/auth/password.ts`:

```typescript
export function verifyPassword(inputPassword: string): boolean {
  const correctPassword = process.env.WORKOUT_PASSWORD;

  if (!correctPassword) {
    throw new Error('WORKOUT_PASSWORD environment variable is not set');
  }

  return inputPassword === correctPassword;
}
```

**Step 3: Create middleware for route protection**

Create `middleware.ts` in project root:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData } from './lib/auth/session';

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'workout_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365 * 10,
  },
};

export async function middleware(request: NextRequest) {
  const session = await getIronSession<SessionData>(
    request,
    NextResponse.next(),
    sessionOptions
  );

  // Allow access to login page
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  // Check if authenticated
  if (!session.isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Step 4: Test session secret generation**

Run in terminal to generate a secure secret:
```bash
openssl rand -base64 32
```

Copy the output and paste it as SESSION_SECRET in `.env.local`

**Step 5: Commit authentication setup**

Run:
```bash
git add lib/auth middleware.ts
git commit -m "feat: add iron-session authentication with 10-year expiration"
```

---

## Task 4: Create Login Page

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/login/actions.ts`

**Step 1: Create login server action**

Create `app/login/actions.ts`:

```typescript
'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/auth/password';

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;

  if (!password) {
    return { error: 'Password is required' };
  }

  const isValid = verifyPassword(password);

  if (!isValid) {
    return { error: 'Invalid password' };
  }

  // Set session
  const session = await getSession();
  session.isAuthenticated = true;
  await session.save();

  redirect('/workout');
}
```

**Step 2: Create login page component**

Create `app/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { loginAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Workout Tracker</CardTitle>
          <CardDescription>Enter your password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                className="text-base"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600" role="alert">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Update root layout to redirect authenticated users**

Create `app/page.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/session';

export default async function HomePage() {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect('/workout');
  } else {
    redirect('/login');
  }
}
```

**Step 4: Test login flow**

Run:
```bash
npm run dev
```

Expected:
- Navigate to http://localhost:3000
- Should redirect to /login
- Enter password from .env.local
- Should redirect to /workout (will 404 for now, but auth works)

**Step 5: Commit login page**

Run:
```bash
git add app/login app/page.tsx
git commit -m "feat: add login page with password authentication"
```

---

## Task 5: Create Database Seed Script

**Files:**
- Create: `lib/db/seed.ts`
- Create: `scripts/seed.sh`

**Step 1: Create seed data script**

Create `lib/db/seed.ts`:

```typescript
import { sql } from '@vercel/postgres';

async function seed() {
  try {
    console.log('Creating tables...');

    // Create workouts table
    await sql`
      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        day_of_week INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Create exercises table
    await sql`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        target_sets INTEGER NOT NULL,
        target_reps_min INTEGER NOT NULL,
        target_reps_max INTEGER NOT NULL,
        default_weight DECIMAL(5,1) NOT NULL
      );
    `;

    // Create workout_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id SERIAL PRIMARY KEY,
        workout_id INTEGER NOT NULL REFERENCES workouts(id),
        exercise_id INTEGER NOT NULL REFERENCES exercises(id),
        logged_at TIMESTAMP DEFAULT NOW(),
        set_number INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        weight DECIMAL(5,1) NOT NULL
      );
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_workout_logs_exercise ON workout_logs(exercise_id, logged_at DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_workout_logs_workout ON workout_logs(workout_id, logged_at DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_exercises_workout ON exercises(workout_id, order_index);`;

    console.log('Tables created. Seeding workouts...');

    // Insert workouts
    const workouts = [
      { name: 'Upper 1', day: 1 }, // Monday
      { name: 'Lower 1', day: 2 }, // Tuesday
      { name: 'Upper 2', day: 4 }, // Thursday
      { name: 'Lower 2', day: 5 }, // Friday
    ];

    for (const workout of workouts) {
      await sql`
        INSERT INTO workouts (name, day_of_week)
        VALUES (${workout.name}, ${workout.day})
        ON CONFLICT DO NOTHING;
      `;
    }

    console.log('Workouts seeded. Seeding exercises...');

    // Get workout IDs
    const { rows: workoutRows } = await sql`SELECT id, name FROM workouts ORDER BY id;`;
    const workoutMap = new Map(workoutRows.map((w: any) => [w.name, w.id]));

    // Upper 1 exercises
    const upper1Exercises = [
      { name: 'Flat BB press', sets: 3, repsMin: 6, repsMax: 8, weight: 80 },
      { name: 'Cable row', sets: 3, repsMin: 6, repsMax: 8, weight: 81 },
      { name: 'Incline DB press', sets: 3, repsMin: 10, repsMax: 12, weight: 24 },
      { name: 'Assisted chin-ups', sets: 3, repsMin: 10, repsMax: 12, weight: 20.4 },
      { name: 'Machine lat raises', sets: 3, repsMin: 10, repsMax: 12, weight: 50 },
      { name: 'DB curl', sets: 2, repsMin: 10, repsMax: 12, weight: 12 },
      { name: 'Overhead triceps extension', sets: 2, repsMin: 10, repsMax: 12, weight: 34 },
    ];

    // Lower 1 exercises
    const lower1Exercises = [
      { name: 'Back squat', sets: 3, repsMin: 6, repsMax: 8, weight: 110 },
      { name: 'RDL', sets: 3, repsMin: 6, repsMax: 8, weight: 90 },
      { name: 'Leg extensions', sets: 3, repsMin: 10, repsMax: 12, weight: 68 },
      { name: 'Lying curls', sets: 3, repsMin: 10, repsMax: 12, weight: 63 },
      { name: 'Calf raises', sets: 3, repsMin: 10, repsMax: 15, weight: 106 },
      { name: 'Abs', sets: 3, repsMin: 10, repsMax: 15, weight: 81 },
    ];

    // Upper 2 exercises
    const upper2Exercises = [
      { name: 'Flat BB press', sets: 3, repsMin: 6, repsMax: 8, weight: 80 },
      { name: 'BB row', sets: 3, repsMin: 6, repsMax: 8, weight: 70 },
      { name: 'Incline DB press', sets: 3, repsMin: 10, repsMax: 12, weight: 24 },
      { name: 'Machine lat pulldown', sets: 3, repsMin: 10, repsMax: 12, weight: 52 },
      { name: 'Machine lat raises', sets: 3, repsMin: 10, repsMax: 12, weight: 50 },
      { name: 'BB curl', sets: 2, repsMin: 10, repsMax: 12, weight: 22.5 },
      { name: 'Triceps pressdown', sets: 2, repsMin: 10, repsMax: 12, weight: 50 },
    ];

    // Lower 2 exercises
    const lower2Exercises = [
      { name: 'Leg press', sets: 3, repsMin: 6, repsMax: 8, weight: 255 },
      { name: 'RDL', sets: 3, repsMin: 6, repsMax: 8, weight: 90 },
      { name: 'Leg extensions', sets: 3, repsMin: 10, repsMax: 12, weight: 68 },
      { name: 'Lying curls', sets: 3, repsMin: 10, repsMax: 12, weight: 63 },
      { name: 'Calf raises', sets: 3, repsMin: 10, repsMax: 15, weight: 108 },
      { name: 'Abs', sets: 3, repsMin: 10, repsMax: 15, weight: 86 },
    ];

    const exerciseSets = [
      { workoutName: 'Upper 1', exercises: upper1Exercises },
      { workoutName: 'Lower 1', exercises: lower1Exercises },
      { workoutName: 'Upper 2', exercises: upper2Exercises },
      { workoutName: 'Lower 2', exercises: lower2Exercises },
    ];

    for (const set of exerciseSets) {
      const workoutId = workoutMap.get(set.workoutName);
      if (!workoutId) continue;

      for (let i = 0; i < set.exercises.length; i++) {
        const ex = set.exercises[i];
        await sql`
          INSERT INTO exercises (workout_id, order_index, name, target_sets, target_reps_min, target_reps_max, default_weight)
          VALUES (${workoutId}, ${i + 1}, ${ex.name}, ${ex.sets}, ${ex.repsMin}, ${ex.repsMax}, ${ex.weight})
          ON CONFLICT DO NOTHING;
        `;
      }
    }

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed();
```

**Step 2: Add seed script to package.json**

Edit `package.json` and add to scripts:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "seed": "tsx lib/db/seed.ts"
}
```

**Step 3: Install tsx for running TypeScript scripts**

Run:
```bash
npm install -D tsx
```

**Step 4: Test seed script locally (skip if no local Vercel Postgres)**

Note: This requires Vercel Postgres connection string in .env.local

Run:
```bash
npm run seed
```

Expected: Tables created and data seeded (or error if DB not connected yet)

**Step 5: Commit seed script**

Run:
```bash
git add lib/db/seed.ts package.json
git commit -m "feat: add database seed script with workout data"
```

---

## Task 6: Create Database Query Functions

**Files:**
- Create: `lib/db/queries.ts`

**Step 1: Create query functions**

Create `lib/db/queries.ts`:

```typescript
import { sql } from './client';
import type {
  Workout,
  Exercise,
  WorkoutLog,
  WorkoutWithExercises,
  ExerciseWithLastLog,
  SetLogInput,
} from '../types';

// Get all workouts
export async function getWorkouts(): Promise<Workout[]> {
  const { rows } = await sql`
    SELECT id, name, day_of_week as "dayOfWeek", created_at as "createdAt", updated_at as "updatedAt"
    FROM workouts
    ORDER BY day_of_week;
  `;
  return rows as Workout[];
}

// Get workout by ID with exercises
export async function getWorkoutWithExercises(
  workoutId: number
): Promise<WorkoutWithExercises | null> {
  const { rows: workoutRows } = await sql`
    SELECT id, name, day_of_week as "dayOfWeek", created_at as "createdAt", updated_at as "updatedAt"
    FROM workouts
    WHERE id = ${workoutId};
  `;

  if (workoutRows.length === 0) return null;

  const { rows: exerciseRows } = await sql`
    SELECT
      id,
      workout_id as "workoutId",
      order_index as "orderIndex",
      name,
      target_sets as "targetSets",
      target_reps_min as "targetRepsMin",
      target_reps_max as "targetRepsMax",
      default_weight as "defaultWeight"
    FROM exercises
    WHERE workout_id = ${workoutId}
    ORDER BY order_index;
  `;

  return {
    ...(workoutRows[0] as Workout),
    exercises: exerciseRows as Exercise[],
  };
}

// Get workout by day of week
export async function getWorkoutByDay(
  dayOfWeek: number
): Promise<WorkoutWithExercises | null> {
  const { rows: workoutRows } = await sql`
    SELECT id, name, day_of_week as "dayOfWeek", created_at as "createdAt", updated_at as "updatedAt"
    FROM workouts
    WHERE day_of_week = ${dayOfWeek};
  `;

  if (workoutRows.length === 0) return null;

  const workout = workoutRows[0] as Workout;
  return getWorkoutWithExercises(workout.id);
}

// Get last logged set for an exercise
export async function getLastLogForExercise(
  exerciseId: number
): Promise<{ reps: number; weight: number } | null> {
  const { rows } = await sql`
    SELECT reps, weight
    FROM workout_logs
    WHERE exercise_id = ${exerciseId}
    ORDER BY logged_at DESC
    LIMIT 1;
  `;

  if (rows.length === 0) return null;

  return rows[0] as { reps: number; weight: number };
}

// Log a set
export async function logSet(input: SetLogInput): Promise<WorkoutLog> {
  const { rows } = await sql`
    INSERT INTO workout_logs (workout_id, exercise_id, set_number, reps, weight)
    VALUES (${input.workoutId}, ${input.exerciseId}, ${input.setNumber}, ${input.reps}, ${input.weight})
    RETURNING
      id,
      workout_id as "workoutId",
      exercise_id as "exerciseId",
      logged_at as "loggedAt",
      set_number as "setNumber",
      reps,
      weight;
  `;

  return rows[0] as WorkoutLog;
}

// Get workout history for a specific workout (last N sessions)
export async function getWorkoutHistory(
  workoutId: number,
  limit: number = 8
): Promise<
  Array<{
    date: string;
    exercises: Array<{
      exerciseId: number;
      exerciseName: string;
      sets: Array<{ setNumber: number; reps: number; weight: number }>;
    }>;
  }>
> {
  const { rows } = await sql`
    SELECT
      DATE(wl.logged_at) as date,
      wl.exercise_id as "exerciseId",
      e.name as "exerciseName",
      wl.set_number as "setNumber",
      wl.reps,
      wl.weight
    FROM workout_logs wl
    JOIN exercises e ON e.id = wl.exercise_id
    WHERE wl.workout_id = ${workoutId}
    ORDER BY wl.logged_at DESC;
  `;

  // Group by date and exercise
  const grouped = new Map<
    string,
    Map<
      number,
      {
        exerciseId: number;
        exerciseName: string;
        sets: Array<{ setNumber: number; reps: number; weight: number }>;
      }
    >
  >();

  for (const row of rows as any[]) {
    const dateStr = new Date(row.date).toISOString().split('T')[0];

    if (!grouped.has(dateStr)) {
      grouped.set(dateStr, new Map());
    }

    const dateMap = grouped.get(dateStr)!;

    if (!dateMap.has(row.exerciseId)) {
      dateMap.set(row.exerciseId, {
        exerciseId: row.exerciseId,
        exerciseName: row.exerciseName,
        sets: [],
      });
    }

    dateMap.get(row.exerciseId)!.sets.push({
      setNumber: row.setNumber,
      reps: row.reps,
      weight: row.weight,
    });
  }

  // Convert to array and take last N sessions
  const result = Array.from(grouped.entries())
    .slice(0, limit)
    .map(([date, exerciseMap]) => ({
      date,
      exercises: Array.from(exerciseMap.values()),
    }));

  return result;
}

// Get exercise history for charts (all time)
export async function getExerciseHistory(
  exerciseId: number
): Promise<Array<{ date: string; setNumber: number; reps: number; weight: number }>> {
  const { rows } = await sql`
    SELECT
      DATE(logged_at) as date,
      set_number as "setNumber",
      reps,
      weight
    FROM workout_logs
    WHERE exercise_id = ${exerciseId}
    ORDER BY logged_at ASC;
  `;

  return rows as Array<{ date: string; setNumber: number; reps: number; weight: number }>;
}

// Update exercise
export async function updateExercise(
  exerciseId: number,
  data: Partial<
    Pick<
      Exercise,
      'name' | 'targetSets' | 'targetRepsMin' | 'targetRepsMax' | 'defaultWeight' | 'orderIndex'
    >
  >
): Promise<Exercise> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (data.targetSets !== undefined) {
    updates.push(`target_sets = $${paramCount++}`);
    values.push(data.targetSets);
  }
  if (data.targetRepsMin !== undefined) {
    updates.push(`target_reps_min = $${paramCount++}`);
    values.push(data.targetRepsMin);
  }
  if (data.targetRepsMax !== undefined) {
    updates.push(`target_reps_max = $${paramCount++}`);
    values.push(data.targetRepsMax);
  }
  if (data.defaultWeight !== undefined) {
    updates.push(`default_weight = $${paramCount++}`);
    values.push(data.defaultWeight);
  }
  if (data.orderIndex !== undefined) {
    updates.push(`order_index = $${paramCount++}`);
    values.push(data.orderIndex);
  }

  values.push(exerciseId);

  const query = `
    UPDATE exercises
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING
      id,
      workout_id as "workoutId",
      order_index as "orderIndex",
      name,
      target_sets as "targetSets",
      target_reps_min as "targetRepsMin",
      target_reps_max as "targetRepsMax",
      default_weight as "defaultWeight";
  `;

  const result = await sql.query(query, values);
  return result.rows[0] as Exercise;
}

// Delete exercise
export async function deleteExercise(exerciseId: number): Promise<void> {
  await sql`DELETE FROM exercises WHERE id = ${exerciseId};`;
}

// Add exercise
export async function addExercise(
  workoutId: number,
  exercise: Omit<Exercise, 'id' | 'workoutId'>
): Promise<Exercise> {
  const { rows } = await sql`
    INSERT INTO exercises (workout_id, order_index, name, target_sets, target_reps_min, target_reps_max, default_weight)
    VALUES (
      ${workoutId},
      ${exercise.orderIndex},
      ${exercise.name},
      ${exercise.targetSets},
      ${exercise.targetRepsMin},
      ${exercise.targetRepsMax},
      ${exercise.defaultWeight}
    )
    RETURNING
      id,
      workout_id as "workoutId",
      order_index as "orderIndex",
      name,
      target_sets as "targetSets",
      target_reps_min as "targetRepsMin",
      target_reps_max as "targetRepsMax",
      default_weight as "defaultWeight";
  `;

  return rows[0] as Exercise;
}
```

**Step 2: Commit query functions**

Run:
```bash
git add lib/db/queries.ts
git commit -m "feat: add database query functions"
```

---

## Task 7: Create Workout Tracking Page - Part 1 (Server Components)

**Files:**
- Create: `app/workout/page.tsx`
- Create: `app/workout/actions.ts`
- Create: `lib/utils/workout.ts`

**Step 1: Create workout utility functions**

Create `lib/utils/workout.ts`:

```typescript
// Get current day of week (1 = Monday, 7 = Sunday)
export function getCurrentDayOfWeek(): number {
  const day = new Date().getDay();
  // Convert JS day (0 = Sunday) to ISO day (1 = Monday)
  return day === 0 ? 7 : day;
}

// Map day to workout (only Mon=1, Tue=2, Thu=4, Fri=5 have workouts)
export function getWorkoutDayFromCurrent(): number {
  const day = getCurrentDayOfWeek();

  // Monday, Tuesday, Thursday, Friday have workouts
  if ([1, 2, 4, 5].includes(day)) {
    return day;
  }

  // Default to Monday (Upper 1) on other days
  return 1;
}
```

**Step 2: Create workout page server component**

Create `app/workout/page.tsx`:

```typescript
import { getWorkoutByDay, getWorkouts } from '@/lib/db/queries';
import { getWorkoutDayFromCurrent } from '@/lib/utils/workout';
import { WorkoutTracker } from './workout-tracker';

export default async function WorkoutPage() {
  const currentDay = getWorkoutDayFromCurrent();
  const workout = await getWorkoutByDay(currentDay);
  const allWorkouts = await getWorkouts();

  if (!workout) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">No Workout Found</h1>
          <p className="text-muted-foreground mt-2">
            No workout is configured for today.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WorkoutTracker
      initialWorkout={workout}
      allWorkouts={allWorkouts}
    />
  );
}
```

**Step 3: Create workout server actions**

Create `app/workout/actions.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { logSet as dbLogSet, getLastLogForExercise } from '@/lib/db/queries';
import type { SetLogInput } from '@/lib/types';

export async function logSetAction(input: SetLogInput) {
  try {
    const log = await dbLogSet(input);
    revalidatePath('/workout');
    return { success: true, log };
  } catch (error) {
    console.error('Error logging set:', error);
    return { success: false, error: 'Failed to log set' };
  }
}

export async function getLastLogAction(exerciseId: number) {
  try {
    const lastLog = await getLastLogForExercise(exerciseId);
    return { success: true, lastLog };
  } catch (error) {
    console.error('Error fetching last log:', error);
    return { success: false, error: 'Failed to fetch last log' };
  }
}
```

**Step 4: Commit server components**

Run:
```bash
git add app/workout/page.tsx app/workout/actions.ts lib/utils/workout.ts
git commit -m "feat: add workout page server component and actions"
```

---

## Task 8: Create Workout Tracking Page - Part 2 (Client Component)

**Files:**
- Create: `app/workout/workout-tracker.tsx`
- Create: `components/workout/set-logger.tsx`
- Create: `components/workout/exercise-display.tsx`

**Step 1: Create exercise display component**

Create `components/workout/exercise-display.tsx`:

```typescript
import type { Exercise } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ExerciseDisplayProps {
  exercise: Exercise;
  currentSet: number;
  totalSets: number;
}

export function ExerciseDisplay({ exercise, currentSet, totalSets }: ExerciseDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{exercise.name}</CardTitle>
        <CardDescription className="text-lg">
          Target: {exercise.targetSets} × {exercise.targetRepsMin}-{exercise.targetRepsMax} @ {exercise.defaultWeight}kg
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="text-4xl font-bold">
            Set {currentSet} of {totalSets}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create set logger component**

Create `components/workout/set-logger.tsx`:

```typescript
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
```

**Step 3: Create workout tracker client component**

Create `app/workout/workout-tracker.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutWithExercises, Workout } from '@/lib/types';
import { logSetAction, getLastLogAction } from './actions';
import { ExerciseDisplay } from '@/components/workout/exercise-display';
import { SetLogger } from '@/components/workout/set-logger';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface WorkoutTrackerProps {
  initialWorkout: WorkoutWithExercises;
  allWorkouts: Workout[];
}

export function WorkoutTracker({ initialWorkout, allWorkouts }: WorkoutTrackerProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [workout, setWorkout] = useState(initialWorkout);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [extraSetUsed, setExtraSetUsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultValues, setDefaultValues] = useState<{ reps?: number; weight?: number }>({});
  const [isComplete, setIsComplete] = useState(false);
  const [totalSetsLogged, setTotalSetsLogged] = useState(0);

  const currentExercise = workout.exercises[exerciseIndex];
  const isLastExercise = exerciseIndex === workout.exercises.length - 1;
  const maxSets = currentExercise.targetSets + (extraSetUsed ? 0 : 1); // Allow 1 extra
  const completedTargetSets = currentSet > currentExercise.targetSets;

  // Load last logged values for current exercise
  useEffect(() => {
    async function loadLastLog() {
      const result = await getLastLogAction(currentExercise.id);
      if (result.success && result.lastLog) {
        setDefaultValues({
          reps: result.lastLog.reps,
          weight: result.lastLog.weight,
        });
      } else {
        setDefaultValues({
          weight: currentExercise.defaultWeight,
        });
      }
    }
    loadLastLog();
  }, [currentExercise.id, currentExercise.defaultWeight]);

  async function handleLogSet(reps: number, weight: number) {
    setIsLoading(true);

    const result = await logSetAction({
      workoutId: workout.id,
      exerciseId: currentExercise.id,
      setNumber: currentSet,
      reps,
      weight,
    });

    setIsLoading(false);

    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'Failed to log set',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Set logged!',
      description: `${reps} reps @ ${weight}kg`,
    });

    setTotalSetsLogged((prev) => prev + 1);
    setCurrentSet((prev) => prev + 1);
    setDefaultValues({ reps, weight });
  }

  function handleAddExtraSet() {
    setExtraSetUsed(true);
    // Already incremented by handleLogSet, so no need to increment again
  }

  function handleNextExercise() {
    if (isLastExercise) {
      setIsComplete(true);
    } else {
      setExerciseIndex((prev) => prev + 1);
      setCurrentSet(1);
      setExtraSetUsed(false);
    }
  }

  function handleChangeWorkout(workoutId: string) {
    router.push(`/workout?id=${workoutId}`);
    router.refresh();
  }

  if (isComplete) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Workout Complete! 🎉</CardTitle>
            <CardDescription className="text-center text-lg">
              {workout.exercises.length} exercises, {totalSetsLogged} total sets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push('/history')}
            >
              View History
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => router.refresh()}
            >
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      {/* Workout selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{workout.name}</h1>
        <Select value={workout.id.toString()} onValueChange={handleChangeWorkout}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allWorkouts.map((w) => (
              <SelectItem key={w.id} value={w.id.toString()}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress */}
      <div className="text-sm text-muted-foreground">
        Exercise {exerciseIndex + 1} of {workout.exercises.length}
      </div>

      {/* Exercise info */}
      <ExerciseDisplay
        exercise={currentExercise}
        currentSet={currentSet}
        totalSets={maxSets}
      />

      {/* Set logger */}
      {!completedTargetSets && (
        <SetLogger
          onLogSet={handleLogSet}
          defaultReps={defaultValues.reps}
          defaultWeight={defaultValues.weight}
          isLoading={isLoading}
        />
      )}

      {/* Action buttons after target sets */}
      {completedTargetSets && (
        <div className="space-y-4">
          {!extraSetUsed && currentSet === currentExercise.targetSets + 1 && (
            <>
              <SetLogger
                onLogSet={async (reps, weight) => {
                  await handleLogSet(reps, weight);
                  handleAddExtraSet();
                }}
                defaultReps={defaultValues.reps}
                defaultWeight={defaultValues.weight}
                isLoading={isLoading}
              />
              <p className="text-center text-sm text-muted-foreground">
                Feeling strong? Add one more set above, or move to next exercise below.
              </p>
            </>
          )}

          <Button
            size="lg"
            variant={extraSetUsed || currentSet > currentExercise.targetSets + 1 ? 'default' : 'secondary'}
            className="w-full h-16 text-xl"
            onClick={handleNextExercise}
          >
            {isLastExercise ? 'Finish Workout' : 'Next Exercise'}
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Step 5: Commit workout tracker client components**

Run:
```bash
git add app/workout/workout-tracker.tsx components/workout
git commit -m "feat: add workout tracker client components with set logging"
```

---

## Task 9: Create Navigation Component

**Files:**
- Create: `components/layout/nav.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create navigation component**

Create `components/layout/nav.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Dumbbell, BarChart3, Settings } from 'lucide-react';

const routes = [
  {
    href: '/workout',
    label: 'Workout',
    icon: Dumbbell,
  },
  {
    href: '/history',
    label: 'History',
    icon: BarChart3,
  },
  {
    href: '/manage',
    label: 'Manage',
    icon: Settings,
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="container mx-auto">
        <div className="flex justify-around md:justify-center md:gap-8 md:py-4">
          {routes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.href;

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'flex flex-col items-center gap-1 py-3 px-6 text-sm transition-colors md:flex-row md:gap-2',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
```

**Step 2: Update root layout**

Modify `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/nav";
import { Toaster } from "@/components/ui/toaster";
import { isAuthenticated } from "@/lib/auth/session";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Workout Tracker",
  description: "Personal workout tracking app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await isAuthenticated();

  return (
    <html lang="en">
      <body className={inter.className}>
        {authenticated && <Nav />}
        <main className={authenticated ? "pb-20 md:pb-0 md:pt-20" : ""}>
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
```

**Step 3: Install lucide-react for icons**

Run:
```bash
npm install lucide-react
```

**Step 4: Commit navigation**

Run:
```bash
git add components/layout app/layout.tsx
git commit -m "feat: add bottom/top navigation bar"
```

---

## Task 10: Create History Page with Table View

**Files:**
- Create: `app/history/page.tsx`
- Create: `components/history/workout-history-table.tsx`

**Step 1: Create history page**

Create `app/history/page.tsx`:

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getWorkouts } from '@/lib/db/queries';
import { WorkoutHistoryTable } from '@/components/history/workout-history-table';

export default async function HistoryPage() {
  const workouts = await getWorkouts();

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Workout History</h1>

      <Tabs defaultValue={workouts[0]?.id.toString()} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {workouts.map((workout) => (
            <TabsTrigger key={workout.id} value={workout.id.toString()}>
              {workout.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {workouts.map((workout) => (
          <TabsContent key={workout.id} value={workout.id.toString()}>
            <WorkoutHistoryTable workoutId={workout.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

**Step 2: Create workout history table component**

Create `components/history/workout-history-table.tsx`:

```typescript
import { getWorkoutHistory } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistance } from 'date-fns';

interface WorkoutHistoryTableProps {
  workoutId: number;
}

export async function WorkoutHistoryTable({ workoutId }: WorkoutHistoryTableProps) {
  const history = await getWorkoutHistory(workoutId, 8);

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No workout history yet. Start logging sets!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((session) => {
        const date = new Date(session.date);
        const dateStr = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const relativeTime = formatDistance(date, new Date(), { addSuffix: true });

        return (
          <Card key={session.date}>
            <CardHeader>
              <CardTitle className="text-xl">
                {dateStr}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({relativeTime})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {session.exercises.map((exercise) => {
                  const setsDisplay = exercise.sets
                    .map((set) => `${set.reps}@${set.weight}kg`)
                    .join(', ');

                  return (
                    <div key={exercise.exerciseId} className="flex justify-between items-start">
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
      })}
    </div>
  );
}
```

**Step 3: Install date-fns**

Run:
```bash
npm install date-fns
```

**Step 4: Commit history table**

Run:
```bash
git add app/history components/history
git commit -m "feat: add history page with workout session tables"
```

---

## Task 11: Add Exercise Charts to History Page

**Files:**
- Modify: `components/history/workout-history-table.tsx`
- Create: `components/history/exercise-chart.tsx`

**Step 1: Create exercise chart component**

Create `components/history/exercise-chart.tsx`:

```typescript
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

  // Group by date and calculate average weight
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
```

**Step 2: Update workout history table to include charts**

Modify `components/history/workout-history-table.tsx`:

```typescript
import { getWorkoutHistory, getWorkoutWithExercises, getExerciseHistory } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistance } from 'date-fns';
import { ExerciseChart } from './exercise-chart';

interface WorkoutHistoryTableProps {
  workoutId: number;
}

export async function WorkoutHistoryTable({ workoutId }: WorkoutHistoryTableProps) {
  const history = await getWorkoutHistory(workoutId, 8);
  const workout = await getWorkoutWithExercises(workoutId);

  if (!workout) {
    return null;
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No workout history yet. Start logging sets!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Fetch exercise history for all exercises
  const exerciseHistories = await Promise.all(
    workout.exercises.map(async (exercise) => ({
      exercise,
      data: await getExerciseHistory(exercise.id),
    }))
  );

  return (
    <Tabs defaultValue="table" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="table">Session History</TabsTrigger>
        <TabsTrigger value="charts">Exercise Charts</TabsTrigger>
      </TabsList>

      <TabsContent value="table" className="space-y-4">
        {history.map((session) => {
          const date = new Date(session.date);
          const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          const relativeTime = formatDistance(date, new Date(), { addSuffix: true });

          return (
            <Card key={session.date}>
              <CardHeader>
                <CardTitle className="text-xl">
                  {dateStr}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({relativeTime})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.exercises.map((exercise) => {
                    const setsDisplay = exercise.sets
                      .map((set) => `${set.reps}@${set.weight}kg`)
                      .join(', ');

                    return (
                      <div key={exercise.exerciseId} className="flex justify-between items-start">
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
        })}
      </TabsContent>

      <TabsContent value="charts" className="space-y-6">
        {exerciseHistories
          .filter(({ data }) => data.length > 0)
          .map(({ exercise, data }) => (
            <ExerciseChart key={exercise.id} exercise={exercise} data={data} />
          ))}
      </TabsContent>
    </Tabs>
  );
}
```

**Step 3: Commit exercise charts**

Run:
```bash
git add components/history/exercise-chart.tsx components/history/workout-history-table.tsx
git commit -m "feat: add progressive overload charts to history page"
```

---

## Task 12: Create Workout Management Page

**Files:**
- Create: `app/manage/page.tsx`
- Create: `app/manage/actions.ts`
- Create: `components/manage/exercise-editor.tsx`

**Step 1: Create management server actions**

Create `app/manage/actions.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { updateExercise, deleteExercise, addExercise } from '@/lib/db/queries';
import type { Exercise } from '@/lib/types';

export async function updateExerciseAction(
  exerciseId: number,
  data: Partial<Pick<Exercise, 'name' | 'targetSets' | 'targetRepsMin' | 'targetRepsMax' | 'defaultWeight'>>
) {
  try {
    const exercise = await updateExercise(exerciseId, data);
    revalidatePath('/manage');
    return { success: true, exercise };
  } catch (error) {
    console.error('Error updating exercise:', error);
    return { success: false, error: 'Failed to update exercise' };
  }
}

export async function deleteExerciseAction(exerciseId: number) {
  try {
    await deleteExercise(exerciseId);
    revalidatePath('/manage');
    return { success: true };
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return { success: false, error: 'Failed to delete exercise' };
  }
}

export async function addExerciseAction(
  workoutId: number,
  exercise: Omit<Exercise, 'id' | 'workoutId'>
) {
  try {
    const newExercise = await addExercise(workoutId, exercise);
    revalidatePath('/manage');
    return { success: true, exercise: newExercise };
  } catch (error) {
    console.error('Error adding exercise:', error);
    return { success: false, error: 'Failed to add exercise' };
  }
}
```

**Step 2: Create exercise editor component**

Create `components/manage/exercise-editor.tsx`:

```typescript
'use client';

import { useState } from 'react';
import type { Exercise } from '@/lib/types';
import { updateExerciseAction, deleteExerciseAction } from '@/app/manage/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExerciseEditorProps {
  exercise: Exercise;
  onDelete: () => void;
}

export function ExerciseEditor({ exercise, onDelete }: ExerciseEditorProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(exercise.name);
  const [sets, setSets] = useState(exercise.targetSets.toString());
  const [repsMin, setRepsMin] = useState(exercise.targetRepsMin.toString());
  const [repsMax, setRepsMax] = useState(exercise.targetRepsMax.toString());
  const [weight, setWeight] = useState(exercise.defaultWeight.toString());

  async function handleSave() {
    const result = await updateExerciseAction(exercise.id, {
      name,
      targetSets: parseInt(sets),
      targetRepsMin: parseInt(repsMin),
      targetRepsMax: parseInt(repsMax),
      defaultWeight: parseFloat(weight),
    });

    if (result.success) {
      toast({
        title: 'Exercise updated',
        description: `${name} has been updated`,
      });
      setIsEditing(false);
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${exercise.name}? This cannot be undone.`)) {
      return;
    }

    const result = await deleteExerciseAction(exercise.id);

    if (result.success) {
      toast({
        title: 'Exercise deleted',
        description: `${exercise.name} has been deleted`,
      });
      onDelete();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  }

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">{exercise.name}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
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
          <Button onClick={handleSave} className="flex-1">
            Save
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Create management page**

Create `app/manage/page.tsx`:

```typescript
import { getWorkouts, getWorkoutWithExercises } from '@/lib/db/queries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExerciseEditor } from '@/components/manage/exercise-editor';

export default async function ManagePage() {
  const workouts = await getWorkouts();
  const workoutsWithExercises = await Promise.all(
    workouts.map((w) => getWorkoutWithExercises(w.id))
  );

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

        {workoutsWithExercises.map((workout) => {
          if (!workout) return null;

          return (
            <TabsContent key={workout.id} value={workout.id.toString()} className="space-y-4">
              {workout.exercises.map((exercise) => (
                <ExerciseEditor
                  key={exercise.id}
                  exercise={exercise}
                  onDelete={() => {
                    // Refresh handled by revalidatePath in server action
                  }}
                />
              ))}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
```

**Step 4: Commit management page**

Run:
```bash
git add app/manage components/manage
git commit -m "feat: add workout management page with exercise editing"
```

---

## Task 13: Add Toast Notifications Setup

**Files:**
- Create: `hooks/use-toast.ts` (if not created by shadcn)
- Create: `components/ui/toaster.tsx` (if not created by shadcn)

**Step 1: Add toast component if missing**

Run:
```bash
npx shadcn@latest add toast
```

**Step 2: Verify toast is in layout**

The toast setup was already added in Task 9 (app/layout.tsx includes `<Toaster />`).

Verify `app/layout.tsx` has:
```typescript
import { Toaster } from "@/components/ui/toaster";
```

And in the JSX:
```typescript
<Toaster />
```

**Step 3: Commit if any changes**

Run:
```bash
git add hooks components/ui
git commit -m "feat: ensure toast notifications are configured"
```

---

## Task 14: Fix Workout Selector Logic

**Files:**
- Modify: `app/workout/page.tsx`

**Step 1: Update workout page to handle manual selection**

Modify `app/workout/page.tsx`:

```typescript
import { getWorkoutByDay, getWorkouts, getWorkoutWithExercises } from '@/lib/db/queries';
import { getWorkoutDayFromCurrent } from '@/lib/utils/workout';
import { WorkoutTracker } from './workout-tracker';

interface WorkoutPageProps {
  searchParams: { id?: string };
}

export default async function WorkoutPage({ searchParams }: WorkoutPageProps) {
  const allWorkouts = await getWorkouts();

  let workout;

  if (searchParams.id) {
    // Manual selection via dropdown
    workout = await getWorkoutWithExercises(parseInt(searchParams.id));
  } else {
    // Auto-detect by day
    const currentDay = getWorkoutDayFromCurrent();
    workout = await getWorkoutByDay(currentDay);
  }

  if (!workout) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">No Workout Found</h1>
          <p className="text-muted-foreground mt-2">
            No workout is configured for today.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WorkoutTracker
      initialWorkout={workout}
      allWorkouts={allWorkouts}
    />
  );
}
```

**Step 2: Commit workout selector fix**

Run:
```bash
git add app/workout/page.tsx
git commit -m "fix: add manual workout selection via URL params"
```

---

## Task 15: Testing and Bug Fixes

**Step 1: Test authentication flow**

Run:
```bash
npm run dev
```

Test:
1. Navigate to http://localhost:3000
2. Should redirect to /login
3. Enter password from .env.local
4. Should redirect to /workout

**Step 2: Test workout logging**

First, ensure database is seeded:
```bash
npm run seed
```

Then test:
1. Navigate to /workout
2. Log a few sets
3. Verify data persists
4. Test "Add One More Set" button
5. Test "Next Exercise" flow
6. Complete a workout

**Step 3: Test history page**

Navigate to /history and verify:
1. Session history shows logged workouts
2. Exercise charts display properly
3. Tabs switch between workouts

**Step 4: Test management page**

Navigate to /manage and verify:
1. Can edit exercise details
2. Changes persist after save
3. Can delete exercises (with confirmation)

**Step 5: Fix any bugs discovered**

Document and fix issues as needed.

**Step 6: Commit bug fixes**

Run:
```bash
git add .
git commit -m "fix: resolve issues found during testing"
```

---

## Task 16: Prepare for Vercel Deployment

**Files:**
- Create: `README.md`
- Create: `.env.example`

**Step 1: Create environment variables example**

Create `.env.example`:

```bash
# Vercel Postgres (auto-populated by Vercel)
POSTGRES_URL=""
POSTGRES_PRISMA_URL=""
POSTGRES_URL_NON_POOLING=""
POSTGRES_USER=""
POSTGRES_HOST=""
POSTGRES_PASSWORD=""
POSTGRES_DATABASE=""

# Authentication
WORKOUT_PASSWORD="your-secure-password-here"
SESSION_SECRET="generate-with: openssl rand -base64 32"
```

**Step 2: Create README**

Create `README.md`:

```markdown
# Workout Tracker

Personal workout tracking web app for progressive overload tracking.

## Features

- 🔐 Simple password authentication (10-year session)
- 💪 Track workouts with sets, reps, and weights
- 📊 Progressive overload charts and history
- ⚙️ Manage and customize workout plans
- 📱 Mobile-first responsive design

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Vercel Postgres
- shadcn/ui
- Tailwind CSS
- Recharts

## Local Development

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   - Copy \`.env.example\` to \`.env.local\`
   - Generate a session secret: \`openssl rand -base64 32\`
   - Set your workout password
   - Add Vercel Postgres connection strings

4. Seed the database:
   \`\`\`bash
   npm run seed
   \`\`\`

5. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables:
   - \`WORKOUT_PASSWORD\`: Your secure password
   - \`SESSION_SECRET\`: Random 32-char string
4. Vercel will auto-provision Postgres database
5. After first deploy, run seed script:
   \`\`\`bash
   vercel env pull .env.local
   npm run seed
   \`\`\`
6. Configure custom domain: \`w.nicolaeandrei.com\`

## Usage

1. Log in with your password (stored in 1Password)
2. Navigate to **/workout** to track today's workout
3. Log sets with reps and weight
4. View history and charts in **/history**
5. Manage exercises in **/manage**

## Workout Schedule

- **Monday**: Upper 1
- **Tuesday**: Lower 1
- **Thursday**: Upper 2
- **Friday**: Lower 2

## License

Personal project - no license
```

**Step 3: Commit deployment prep**

Run:
```bash
git add README.md .env.example
git commit -m "docs: add README and env example for deployment"
```

---

## Task 17: Deploy to Vercel

**Step 1: Push to GitHub**

Create a new GitHub repository and push:

```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

**Step 2: Import to Vercel**

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Add environment variables:
   - `WORKOUT_PASSWORD`: (your secure password)
   - `SESSION_SECRET`: (generate with `openssl rand -base64 32`)
5. Click "Deploy"

**Step 3: Provision Vercel Postgres**

1. In Vercel project dashboard, go to "Storage"
2. Click "Create Database"
3. Select "Postgres"
4. Click "Continue" (free tier)
5. Database is auto-provisioned and env vars are added

**Step 4: Seed the database**

After deployment completes:

```bash
# Pull environment variables
npx vercel env pull .env.local

# Run seed script (connects to production DB)
npm run seed
```

**Step 5: Configure custom domain**

1. In Vercel project settings, go to "Domains"
2. Add domain: `w.nicolaeandrei.com`
3. Follow DNS configuration instructions
4. Wait for DNS propagation (usually < 5 minutes)

**Step 6: Test production deployment**

1. Visit `https://w.nicolaeandrei.com`
2. Log in with your password
3. Test full workflow: login → track workout → view history → manage exercises

**Step 7: Add password to 1Password**

Store the `WORKOUT_PASSWORD` in 1Password on your mobile device.

---

## Execution Complete

You now have a fully functional workout tracker deployed to Vercel at `w.nicolaeandrei.com`.

**Next steps (optional enhancements):**
- Add rest timer between sets
- Export workout data to CSV
- Progressive overload recommendations
- Workout notes/comments

**Deployment checklist:**
- ✅ Code pushed to GitHub
- ✅ Deployed to Vercel
- ✅ Vercel Postgres provisioned
- ✅ Database seeded with workout data
- ✅ Custom domain configured
- ✅ Password stored in 1Password
- ✅ Production tested end-to-end

---

**End of Implementation Plan**
