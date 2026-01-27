# Start Workout Feature Design

## Overview

Introduces explicit workout session lifecycle with start/end controls and elapsed timer.

## Workout States

- **Idle** - No active workout (shows "Start Workout" button)
- **Active** - Timer running, sets can be logged, "End Workout" button available
- **Completed** - Workout ended (existing completion screen)

## Session Data

New field added to `WorkoutSession`:
- `startedAt: string | null` - ISO timestamp when workout was started

## Timer Display

- Shows elapsed time since `startedAt` in `MM:SS` or `H:MM:SS` format
- Updates every second via `useEffect` interval
- Displayed next to workout title in header

## Auto-End Logic

- 30-minute inactivity timeout
- Checks every 30 seconds if `lastSetTime` is >30 min ago
- Silently ends workout (no warning)
- Session validation also rejects expired sessions on load

## UI Changes

**Before workout starts:**
- Workout selector enabled
- "Start Workout" button prominently displayed
- Exercise list hidden

**During active workout:**
- Elapsed timer visible
- Workout selector disabled
- Exercise list and set logger visible
- "End Workout" button at bottom

## Files Modified

1. `lib/types/index.ts` - Added `startedAt` to `WorkoutSession`
2. `lib/utils/workout-session.ts` - Added inactivity check to `isSessionValid()`, added `formatElapsedTime()`
3. `app/workout/workout-tracker.tsx` - Added start/end handlers, timer display, auto-end effect
