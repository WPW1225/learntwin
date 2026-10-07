// Deterministic math verification for Grade 6-8 problems — the TS port of
// pipeline/math_verify.py (which used sympy). We don't need a full CAS:
// the scope is arithmetic expressions, linear equations in x, and
// "simplify a(x+b) ± cx" style expansions. A tiny recursive-descent parser
// over a linear-polynomial domain covers all of it deterministically.

export type Poly = { a: number; b: number } // represents a*x + b
const EPS = 1e-9

type Tok = { t: 'num'; v: number } | { t: 'x' } | { t: 'op'; v: string }

function prep(expr: string): string {
  let e = expr.trim().replace(/[=]+$/, '').trim()
  e = e.replace(/[×✕]/g, '*').replace(/[−–]/g, '-').replace(/[÷]/g, '/')
  let prev = ''
  while (prev !== e) {
    prev = e
    e = e.replace(/(\d)\s*\(/g, '$1*(')
    e = e.replace(/\)\s*\(/g, ')*(')
    e = e.replace(/([0-9)])\s*x\b/g, '$1*x')
    e = e.replace(/\bx\s*\(/g, 'x*(')
  }
  return e
}

function tokenize(s: string): Tok[] | null {
  const toks: Tok[] = []
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === ' ') { i++; continue }
    if (ch === 'x' || ch === 'X') { toks.push({ t: 'x' }); i++; continue }
    if ('+-*/()'.includes(ch)) { toks.push({ t: 'op', v: ch }); i++; continue }
    const num = /^(\d+\.\d+|\.\d+|\d+(?:\s*\/\s*\d+)?)/.exec(s.slice(i))
    if (num) {
      const raw = num[1].replace(/\s+/g, '')
      const v = raw.includes('/') ? Number(raw.split('/')[0]) / Number(raw.split('/')[1]) : Number(raw)
      toks.push({ t: 'num', v })
      i += num[1].length
      continue
    }
    return null // unsupported char
  }
  return toks.length ? toks : null
}

// Recursive descent: expr := term (('+'|'-') term)* ; term := unary (('*'|'/') unary)*
// Constraint: multiplication is allowed only if at most one side contains x;
// division denominator must be constant. Result stays linear (a*x + b).
function parsePoly(toks: Tok[]): Poly | null {
  let pos = 0
  const peek = () => toks[pos]
  const eat = (v: string) => { if (peek()?.t === 'op' && (peek() as any).v === v) { pos++; return true } return false }

  function expr(): Poly | null {
    let left = term()
    if (!left) return null
    for (;;) {
      if (eat('+')) { const r = term(); if (!r) return null; left = { a: left.a + r.a, b: left.b + r.b } }
      else if (eat('-')) { const r = term(); if (!r) return null; left = { a: left.a - r.a, b: left.b - r.b } }
      else return left
    }
  }
  function term(): Poly | null {
    let left = unary()
    if (!left) return null
    for (;;) {
      if (eat('*')) {
        const r = unary(); if (!r) return null
        if (left.a !== 0 && r.a !== 0) return null // x*x not linear
        // exactly one side is the constant s: scale the OTHER side's full poly
        const s = left.a === 0 ? left.b : r.b
        const o = left.a === 0 ? r : left
        left = { a: o.a * s, b: o.b * s }
      } else if (eat('/')) {
        const r = unary(); if (!r) return null
        if (r.a !== 0 || Math.abs(r.b) < EPS) return null // divide by x or by 0
        left = { a: left.a / r.b, b: left.b / r.b }
      } else return left
    }
  }
  function unary(): Poly | null {
    if (eat('-')) { const p = unary(); return p ? { a: -p.a, b: -p.b } : null }
    if (eat('+')) return unary()
    const t = peek()
    if (!t) return null
    if (t.t === 'num') { pos++; return { a: 0, b: t.v } }
    if (t.t === 'x') { pos++; return { a: 1, b: 0 } }
    if (eat('(')) { const p = expr(); if (p && eat(')')) return p; return null }
    return null
  }

  const result = expr()
  if (!result || pos !== toks.length) return null
  return result
}

export function parsePolyStr(s: string): Poly | null {
  const toks = tokenize(prep(s))
  if (!toks) return null
  return parsePoly(toks)
}

