import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import type { JWTPayload } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// For use in Server Components only (not API Routes)
export function getCurrentUser(): JWTPayload | null {
  try {
    // Dynamic import to avoid edge runtime issues
    const { cookies } = require('next/headers')
    const token = cookies().get('auth-token')?.value
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}
export async function clearAuthCookie() {
  const cookieStore = await cookies()

  cookieStore.set('auth-token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  })
}
