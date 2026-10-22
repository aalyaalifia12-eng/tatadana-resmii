import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userIdCookie = req.cookies.get('tatadana_user_id')?.value;

  // 1. If visiting protected dashboard or admin without a session cookie, redirect to /login
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    if (!userIdCookie) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Allow request to proceed (layout & API perform full server-side DB validation)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};
