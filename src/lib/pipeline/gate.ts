// Practice-item quality gate — port of pipeline/run_pipeline.py gate_item().
// Empty problems array = pass.

import { parseAnswer, polyEq } from './mathVerify'

export type PracticeItem = {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  targets: string
}

function numKey(o: string): { a: number; b: number } | null {
  return parseAnswer(o)
}

export function gateItem(item: Partial<PracticeItem>): string[] {
  const probs: string[] = []
  const opts = item.options || []
  const ci = item.correctIndex
  if (typeof ci !== 'number' || !(ci >= 0 && ci < opts.length) || opts.length !== 4) {
    return ['structure invalid']
  }
  const correct = numKey(opts[ci])
  if (!correct) probs.push(`correct option "${opts[ci]}" not a clean number`)
  const seen = new Map<string, string[]>()
  opts.forEach(o => {
    const n = numKey(o)
    if (n) {
      const k = `${n.a}|${n.b}`
      seen.set(k, [...(seen.get(k) || []), o])
    }
  })
  for (const [k, lst] of seen) {
    if (lst.length > 1) {
      const isCorrect = correct && `${correct.a}|${correct.b}` === k
      probs.push((isCorrect ? 'correct answer duplicated: ' : 'duplicate distractors: ') + JSON.stringify(lst))
    }
  }
  if (correct) {
    const nums: string[] = []
    opts.forEach(o => { const n = numKey(o); if (n && !(n.a === correct.a && n.b === correct.b)) nums.push(o) })
    if (nums.length < 3) probs.push('fewer than 3 distinct numeric distractors')
  }
  const corrTxt = String(opts[ci])
  const expl = String(item.explanation || '')
  if (expl && corrTxt && !expl.includes(corrTxt)) {
    // explanation must mention its own correct answer (e.g. "= 11/12")
    const stripped = corrTxt.replace(/[^0-9./-]/g, '')
    if (stripped && !expl.includes(stripped)) {
      probs.push(`explanation never reaches correct answer ${corrTxt}`)
    }
  }
  const q = String(item.question || '')
  if (/(incorrect|mistaken(ly)?|wrong(ly)?|error)\w*\s+(amount|answer|result|total|value)|would you get if|if you (just )?(added|subtracted|multiplied) the (numerators|denominators)/i.test(q)) {
    probs.push('semantic: asks for the misconception result')
  }
  return probs
}
