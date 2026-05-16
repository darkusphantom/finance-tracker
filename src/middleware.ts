import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/session';

export const middleware = async (req: NextRequest) => {
  const res = NextResponse.next();
  const token = req.cookies.get('auth-token')?.value;

  // [ALTA-2] Verificar la firma HMAC del token con Web Crypto API (Edge-compatible).
  // Un UUID crudo o un token alterado serán rechazados por verifySessionToken.
  const userId = token ? await verifySessionToken(token) : null;
  const isLoggedIn = !!userId;

  const { pathname } = req.nextUrl;

  // Rutas públicas: API, assets estáticos e icono
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.endsWith('.ico')) {
    return res;
  }

  // Usuario autenticado intentando acceder a login/registro → dashboard
  if (isLoggedIn && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Usuario no autenticado (o token inválido/forjado) → login
  if (!isLoggedIn && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
};

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

