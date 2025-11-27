# Workout Tracker - Design Document

**Date:** 2025-11-27
**Author:** Andrei Nicolae with Claude Code

## Overview

Personal workout tracking web app for gym use. Single-user application to track progressive overload across a 4-day weekly workout split (Monday, Tuesday, Thursday, Friday). Mobile-first but desktop-compatible.

## Stack & Architecture

**Frontend & Backend:**
- Next.js 14+ (App Router) with TypeScript
- Deployed on Vercel
- Custom domain: `w.nicolaeandrei.com`

**Database:**
- Vercel Postgres (free tier: 256MB, 60 compute hours/month)
- Sufficient for single-user workout tracking

**UI Framework:**
- shadcn/ui components
- Tailwind CSS for styling
- Recharts for data visualization
- Mobile-first responsive design

**Authentication:**
- Single password stored in Vercel environment variable (`WORKOUT_PASSWORD`)
- Password stored in 1Password on mobile
- Session stored in HTTP-only cookie (10-year expiration - effectively never expires)
- Next.js middleware protects all routes except `/login`
- No user accounts or database auth tables needed

## Project Structure

```
/app
  /login          - Password entry page
  /workout        - Active workout tracking (primary interface)
  /history        - Visualizations & historical data tables
  /manage         - Edit workout plans (exercises, sets, reps, weights)
  /api            - Server actions for data mutations
  middleware.ts   - Session validation
/lib
  /db             - Database client & SQL queries
  /types          - TypeScript types & interfaces
  /auth           - Session management utilities
/components
  /ui             - shadcn/ui components
  /workout        - Workout-specific components
  /history        - Chart & table components
```

## Database Schema

### `workouts` table
Stores the 4 workout templates (Upper 1, Lower 1, Upper 2, Lower 2)

