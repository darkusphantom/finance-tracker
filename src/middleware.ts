import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session/edge';
import { sessionOptions, type SessionData } from '@/lib/session';

export const middleware = async (req: NextRequest) => {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  
  const { isLoggedIn } = session;
  const { pathname } = req.nextUrl;

  // If user is logged in and tries to access /login, redirect to dashboard
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!isLoggedIn && pathname !== '/login') {
     // Allow access to static files and Next.js specific paths
    if (pathname.startsWith('/_next/') || pathname.startsWith('/static/') || pathname.includes('.')) {
        return res;
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return res;
};

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
