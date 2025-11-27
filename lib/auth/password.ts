export function verifyPassword(inputPassword: string): boolean {
  const correctPassword = process.env.WORKOUT_PASSWORD;

  if (!correctPassword) {
    throw new Error('WORKOUT_PASSWORD environment variable is not set');
  }

  return inputPassword === correctPassword;
}
