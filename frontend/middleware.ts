import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/profile', '/insights', '/admin'];
const AUTH_PREFIX = '/auth';

function decodeRole(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    return decoded.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('rm_token')?.value ?? null;

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  const isAuthRoute = pathname.startsWith(AUTH_PREFIX);
  const isAdminRoute = pathname.startsWith('/admin');

  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && token) {
    const url = req.nextUrl.clone();
    url.pathname = '/profile';
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && token) {
    const role = decodeRole(token);
    if (role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/profile';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/insights/:path*', '/admin/:path*', '/auth/:path*'],
};
