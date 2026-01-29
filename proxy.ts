import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicPaths = ['/login', '/signup'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to public pages and API routes
  if (publicPaths.includes(pathname) || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie
  const sessionCookie = request.cookies.get('better-auth.session_token');

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