```sql
CREATE TABLE workouts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,           -- "Upper 1", "Lower 1", etc.
  day_of_week INTEGER NOT NULL,        -- 1=Monday, 2=Tuesday, 4=Thursday, 5=Friday
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `exercises` table
Exercises within each workout template

```sql
CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,        -- Exercise sequence (1, 2, 3...)
  name VARCHAR(100) NOT NULL,          -- "Flat BB press", "Cable row", etc.
  target_sets INTEGER NOT NULL,        -- e.g., 3
  target_reps_min INTEGER NOT NULL,    -- e.g., 6
  target_reps_max INTEGER NOT NULL,    -- e.g., 8
  default_weight DECIMAL(5,1) NOT NULL -- e.g., 80.0 kg
);
```

### `workout_logs` table
Append-only log of every set completed (immutable)

```sql
CREATE TABLE workout_logs (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER REFERENCES workouts(id),
  exercise_id INTEGER REFERENCES exercises(id),
  logged_at TIMESTAMP DEFAULT NOW(),
  set_number INTEGER NOT NULL,         -- 1, 2, 3, 4...
  reps INTEGER NOT NULL,               -- Actual reps completed
  weight DECIMAL(5,1) NOT NULL         -- Actual weight used (kg)
);
```

**Indexes:**
- `CREATE INDEX idx_workout_logs_exercise ON workout_logs(exercise_id, logged_at DESC);`
- `CREATE INDEX idx_workout_logs_workout ON workout_logs(workout_id, logged_at DESC);`

## Workout Plan Data

### Upper 1 (Monday)
1. Flat BB press - 3 x 6-8 @ 80kg
2. Cable row - 3 x 6-8 @ 81kg
3. Incline DB press - 3 x 10-12 @ 24kg
4. Assisted chin-ups - 3 x 10-12 @ 20.4kg
5. Machine lat raises - 3 x 10-12 @ 50kg
6. DB curl - 2 x 10-12 @ 12kg
7. Overhead triceps extension - 2 x 10-12 @ 34kg

### Lower 1 (Tuesday)
1. Back squat - 3 x 6-8 @ 110kg
2. RDL - 3 x 6-8 @ 90kg
3. Leg extensions - 3 x 10-12 @ 68kg
4. Lying curls - 3 x 10-12 @ 63kg
5. Calf raises - 3 x 10-15 @ 106kg
6. Abs - 3 x 10-15 @ 81kg

### Upper 2 (Thursday)
1. Flat BB press - 3 x 6-8 @ 80kg
2. BB row - 3 x 6-8 @ 70kg
3. Incline DB press - 3 x 10-12 @ 24kg
4. Machine lat pulldown - 3 x 10-12 @ 52kg
5. Machine lat raises - 3 x 10-12 @ 50kg
6. BB curl - 2 x 10-12 @ 22.5kg
7. Triceps pressdown - 2 x 10-12 @ 50kg

### Lower 2 (Friday)
1. Leg press - 3 x 6-8 @ 255kg
2. RDL - 3 x 6-8 @ 90kg
3. Leg extensions - 3 x 10-12 @ 68kg
4. Lying curls - 3 x 10-12 @ 63kg
5. Calf raises - 3 x 10-15 @ 108kg
6. Abs - 3 x 10-15 @ 86kg

## Feature Specifications

### 1. Authentication (`/login`)

**Behavior:**
- Single password input field
- Submit checks password against `WORKOUT_PASSWORD` env var
- On success: create 10-year session cookie, redirect to `/workout`
- On failure: show error message, refocus input
- Session persists indefinitely (no logout needed)

**Technical:**
- Use `iron-session` or similar for secure HTTP-only cookies
- Middleware checks session on all protected routes
- Redirect to `/login` if no valid session

### 2. Workout Tracking (`/workout`)

**Primary interface for gym use.**

**Initial Load:**
- Auto-detect workout based on current day of week:
  - Monday (1) → Upper 1
  - Tuesday (2) → Lower 1
  - Thursday (4) → Upper 2
  - Friday (5) → Lower 2
- Show dropdown at top to manually override workout selection
- Display first exercise with target info: "Flat BB press - 3 x 6-8 @ 80kg"
- Show current progress: "Set 1 of 3"

**Set Logging Form:**
- Two number inputs: Reps and Weight (kg)
- Pre-filled with last logged values for this exercise, or `default_weight`
- Large "Log Set" button (mobile-optimized, 48px+ touch target)
- On submit:
  - Insert record into `workout_logs`
  - Increment to next set
  - Pre-fill inputs with just-logged values
  - Optimistic UI update (don't wait for DB response)

**After Target Sets Completed:**
- Show two buttons:
  - "Add One More Set" (green, primary)
  - "Next Exercise" (blue, secondary)
- If "Add One More Set" clicked:
  - Allow logging one additional set
  - After logging, hide "Add One More Set" button (max 1 extra set)
  - Only show "Next Exercise"
- "Next Exercise" clicked:
  - Move to next exercise in workout
  - Reset to Set 1
  - Pre-fill with last logged or default values

**End of Workout:**
- After last exercise's last set logged, show:
  - Summary: "Workout complete! 7 exercises, 22 total sets"
  - "View History" button → `/history`
  - "Done" button → stay on page (ready for next session)

**UI/UX:**
- Sticky header with navigation
- Large, obvious buttons for primary actions
- High contrast colors for gym lighting
- Show loading states during DB operations
- Toast notifications for errors

### 3. History & Visualizations (`/history`)

**Layout:**
- Tab navigation for workouts: "Upper 1" | "Lower 1" | "Upper 2" | "Lower 2"
- Each tab shows both summary table and exercise charts

**Summary Table (per workout):**
- Display last 8 sessions of selected workout
- Columns: Date | Exercise | Sets x Reps @ Weight
- Grouped by session date (collapsible rows)
- Example:
  ```
  Nov 27, 2025
    Flat BB press    3x8 @ 80kg, 3x7 @ 80kg, 3x6 @ 80kg
    Cable row        3x8 @ 81kg, 3x8 @ 81kg, 3x7 @ 81kg
    ...
  Nov 25, 2025
    Flat BB press    3x7 @ 77.5kg, 3x7 @ 77.5kg, 3x6 @ 77.5kg
    ...
  ```

**Progressive Overload Charts:**
- Dropdown to select specific exercise (scoped to current workout tab)
- Line chart (Recharts):
  - X-axis: Date
  - Y-axis: Weight (kg)
  - Data points: Each set logged
  - Tooltip on hover: Date, Set X, Reps, Weight
- Shows trend over time (increasing weight/reps = progress)

**Query Logic:**
- Join `workout_logs` with `exercises` and `workouts`
- Filter by `workout_id` and `exercise_id`
- Order by `logged_at DESC`
- Limit to last 8 sessions for table (or configurable)
- For charts, show all historical data for selected exercise

### 4. Workout Management (`/manage`)

**Layout:**
- Cards or tabs for each workout: Upper 1, Lower 1, Upper 2, Lower 2
- Click to expand/edit

**Editing Interface (per workout):**
- List of exercises with drag-and-drop reordering (update `order_index`)
- Each exercise row shows inline editable fields:
  - Exercise name (text input)
  - Target sets (number input)
  - Target reps min-max (two number inputs, e.g., "6-8")
  - Default weight (number input with "kg" label)
- "Delete Exercise" button (trash icon, confirmation dialog)
- "Add Exercise" button at bottom

**Save Behavior:**
- Auto-save on blur (immediate feedback)
- OR explicit "Save Changes" button per workout
- Updates `exercises` table records
- Does NOT modify historical `workout_logs` (append-only)

**Historical Exercise Names:**
- When exercise name changes, old logs keep original `exercise_id`
- History/charts show old exercise names as they were at log time
- This maintains historical accuracy (no "rewriting history")

### 5. Navigation

**Global Navigation (sticky header or bottom nav):**
- "Workout" (primary, always visible)
- "History"
- "Manage"
- Active route highlighted with accent color

**Mobile-First:**
- Bottom tab bar on mobile (easier thumb access)
- Top nav bar on desktop
- Use shadcn/ui Navigation Menu components

## Error Handling & Validation

**Authentication:**
- Wrong password: Clear error toast, refocus input
- Session expired: Redirect to `/login` (shouldn't happen with 10-year cookie)

**Database Errors:**
- Failed to log set: Error toast, keep form data for retry
- Failed to load workout: Error message with "Retry" button
- Connection timeout: Queue logs locally (optional enhancement)

**Data Validation:**
- Reps: Positive integer, max 999
- Weight: Positive decimal (one decimal place), max 999.9
- Both fields required before enabling "Log Set" button

**Edge Cases:**
- No workout mapped to current day: Default to Upper 1, show manual override
- Deleted exercise with historical logs: Show "Deleted Exercise (ID: X)" in history
- Attempting >1 extra set: UI prevents this (button hidden after first extra)

## Responsive Design

**Mobile (Primary Target):**
- Large touch targets (min 48px)
- Number inputs trigger numeric keyboard
- Optimized for portrait orientation
- High contrast for gym lighting conditions
- Fast load times on gym wifi

**Desktop:**
- Wider layout with more whitespace
- Charts larger and more detailed
- Side-by-side views where appropriate
- Keyboard shortcuts for power users (optional)

**Dark Mode:**
- Optional (shadcn makes this trivial)
- Use system preference detection

## Performance Optimizations

**Critical Path:**
- Server-side render workout data on initial load
- Prefetch exercise data for current workout
- Optimistic UI updates (log set immediately, sync async)

**Data Fetching:**
- Use Next.js Server Components where possible
- Server Actions for mutations
- SWR or TanStack Query for client-side caching (optional)

**Optional Enhancements:**
- Service worker for offline capability
- IndexedDB queue for offline logs
- Background sync when connection restored

## Deployment Checklist

1. Set up Vercel project linked to Git repo
2. Provision Vercel Postgres database
3. Run migrations to create tables
4. Seed database with initial workout data
5. Set `WORKOUT_PASSWORD` environment variable in Vercel dashboard
6. Configure custom domain: `w.nicolaeandrei.com`
7. Deploy and test authentication + basic logging flow

## Future Enhancements (Out of Scope)

- Rest timer between sets
- Exercise video links or form tips
- Export data to CSV
- Progressive overload suggestions ("Try 82.5kg next time")
- Volume tracking (total kg lifted per session)
- Body weight tracking correlation
- Workout notes/comments per session

## Success Criteria

1. Can log in once and never need to log in again
2. Can open app at gym and immediately start tracking current workout
3. Can log sets with 2-3 taps (pre-filled values + "Log Set")
4. Can add one extra set when feeling strong
5. Can view progressive overload trends in clean charts
6. Can modify workout plans easily when program changes
7. Works fast and reliably on mobile at the gym

---

**End of Design Document**
