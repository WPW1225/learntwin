import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createUser, makeToken, verifyPassword } from '@/lib/auth'

export async function POST(req: Request) {
  const { username, password } = await req.json()
  if (!username || !password || String(password).length < 4) {
    return NextResponse.json({ error: 'username and password (4+ chars) required' }, { status: 400 })
  }
  const existing = await db.user.findUnique({ where: { username: String(username) } })
  if (existing) {
    if (!verifyPassword(String(password), existing.passwordHash)) {
      return NextResponse.json({ error: 'username already taken' }, { status: 409 })
    }
    const token = await makeToken(existing.id)
    return NextResponse.json({ token, user: { id: existing.id, username: existing.username, role: existing.role } })
  }
  const user = await createUser(String(username), String(password))
  const token = await makeToken(user.id)
  return NextResponse.json({ token, user: { id: user.id, username: user.username, role: user.role } })
}
