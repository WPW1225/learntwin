import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let uid: string
  try { uid = await requireUser(req) } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const { id } = await params
  const a = await db.assignment.findFirst({ where: { id, userId: uid } })
  if (!a) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const base: any = {
    id: a.id, status: a.status, stage: a.stage, filename: a.filename,
    subject: a.subject, gradeLevel: a.gradeLevel, legibilityNotes: a.legibilityNotes,
  }

  if (a.status === 'confirm' || a.status === 'done') {
    const problems = await db.problem.findMany({ where: { assignmentId: a.id }, orderBy: { number: 'asc' } })
    base.problems = problems.map(p => ({
      number: p.number, question: p.question, studentAnswer: p.studentAnswer,
      readConfidence: p.readConfidence, altReading: p.altReading,
      confirmedAnswer: p.confirmedAnswer, isCorrect: p.isCorrect,
      correctAnswer: p.correctAnswer, errorType: p.errorType,
    }))
    base.score = a.score
    base.total = a.total
  }

  if (a.status === 'done') {
    const miscs = await db.misconception.findMany({
      where: { assignments: { some: { id: a.id } } },
      include: {
        practiceItems: { where: { assignmentId: a.id }, orderBy: { order: 'asc' } },
      },
    })
    base.twinSummary = a.twinSummary
    base.patternsObserved = a.patternsObserved
    base.misconceptions = miscs.map(m => ({
      id: m.id, name: m.name, key: m.key,
      explanationStudent: m.explanationStudent, severity: m.severity,
      mastery: m.mastery, occurrences: m.occurrences,
      isNew: m.occurrences === 1,
      practice: m.practiceItems.map(pi => ({
        id: pi.id, question: pi.question, options: JSON.parse(pi.options),
        correctIndex: pi.correctIndex, explanation: pi.explanation, targets: pi.targets,
      })),
    }))
  }
  return NextResponse.json(base)
}
