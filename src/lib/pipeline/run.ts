// LearnTwin three-ring pipeline, TS port. Rings:
//   1. EXTRACT  — photo -> structured problems (createVision), then deterministic
//                 math verification corrects the VLM's own solving slips
//   2. DIAGNOSE — wrong answers -> 1-4 root misconceptions
//   3. PRACTICE — gated MCQ generation per misconception
// State machine lives in the DB (Assignment.status): extracting -> confirm ->
// diagnosing -> done | error. Poll GET /api/assignments/[id] for progress.

import ZAI from 'z-ai-web-dev-sdk'
import path from 'node:path'
import { db } from '@/lib/db'
import { salvageJson } from './salvage'
import { verifyProblems } from './mathVerify'
import { gateItem, PracticeItem } from './gate'
import { EXTRACT_PROMPT, DIAGNOSE_PROMPT, practicePrompt } from './prompts'
import { updateTwin, findOrCreateMisconception } from './twin'

let zaiPromise: Promise<Awaited<ReturnType<typeof ZAI.create>>> | null = null
async function zai() {
  if (!zaiPromise) zaiPromise = ZAI.create()
  return zaiPromise
}

async function callJson(prompt: string, imageBase64?: string, retries = 2): Promise<any> {
  let p = prompt
  let lastErr = ''
  for (let attempt = 0; attempt <= retries; attempt++) {
    const client = await zai()
    let content: string
    if (imageBase64) {
      const res = await client.chat.completions.createVision({
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: p },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } },
          ],
        }],
        thinking: { type: 'disabled' },
      })
      content = res.choices[0]?.message?.content || ''
    } else {
      const res = await client.chat.completions.create({
        messages: [{ role: 'user', content: p }],
      })
      content = res.choices[0]?.message?.content || ''
    }
    const data = salvageJson(content)
    if (data !== null && data !== undefined) return data
    lastErr = content.slice(0, 200)
    p = prompt + `\n\nIMPORTANT: your previous reply was not valid JSON (${lastErr}...). Reply again with STRICTLY valid JSON only.`
  }
  throw new Error(`LLM did not return valid JSON after ${retries + 1} tries. Last: ${lastErr}`)
}

/* ─────────── Ring 1: EXTRACT ─────────── */
export async function runExtract(assignmentId: string) {
  const a = await db.assignment.findUnique({ where: { id: assignmentId } })
  if (!a) return
  try {
    await db.assignment.update({ where: { id: assignmentId }, data: { status: 'extracting', stage: 'Reading the assignment…' } })
    const abs = path.join(process.cwd(), 'public', a.imagePath)
    const b64 = (await import('node:fs')).readFileSync(abs).toString('base64')
    const ext = await callJson(EXTRACT_PROMPT, b64)

    let problems = (ext.problems || []).map((p: any, i: number) => ({
      number: p.number ?? i + 1,
      question: String(p.question || ''),
      studentAnswer: p.student_answer ?? null,
      readConfidence: ['high', 'medium', 'low', 'none'].includes(p.read_confidence) ? p.read_confidence : 'high',
      altReading: p.alt_reading ?? null,
      isCorrect: Boolean(p.is_correct),
      correctAnswer: p.correct_answer != null ? String(p.correct_answer) : null,
      concepts: JSON.stringify(p.concepts || []),
      errorType: p.error_type ?? null,
      confirmedAnswer: null,
    }))
    // deterministic math verification — corrects the VLM's own solving errors
    const { fixed, changes } = verifyProblems(problems.map(p => ({ ...p, studentAnswer: p.studentAnswer, correctAnswer: p.correctAnswer, isCorrect: p.isCorrect })))
    problems = problems.map(orig => {
      const f: any = fixed.find(x => x.number === orig.number)
      return f ? { ...orig, isCorrect: f.isCorrect, correctAnswer: f.correctAnswer, errorType: f.errorType ?? null } : orig
    })

    await db.assignment.update({
      where: { id: assignmentId },
      data: {
        status: 'confirm',
        stage: changes.length ? `AI re-verified the math (${changes.length} correction${changes.length > 1 ? 's' : ''})` : 'AI re-verified the math',
        subject: ext.subject ?? null,
        gradeLevel: ext.grade_level ?? null,
        legibilityNotes: ext.legibility_notes ?? null,
        total: problems.length,
        score: problems.filter((p: any) => !p.isCorrect).length,
      },
    })
    for (const p of problems) {
      await db.problem.create({
        data: { assignmentId, ...p },
      })
    }
  } catch (e: any) {
    await db.assignment.update({ where: { id: assignmentId }, data: { status: 'error', stage: String(e.message || e).slice(0, 300) } })
  }
}

