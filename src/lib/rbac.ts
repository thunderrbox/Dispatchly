import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JwtPayload } from './jwt';

export type AuthHandler = (
  request: NextRequest,
  context: { params: any; user: JwtPayload }
) => Promise<NextResponse> | NextResponse;

export function withAuth(
  allowedRoles: ('CUSTOMER' | 'AGENT' | 'ADMIN')[],
  handler: AuthHandler
) {
  return async (request: NextRequest, context: any) => {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized: Missing token' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient privileges' },
          { status: 403 }
        );
      }

      // Call handler with user injected into the context
      // Await params if it's a Promise (standard for Next.js 15 dynamic routing)
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
