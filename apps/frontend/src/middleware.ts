import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'accessToken';

const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const protectedRoutePrefixes = ['/dashboard'];
const authRoutePrefixes = ['/auth'];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.includes(pathname);
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

function isAuthRoute(pathname: string): boolean {
  return authRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(AUTH_COOKIE)?.value;

  if (isPublicRoute(pathname) || pathname === '/') {
    if (accessToken && pathname === '/') {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/dashboard';
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  if (isAuthRoute(pathname)) {
    if (accessToken) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/dashboard';
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  if (isProtectedRoute(pathname)) {
    if (!accessToken) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    /*
     * ─── RBAC HOOK (future) ──────────────────────────────────────
     * When the JWT includes role/permission claims, decode here:
     *
     * const payload = decodeJwtPayload(accessToken);
     * const requiredPermission = getRoutePermission(pathname);
     * if (requiredPermission && !payload.permissions.includes(requiredPermission)) {
     *   return NextResponse.redirect(new URL('/dashboard', request.url));
     * }
     */

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
