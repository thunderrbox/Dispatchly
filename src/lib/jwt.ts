import jwt from 'jsonwebtoken';

// Retrieve JWT secret key from environment variables (process.env.JWT_SECRET).
// Fallback to a developer secret key if running in local development mode without a .env file.
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only';

/**
 * Type definition representing the structured user identity claims stored inside each stateless JWT token.
 * Contains the unique database user ID, username, and role permission category ('CUSTOMER' | 'AGENT' | 'ADMIN').
 */
export interface JwtPayload {
  userId: string;
  username?: string;
  role: 'CUSTOMER' | 'AGENT' | 'ADMIN';
}

/**
 * Creates and signs a digital JSON Web Token (JWT) using the secret key.
 * Used upon successful login or registration to authenticate the user statelessly.
 * Configured with a 7-day expiration lifespan ('7d') so users stay logged in safely.
 * 
 * @param payload User identity information (userId, username, role)
 * @returns Signed JWT string token
 */
export function signToken(payload: JwtPayload): string {
  // Sign the payload using jsonwebtoken library and the secret key
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies the digital signature of an incoming JWT token string and decodes its payload claims.
 * Throws an explicit error if the token has expired, is malformed, or has been tampered with by an attacker.
 * 
 * @param token Encrypted JWT string from cookies or Authorization header
 * @returns Decoded JwtPayload claims object containing userId and role
 */
export function verifyToken(token: string): JwtPayload {
  try {
    // Cryptographically verify token authenticity against secret key
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    // If signature check fails or token is expired, throw explicit user-facing error
    throw new Error('Invalid or expired session token. Please log in again.');
  }
}
