import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { verifyProblems } from '@/lib/pipeline/mathVerify'
import { runDiagnoseAndPractice } from '@/lib/pipeline/run'

// Student confirms/corrects the AI's readings, then the pipeline continues
// (diagnosis + practice generation) in the background.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let uid: string
  try { uid = await requireUser(req) } catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const { id } = await params
  const a = await db.assignment.findFirst({ where: { id, userId: uid } })
  if (!a || a.status !== 'confirm') return NextResponse.json({ error: 'not in confirm state' }, { status: 400 })

  const { fixes } = await req.json() // { problemNumber: "corrected value" | "alt" }

  const problems = await db.problem.findMany({ where: { assignmentId: a.id }, orderBy: { number: 'asc' } })
  const rows = problems.map(p => ({
    number: p.number, question: p.question,
    studentAnswer: p.studentAnswer, isCorrect: p.isCorrect,
    correctAnswer: p.correctAnswer, errorType: p.errorType,
  }))

  for (const p of problems) {
    const fix = fixes?.[String(p.number)]
    if (fix === 'alt' && p.altReading) {
      await db.problem.update({ where: { id: p.id }, data: { confirmedAnswer: p.altReading } })
      const row = rows.find(r => r.number === p.number)
      if (row) row.studentAnswer = p.altReading // corrected value participates in re-judging
    }
  }

  // re-run deterministic verification with corrected readings
  const { fixed } = verifyProblems(rows)
  for (const f of fixed) {
    const p = problems.find(pp => pp.number === f.number)!
    await db.problem.update({
      where: { id: p.id },
      data: {
        isCorrect: f.isCorrect,
        correctAnswer: f.correctAnswer,
        errorType: f.errorType,
      },
    })
  }
  const wrong = fixed.filter(f => !f.isCorrect).length
  await db.assignment.update({
    where: { id: a.id },
    data: { status: 'diagnosing', stage: 'Diagnosing root causes…', score: wrong, total: fixed.length },
  })

  void runDiagnoseAndPractice(a.id).catch(async e => {
    console.error('diagnose failed:', e)
    await db.assignment.update({ where: { id: a.id }, data: { status: 'error', stage: String(e).slice(0, 200) } }).catch(() => {})
  })

  return NextResponse.json({ ok: true, status: 'diagnosing' })
}
