import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'bookleaf-secret-jwt-key-2026-secure';
const COOKIE_NAME = 'bookleaf_token';

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

export async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Extract authenticated user session from Route Handler Request or Server Component cookies
 */
export async function getSessionUser(request = null) {
  let token = null;

  // 1. Try Authorization header
  if (request && typeof request.headers?.get === 'function') {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // 2. Try request cookies
  if (!token && request && request.cookies) {
    token = request.cookies.get?.(COOKIE_NAME)?.value;
  }

  // 3. Try Next.js next/headers cookies() (for Server Components)
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch (e) {
      // Not in Server Component / async context
    }
  }

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export { COOKIE_NAME };
