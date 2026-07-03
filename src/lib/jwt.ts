import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only';

export interface JwtPayload {
  userId: string;
  role: 'CUSTOMER' | 'AGENT' | 'ADMIN';
}

export function signToken(payload: JwtPayload): string {
  // 7-day expiry as per the specs (no session table / refresh token)
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
