import { NextResponse } from 'next/server'
import { userIdFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const uid = await userIdFromRequest(req)
  if (!uid) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { id: uid } })
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json({ user: { id: user.id, username: user.username, role: user.role } })
}
