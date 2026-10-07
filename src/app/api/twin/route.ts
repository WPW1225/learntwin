import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  let uid: string
  try { uid = await requireUser(req) } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const miscs = await db.misconception.findMany({
    where: { userId: uid },
    orderBy: [{ mastery: 'asc' }],
  })
  const assignments = await db.assignment.findMany({
    where: { userId: uid, status: 'done' },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: { id: true, filename: true, score: true, total: true, createdAt: true, twinSummary: true },
  })
  return NextResponse.json({
    twin: {
      misconceptions: miscs.map(m => ({
        id: m.id, name: m.name, key: m.key, mastery: m.mastery,
        occurrences: m.occurrences, severity: m.severity,
        explanationStudent: m.explanationStudent,
        lastSeenAt: m.lastSeenAt, firstSeenAt: m.firstSeenAt,
      })),
    },
    history: assignments,
  })
}
