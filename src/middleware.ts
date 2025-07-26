import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

export const middleware = async (req: NextRequest) => {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const { isLoggedIn } = session;

  const { pathname } = req.nextUrl;

  // Allow access to API routes, static files, and image optimization routes
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.endsWith('.ico')) {
    return res;
  }
  
  // If user is logged in and tries to access login or register, redirect to dashboard
  if (isLoggedIn && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!isLoggedIn && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
};

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
