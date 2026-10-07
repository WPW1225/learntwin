import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { practiceBoost } from '@/lib/pipeline/twin'

export async function POST(req: Request) {
  let uid: string
  try { uid = await requireUser(req) } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const { practiceItemId, selectedIndex } = await req.json()
  const item = await db.practiceItem.findUnique({ where: { id: practiceItemId }, include: { misconception: true } })
  if (!item) return NextResponse.json({ error: 'item not found' }, { status: 404 })

  const isCorrect = selectedIndex === item.correctIndex
  await db.practiceAttempt.create({
    data: { practiceItemId, userId: uid, selectedIndex, isCorrect },
  })

  // if every item of this misconception (this assignment) now has a correct attempt, boost mastery
  let mastery = item.misconception.mastery
  if (isCorrect) {
    const siblings = await db.practiceItem.findMany({ where: { misconceptionId: item.misconceptionId, assignmentId: item.assignmentId } })
    const correctAttempts = await db.practiceAttempt.findMany({
      where: { userId: uid, practiceItemId: { in: siblings.map(s => s.id) }, isCorrect: true },
    })
    const covered = new Set(correctAttempts.map(ca => ca.practiceItemId))
    if (siblings.every(s => covered.has(s.id))) {
      mastery = await practiceBoost(item.misconceptionId)
    }
  }

  return NextResponse.json({
    isCorrect,
    correctIndex: item.correctIndex,
    explanation: item.explanation,
    mastery,
  })
}
