import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from './config';

export interface SessionData {
  isAuthenticated: boolean;
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isAuthenticated === true;
}
