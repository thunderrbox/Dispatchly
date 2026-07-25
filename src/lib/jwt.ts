import jwt from 'jsonwebtoken';

// Retrieve JWT secret from environment or fallback during development
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only';

// Type definition representing the structured claims stored inside the stateless session token
export interface JwtPayload {
  userId: string;
  username?: string;
  role: 'CUSTOMER' | 'AGENT' | 'ADMIN';
}

/**
 * Signs a stateless JSON Web Token (JWT) containing user claims.
 * Configured with a 7-day expiration lifespan to balance user convenience and security.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies and decodes a stateless session token.
 * Throws an explicit error if the token has expired, is malformed, or has been tampered with.
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
