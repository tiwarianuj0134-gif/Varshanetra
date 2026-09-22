import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/features',
  '/how-it-works',
  '/contact',
  '/login',
  '/register',
  '/verify-otp',
  '/forgot-password',
  '/reset-password',
  '/select-role',
  '/satellite',
  '/historical',
  '/architecture',
  '/api-docs',
  '/offline',
];

// API routes that are public (no auth check)
const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/public/',
  '/api/seed',
  '/api/health',
  '/api/warnings',
  '/api/bulletin',
  '/api/district',
  '/api/dashboard',
  '/api/community',
  '/api/notifications',
  '/api/ai/',
  '/api/inundation/',
  '/api/alerts/',
  '/api/rainfall/',
  '/api/analytics',
  '/api/chat',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Allow all public API routes
  if (PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow public pages (pathname only — query strings are irrelevant here)
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // ── Auth check ──────────────────────────────────────────────
  // Cookie name MUST match what auth.ts creates: 'varshanetra_session'
  const sessionCookie = request.cookies.get('varshanetra_session');

  if (!sessionCookie?.value) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
