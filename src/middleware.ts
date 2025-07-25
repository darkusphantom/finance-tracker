import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const middleware = async (req: NextRequest) => {
  // Se permite el paso de todas las peticiones sin verificación de sesión.
  return NextResponse.next();
};

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
