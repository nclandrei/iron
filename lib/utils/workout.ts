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
