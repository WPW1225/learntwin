// Unit test: TS mathVerify must reproduce the Python sympy layer's behavior
// on the known failure cases (ported from pipeline/math_verify.py __main__).
import { verifyProblems } from './mathVerify'
import { parseAnswer, polyEq, fmtPoly, parsePolyStr } from './mathVerify'

let fails = 0
function check(name: string, cond: boolean) {
  if (!cond) { fails++; console.log('❌', name) } else { console.log('✅', name) }
}

// 1. the distributive slip that fooled the VLM
let r = verifyProblems([{ number: 1, question: 'Simplify: 4(x + 3) − 2x =', studentAnswer: '2x + 3', isCorrect: true, correctAnswer: '2x + 3', errorType: null }])
check('Q3 distributive: corrected to 2x + 12', r.fixed[0].correctAnswer === '2x + 12')
check('Q3 distributive: judged wrong', r.fixed[0].isCorrect === false)
check('Q3 distributive: change logged', r.changes.length === 1 && r.changes[0].truth === '2x + 12')

// 2. linear equation
r = verifyProblems([{ number: 2, question: 'Solve: 5(x − 2) = 20, x =', studentAnswer: '4', isCorrect: false, correctAnswer: '6', errorType: 'forgot +2' }])
check('Q5 linear: stays wrong, truth 6', r.fixed[0].isCorrect === false && r.fixed[0].correctAnswer === '6')

// 3. decimals
r = verifyProblems([{ number: 3, question: '0.35 + 0.8 =', studentAnswer: '0.43', isCorrect: false, correctAnswer: '1.15', errorType: 'place value' }])
check('Q1 decimal: truth 1.15', r.fixed[0].correctAnswer === '1.15' && r.fixed[0].isCorrect === false)

// 4. fractions
r = verifyProblems([{ number: 4, question: '3/4 + 1/8 =', studentAnswer: '4/12', isCorrect: false, correctAnswer: '7/8', errorType: 'num+den' }])
check('Q1 fraction: truth 7/8', r.fixed[0].isCorrect === false && r.fixed[0].correctAnswer === '7/8')

// 5. "x = 4" answer form
const p = parseAnswer('x = 4')
check('x = 4 parses to 4', p !== null && Math.abs((p as any).b - 4) < 1e-9)

// 6. bidirectional consistency: wrong judged right must flip
r = verifyProblems([{ number: 6, question: '6.2 × 0.5 =', studentAnswer: '3.1', isCorrect: true, correctAnswer: '3.1', errorType: null }])
check('Q2 crossed-out: stays right', r.fixed[0].isCorrect === true)
r = verifyProblems([{ number: 7, question: '2x + 5 = 13', studentAnswer: '9', isCorrect: true, correctAnswer: '4', errorType: null }])
check('wrong-judged-right flips to wrong', r.fixed[0].isCorrect === false)

// 7. fraction display
check('0.875 renders 7/8', fmtPoly({ a: 0, b: 0.875 }) === '7/8')
check('0.5 renders 1/2', fmtPoly({ a: 0, b: 0.5 }) === '1/2')

// 8. poly parse equivalence: 2x+12 == 12+2x
check('poly commutative eq', polyEq(parsePolyStr('2x + 12'), parsePolyStr('12 + 2x')) === true)

console.log(fails ? `\n❌ ${fails} FAILURES` : '\n✅ ALL PASS')
process.exit(fails ? 1 : 0)
