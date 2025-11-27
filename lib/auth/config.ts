export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'workout_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 years in seconds
  },
};
