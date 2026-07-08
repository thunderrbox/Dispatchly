import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JwtPayload } from './jwt';

// Define the handler type signature, which accepts NextRequest and injected auth context
export type AuthHandler = (
  request: NextRequest,
  context: { params: any; user: JwtPayload }
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-Order Function (HOF) wrapper enforcing Role-Based Access Control (RBAC).
 * Intercepts incoming requests, validates Bearer JWT headers, checks allowedRoles permissions,
 * and passes request contexts with injected decoded user claims to the dynamic dynamic router handlers.
 */
export function withAuth(
  allowedRoles: ('CUSTOMER' | 'AGENT' | 'ADMIN')[],
  handler: AuthHandler
) {
  return async (request: NextRequest, context: any) => {
    try {
      // 1. Extract Authorization header credentials
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized: Missing token' },
          { status: 401 }
        );
      }

      // 2. Decode and verify token signature/expiry
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      // 3. Match user claims against role whitelist
      if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient privileges' },
          { status: 403 }
        );
      }

      // 4. Inject decoded claims and pass to downstream API route handlers
      const resolvedContext = {
        ...context,
        user: decoded,
      };

      return await handler(request, resolvedContext);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Unauthorized' },
        { status: 401 }
      );
    }
  };
}
