import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/jwt';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths requiring protection
  const isAdminRoute = pathname.startsWith('/admin');
  const isAgentRoute = pathname.startsWith('/agent');
  const isCustomerRoute = pathname.startsWith('/customer');

  if (!isAdminRoute && !isAgentRoute && !isCustomerRoute) {
    return NextResponse.next();
  }

  let token: string | undefined;
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    const tokenCookie = request.cookies.get('token');
    if (tokenCookie) {
      token = tokenCookie.value;
    }
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const decoded = verifyToken(token);
    const role = decoded.role;

    if (isAdminRoute && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isAgentRoute && role !== 'AGENT' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isCustomerRoute && role !== 'CUSTOMER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'session_expired');
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('token');
    return res;
  }
}

export const middleware = proxy;

export const config = {
  matcher: ['/admin/:path*', '/agent/:path*', '/customer/:path*'],
};
