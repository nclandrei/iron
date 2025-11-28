if (!process.env.SESSION_SECRET) {
  throw new Error(
    `SESSION_SECRET environment variable is not set. ` +
    `Available env vars: ${Object.keys(process.env).filter(k => k.includes('SECRET') || k.includes('PASSWORD')).join(', ')}`
  );
}

if (process.env.SESSION_SECRET.length < 32) {
  throw new Error(
    `SESSION_SECRET must be at least 32 characters long. ` +
    `Current length: ${process.env.SESSION_SECRET.length}`
  );
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: 'workout_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 years in seconds
  },
};