/* ─────────── Rings 2+3: DIAGNOSE + PRACTICE ─────────── */
export async function runDiagnoseAndPractice(assignmentId: string) {
  const a = await db.assignment.findUnique({ where: { id: assignmentId }, include: { problems: true } })
  if (!a) return
  try {
    await db.assignment.update({ where: { id: assignmentId }, data: { status: 'diagnosing', stage: 'Finding the root causes…' } })
    const wrong = a.problems.filter(p => !p.isCorrect)
    const errLines = wrong.map(p =>
      `- Q${p.number}: "${p.question}" -> student wrote "${p.confirmedAnswer ?? p.studentAnswer}", correct is "${p.correctAnswer}". Error note: ${p.errorType || 'unknown'}.`
    ).join('\n')
    const errors = await callJson(`${DIAGNOSE_PROMPT}

Input errors (from assignment "${a.subject || 'Math'}"):
${errLines}`)
    const misconceptions = (errors.misconceptions || []).slice(0, 4)

    await db.assignment.update({
      where: { id: assignmentId },
      data: {
        stage: 'Building your practice set…',
        twinSummary: errors.summary ?? null,
        patternsObserved: errors.patterns_observed ?? null,
      },
    })

    // Twin memory: match against previous assignments, compute deltas
    const twinDelta = await updateTwin(a.userId, assignmentId, misconceptions)

    // gated practice generation per misconception
    for (let i = 0; i < misconceptions.length; i++) {
      const m = misconceptions[i]
      await db.assignment.update({ where: { id: assignmentId }, data: { stage: `Writing practice for: ${m.name.slice(0, 48)}…` } })
      const items = await genPracticeGated(m)
      const rec = await findOrCreateMisconception(a.userId, m, twinDelta)
      for (let j = 0; j < items.length; j++) {
        const it = items[j]
        await db.practiceItem.create({
          data: {
            assignmentId,
            misconceptionId: rec.id,
            question: it.question,
            options: JSON.stringify(it.options),
            correctIndex: it.correctIndex,
            explanation: it.explanation,
            targets: it.targets || '',
            order: j,
          },
        })
      }
    }
    await db.assignment.update({ where: { id: assignmentId }, data: { status: 'done', stage: '' } })
  } catch (e: any) {
    await db.assignment.update({ where: { id: assignmentId }, data: { status: 'error', stage: String(e.message || e).slice(0, 300) } })
  }
}

async function genPracticeGated(misconception: any, maxRetry = 4): Promise<PracticeItem[]> {
  const prompt = practicePrompt(misconception)
  const good: PracticeItem[] = []
  for (let attempt = 0; attempt <= maxRetry; attempt++) {
    const data = await callJson(prompt + (attempt ? `\n\nYou already tried; avoid these failures and generate fresh items.` : ''))
    const items = (data.items || []) as Array<Partial<PracticeItem> & { correct_index?: number }>
    for (const raw of items) {
      // LLM returns snake_case (per prompt schema); normalize before gating
      const it: Partial<PracticeItem> = { ...raw, correctIndex: raw.correctIndex ?? raw.correct_index }
      const probs = gateItem(it)
      if (probs.length) {
        console.log(`[gate] rejected: ${probs[0]}`)
      } else if (good.length < 3) {
        good.push({
          question: String(it.question),
          options: (it.options || []).map(String),
          correctIndex: Number(it.correctIndex),
          explanation: String(it.explanation || ''),
          targets: String(it.targets || ''),
        })
      }
    }
    if (good.length >= 3) return good.slice(0, 3)
  }
  return good // best effort
}