export function solveQuestion(question: string): { kind: 'value' | 'poly'; poly: Poly } | null {
  const q = question.replace(/[×✕]/g, '*').replace(/[−–]/g, '-')
  // shape: Solve ... : lhs = rhs   (linear equation)
  const mSolve = /[Ss]olve\s*[^:]*:?\s*([^=]+)=\s*([^,]+)/.exec(q)
  if (mSolve) {
    const lhs = parsePolyStr(mSolve[1])
    const rhs = parsePolyStr(mSolve[2])
    if (!lhs || !rhs) return null
    const a = lhs.a - rhs.a, b = lhs.b - rhs.b
    if (Math.abs(a) < EPS) return null // not solvable linear
    return { kind: 'value', poly: { a: 0, b: -b / a } }
  }
  // shape: Simplify: expr (may end with =)
  const mSimp = /[Ss]implify\s*:?\s*(.+?)(?:=|$)/.exec(q)
  if (mSimp) {
    const p = parsePolyStr(mSimp[1])
    if (!p) return null
    return { kind: 'poly', poly: p }
  }
  // shape: bare equation "2x + 5 = 13" (no Solve prefix; x in lhs, constant rhs)
  const mBare = /^([^=]+)=\s*([^,=]+)$/.exec(q.trim())
  if (mBare) {
    const lhs = parsePolyStr(mBare[1])
    const rhs = parsePolyStr(mBare[2])
    if (lhs && rhs && Math.abs(lhs.a) > EPS && Math.abs(rhs.a) < EPS) {
      const a = lhs.a - rhs.a, b = lhs.b - rhs.b
      if (Math.abs(a) >= EPS) return { kind: 'value', poly: { a: 0, b: -b / a } }
    }
  }
  // shape: pure arithmetic "a op b op c ="
  if (/\d/.test(q)) {
    const tail = q.includes('=') ? q.split('=')[0] : q
    if (/^[\d/\.\+\-\*\s()]+$/.test(tail.replace(/\s/g, '')) && /\d/.test(tail)) {
      const p = parsePolyStr(tail)
      if (!p) return null
      return { kind: 'value', poly: p }
    }
  }
  return null
}

// fraction-aware number parse: "4", "4/12", "0.43", "x = 4", "2x + 3"
export function parseAnswer(s: string | null | undefined): { a: number; b: number } | null {
  if (s == null) return null
  let str = String(s).replace(/^x\s*=\s*/i, '').replace(/\$/g, '').replace(/,/g, '').trim()
  // strip trailing units like "cup", "miles", "cm" when standalone
  str = str.replace(/\s*(cups?|miles?|yards?|meters?|cm|km|dollars?)\s*$/i, '').trim()
  // algebraic "ax + b" form
  if (/[a-zA-Z]/.test(str)) {
    return parsePolyStr(str)
  }
  const m = /(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)|(-?\d+(?:\.\d+)?)/.exec(str)
  if (!m) return null
  if (m[1] !== undefined) {
    const den = parseFloat(m[2])
    if (!den || Math.abs(den) < EPS) return null
    return { a: 0, b: parseFloat(m[1]) / den }
  }
  return { a: 0, b: parseFloat(m[3]) }
}

export function polyEq(p1: Poly | null, p2: Poly | null): boolean | null {
  if (!p1 || !p2) return null
  return Math.abs(p1.a - p2.a) < EPS && Math.abs(p1.b - p2.b) < EPS
}

function niceNumber(v: number): string {
  if (Math.abs(v - Math.round(v)) < 1e-9) return `${Math.round(v)}`
  // try small-denominator fraction (1/2 .. 1/12) for display fidelity
  for (let den = 2; den <= 12; den++) {
    const num = v * den
    if (Math.abs(num - Math.round(num)) < 1e-9) {
      const n = Math.round(num)
      const g = gcd(Math.abs(n), den)
      return `${n / g}/${den / g}`
    }
  }
  return `${Math.round(v * 100) / 100}`
}

function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : a }

export function fmtPoly(p: Poly): string {
  const aNum = Math.abs(p.a - Math.round(p.a)) < 1e-9 ? Math.round(p.a) : Math.round(p.a * 100) / 100
  if (aNum === 0) return niceNumber(p.b)
  const aStr = aNum === 1 ? 'x' : aNum === -1 ? '-x' : `${aNum}x`
  if (Math.abs(p.b) < 1e-9) return aStr
  return p.b > 0 ? `${aStr} + ${niceNumber(p.b)}` : `${aStr} - ${niceNumber(-p.b)}`
}

// Main entry: given a problem row, independently solve and correct the VLM's math.
// Returns list of changes applied: [{number, vlm, truth}]
export type ProblemRow = {
  number: number
  question: string
  studentAnswer: string | null
  correctAnswer: string | null
  isCorrect: boolean
  errorType?: string | null
}

export function verifyProblems<T extends ProblemRow>(problems: T[]): { fixed: T[]; changes: Array<{ number: number; vlm: string; truth: string }> } {
  const changes: Array<{ number: number; vlm: string; truth: string }> = []
  const fixed = problems.map(p => {
    const truth = solveQuestion(p.question)
    if (!truth) return p
    const truthStr = fmtPoly(truth.poly)
    const vlmCorrect = parseAnswer(p.correctAnswer)
    const vlmMatches = polyEq(vlmCorrect, truth.poly)
    if (vlmCorrect && vlmMatches === false) {
      changes.push({ number: p.number, vlm: String(p.correctAnswer), truth: truthStr })
      const student = parseAnswer(p.studentAnswer)
      const studentOk = student ? polyEq(student, truth.poly) === true : false
      return { ...p, correctAnswer: truthStr, isCorrect: studentOk, errorType: studentOk ? null : (p.errorType || 'answer does not match correct solution') }
    }
    // VLM correct answer agrees (or unparsable): still enforce isCorrect consistency both ways
    const student = parseAnswer(p.studentAnswer)
    const correct = vlmCorrect || truth.poly
    if (student) {
      const ok = polyEq(student, correct) === true
      if (ok && !p.isCorrect) return { ...p, isCorrect: true, errorType: null }
      if (!ok && p.isCorrect) return { ...p, isCorrect: false, errorType: p.errorType || 'answer does not match correct solution' }
    }
    return p
  })
  return { fixed, changes }
}
