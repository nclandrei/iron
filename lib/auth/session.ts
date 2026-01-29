import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

export type Session = {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
  };
};

export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
