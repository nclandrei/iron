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
