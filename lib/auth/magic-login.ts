import { createAuthEndpoint } from 'better-auth/plugins';
import { setSessionCookie } from 'better-auth/cookies';
import { APIError } from 'better-call';
import crypto from 'crypto';
import { z } from 'zod';

const getMagicPassword = () => {
  const explicit = process.env.MAGIC_LOGIN_PASSWORD?.trim();
  if (explicit) {
    return explicit;
  }

  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) {
    return null;
  }

  return crypto.createHash('sha256').update(secret).digest('hex').slice(0, 12);
};

export const magicLoginPlugin = {
  id: 'magic-login',
  endpoints: {
    magicLogin: createAuthEndpoint(
      '/dev/magic-sign-in',
      {
        method: 'POST',
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
      },
      async (ctx) => {
        if (process.env.NODE_ENV === 'production') {
          throw new APIError('NOT_FOUND', { message: 'Not found' });
        }

        if (process.env.MAGIC_LOGIN_ENABLED !== 'true') {
          throw new APIError('NOT_FOUND', { message: 'Not found' });
        }

        const magicPassword = getMagicPassword();
        if (!magicPassword) {
          throw new APIError('FORBIDDEN', { message: 'Magic login not configured' });
        }

        const allowedEmail = process.env.MAGIC_LOGIN_EMAIL?.trim();
        if (!allowedEmail) {
          throw new APIError('FORBIDDEN', { message: 'Magic login not configured' });
        }
        if (ctx.body.email !== allowedEmail || ctx.body.password !== magicPassword) {
          throw new APIError('UNAUTHORIZED', { message: 'Invalid email or password' });
        }

        const user = await ctx.context.internalAdapter.findUserByEmail(allowedEmail, {
          includeAccounts: true,
        });

        if (!user) {
          throw new APIError('NOT_FOUND', { message: 'User not found' });
        }

        const session = await ctx.context.internalAdapter.createSession(user.user.id, false);
        if (!session) {
          throw new APIError('UNAUTHORIZED', { message: 'Failed to create session' });
        }

        await setSessionCookie(ctx, { session, user: user.user }, false);

        return ctx.json({
          redirect: false,
          token: session.token,
          user: user.user,
        });
      }
    ),
  },
};
