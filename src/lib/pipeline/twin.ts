// Twin persistent state — Prisma port of pipeline/twin_state.py.
// Misconceptions are keyed by topic_tree path; LLM wording drift between runs
// is bridged by token-overlap fuzzy matching on the name.

import { db } from '@/lib/db'

export type MiscInput = {
  name: string
  topic_tree?: string[]
  [k: string]: any
}

export function miscKey(m: MiscInput): string {
  const tt = m.topic_tree || []
  if (tt.length) return tt.join('/')
  return (m.name || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '_')
}

function similar(a: string, b: string): number {
  const ta = new Set((a || '').toLowerCase().match(/[a-z]{3,}/g) || [])
  const tb = new Set((b || '').toLowerCase().match(/[a-z]{3,}/g) || [])
  if (!ta.size || !tb.size) return 0
  let inter = 0
  ta.forEach(w => { if (tb.has(w)) inter++ })
  return inter / (ta.size + tb.size - inter)
}

export async function findOrCreateMisconception(userId: string, m: MiscInput, delta?: TwinDelta): Promise<{ id: string }> {
  const existing = await db.misconception.findMany({ where: { userId } })
  const key = miscKey(m)
  let rec = existing.find(e => e.key === key) || null
  if (!rec) {
    let best: typeof existing[0] | null = null
    let bestScore = 0
    for (const e of existing) {
      const s = similar(m.name || '', e.name)
      if (s > bestScore) { best = e; bestScore = s }
    }
    if (best && bestScore >= 0.45) rec = best
  }
  if (rec) return rec
  return await db.misconception.create({
    data: {
      userId,
      key,
      name: m.name,
      topicTree: JSON.stringify(m.topic_tree || []),
      explanationStudent: m.explanation_student || '',
      explanationParent: m.explanation_parent || '',
      severity: m.severity || 'medium',
      mastery: 35,
      evidence: JSON.stringify([]),
    },
  })
}

export type TwinDelta = {
  newOnes: Array<{ key: string; name: string }>
  recurring: Array<{ key: string; name: string; occurrences: number; masteryBefore: number; masteryAfter: number; message: string }>
}

export async function updateTwin(userId: string, assignmentId: string, misconceptions: MiscInput[]): Promise<TwinDelta> {
  const delta: TwinDelta = { newOnes: [], recurring: [] }
  const existing = await db.misconception.findMany({ where: { userId } })
  for (const m of misconceptions) {
    const key = miscKey(m)
    let rec = existing.find(e => e.key === key) || null
    if (!rec) {
      let best: typeof existing[0] | null = null
      let bestScore = 0
      for (const e of existing) {
        const s = similar(m.name || '', e.name)
        if (s > bestScore) { best = e; bestScore = s }
      }
      if (best && bestScore >= 0.45) rec = best
    }
    if (rec) {
      const before = rec.mastery
      const after = Math.max(5, before - 10)
      const occurrences = rec.occurrences + 1
      const evidence = JSON.parse(rec.evidence || '[]')
      evidence.push({ assignmentId, at: new Date().toISOString() })
      await db.misconception.update({
        where: { id: rec.id },
        data: { occurrences, mastery: after, evidence: JSON.stringify(evidence), lastSeenAt: new Date(), name: m.name,
                assignments: { connect: { id: assignmentId } } },
      })
      delta.recurring.push({
        key: rec.key,
        name: m.name,
        occurrences,
        masteryBefore: before,
        masteryAfter: after,
        message: `Seen ${occurrences}x — this pattern is coming back.`,
      })
    } else {
      const created = await db.misconception.create({
        data: {
          userId,
          key,
          name: m.name,
          topicTree: JSON.stringify(m.topic_tree || []),
          explanationStudent: m.explanation_student || '',
          explanationParent: m.explanation_parent || '',
          severity: m.severity || 'medium',
          mastery: 35,
          evidence: JSON.stringify([{ assignmentId, at: new Date().toISOString() }]),
          assignments: { connect: { id: assignmentId } },
        },
      })
      existing.push(created as any)
      delta.newOnes.push({ key, name: m.name })
    }
  }
  return delta
}

// called after a practice round where the student answered all items for one
// misconception correctly: mastery +15 (cap 95)
export async function practiceBoost(misconceptionId: string): Promise<number> {
  const rec = await db.misconception.findUnique({ where: { id: misconceptionId } })
  if (!rec) return 0
  const after = Math.min(95, rec.mastery + 15)
  await db.misconception.update({ where: { id: misconceptionId }, data: { mastery: after } })
  return after
}
