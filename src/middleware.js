import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

function isPublicPath(pathname) {
  if (pathname.startsWith('/_next')) return true;
  if (pathname === '/favicon.ico') return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

async function isValidToken(token) {
  try {
    const secret = new TextEncoder().encode(
      process.env.CORTEX_JWT_SECRET || 'default-dev-secret-change-me-32chars'
    );
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token || !(await isValidToken(token))) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
