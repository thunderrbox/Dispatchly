import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/jwt';

/**
 * Next.js 16 Security Proxy / Middleware Function.
 * Intercepts incoming HTTP requests to protected route groups (/admin, /agent, /customer),
 * extracts session tokens from Headers, Cookies, or Query Fallbacks, verifies JWT signature,
 * and enforces strict Role-Based Access Control (RBAC) boundaries.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Identify if requested URL belongs to a protected role portal
  const isAdminRoute = pathname.startsWith('/admin');
  const isAgentRoute = pathname.startsWith('/agent');
  const isCustomerRoute = pathname.startsWith('/customer');

  // If path is a public static route or public landing page, pass request through unhindered
  if (!isAdminRoute && !isAgentRoute && !isCustomerRoute) {
    return NextResponse.next();
  }

  // 2. Extract JWT authentication token using multi-source extraction ladder:
  // Source A: Authorization header ('Bearer <token>')
  // Source B: HTTP-Only cookie ('token')
  // Source C: URL query string parameter ('?token=<token>') for privacy-shielded browsers (Brave/Safari)
  let token: string | undefined;
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    const tokenCookie = request.cookies.get('token');
    if (tokenCookie && tokenCookie.value) {
      token = tokenCookie.value;
    } else {
      // Query param token fallback prevents infinite redirect loops in strict privacy browsers
      const queryToken = request.nextUrl.searchParams.get('token');
      if (queryToken) {
        token = queryToken;
      }
    }
  }

  // 3. If no session token was provided, redirect unauthenticated user to /login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 4. Verify cryptographic signature & expiration of session token
    const decoded = verifyToken(token);
    const role = decoded.role;

    // 5. Enforce Role-Based Access Control (RBAC) boundaries:
    // Admin routes require role === 'ADMIN'
    if (isAdminRoute && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Agent routes require role === 'AGENT' or 'ADMIN'
    if (isAgentRoute && role !== 'AGENT' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Customer routes require role === 'CUSTOMER' or 'ADMIN'
    if (isCustomerRoute && role !== 'CUSTOMER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 6. User is authorized! Allow request to proceed & refresh HTTP-Only session cookie
    const response = NextResponse.next();
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true, // Prevents XSS script theft
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production', // Enforce HTTPS in production
      maxAge: 7 * 24 * 60 * 60, // 7 days lifespan
    });
    return response;
  } catch (error) {
    // 7. Token verification failed (expired or invalid token)
    // Clear invalid cookie and redirect user to login page with session_expired indicator
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'session_expired');
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('token');
    return res;
  }
}

// Export proxy function as middleware for Next.js 16 runtime compliance
export const middleware = proxy;

// Configure URL matcher rules specifying which route paths trigger proxy execution
export const config = {
  matcher: ['/admin/:path*', '/agent/:path*', '/customer/:path*'],
};
