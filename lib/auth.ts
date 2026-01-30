import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { magicLoginPlugin } from "@/lib/auth/magic-login";

const baseURL = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") || [];
const postgresURL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!postgresURL) {
  throw new Error('POSTGRES_URL or DATABASE_URL must be set');
}

export const auth = betterAuth({
  baseURL,
  trustedOrigins,
  database: new Pool({
    connectionString: postgresURL,
  }),
  plugins: process.env.NODE_ENV === 'production' ? [] : [magicLoginPlugin],
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 365, // 1 year
    updateAge: 60 * 60 * 24, // Update session every day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
});
