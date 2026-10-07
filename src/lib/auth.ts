// Auth: JWT (jose) + scrypt password hashing (node:crypto, zero extra deps).
// Bearer-token only — see skill notes: embedded previews don't carry cookies.
import { SignJWT, jwtVerify } from 'jose'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { db } from '@/lib/db'

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'learntwin-dev-secret-change-me-in-prod'
)
const DAY = 60 * 60 * 24

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'))
}

export async function makeToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function userIdFromRequest(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return null
  try {
    const { payload } = await jwtVerify(auth.slice(7), SECRET)
    return (payload.sub as string) || null
  } catch {
    return null
  }
}

// Route helper: returns userId or throws a 401 Response
export async function requireUser(req: Request): Promise<string> {
  const uid = await userIdFromRequest(req)
  if (!uid) throw new Error('UNAUTHORIZED')
  return uid
}

export async function createUser(username: string, password: string, role = 'student') {
  return db.user.create({
    data: { username, passwordHash: hashPassword(password), role },
  })
}
