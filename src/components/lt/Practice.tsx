'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Trophy } from 'lucide-react'
import type { Misconception } from '@/lib/client'
import { api } from '@/lib/client'
import { Ring, useCountUp } from './motion'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

// PRACTICE ring: real generated items, one at a time, with feedback.
export default function Practice({
  misc, onDone,
}: {
  misc: Misconception
  onDone: (mastery: number) => void
}) {
  const items = misc.practice
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [result, setResult] = useState<{ isCorrect: boolean; explanation: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [mastery, setMastery] = useState(misc.mastery)
  const finished = idx >= items.length
  const shownMastery = useCountUp(mastery, 900)

  async function pick(i: number) {
    if (result || busy) return
    setBusy(true); setPicked(i)
    try {
      const r = await api('/api/practice/attempt', {
        method: 'POST',
        body: JSON.stringify({ practiceItemId: items[idx].id, selectedIndex: i }),
      })
      setResult({ isCorrect: r.isCorrect, explanation: r.explanation })
      if (typeof r.mastery === 'number') setMastery(r.mastery)
    } finally {
      setBusy(false)
    }
  }

  function next() {
    setPicked(null); setResult(null)
    setIdx(i => i + 1)
  }

  if (finished) {
    return (
      <div className="py-12 text-center space-y-6 rise-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-emerald-600 text-white shadow-soft-lg pop-in">
          <Trophy className="w-9 h-9" />
        </div>
        <h2 className="font-display font-bold text-2xl text-emerald-950">Round complete</h2>
        <div className="flex justify-center">
          <div className="rounded-3xl twin-hero px-8 py-6 shadow-soft-lg inline-flex flex-col items-center">
            <Ring value={mastery} total={100} size={128} sublabel="mastery" tone="emerald" />
          </div>
        </div>
        <p className="text-sm text-emerald-900/50 max-w-xs mx-auto leading-relaxed">
          Your Twin updated this skill to <b className="text-emerald-600">{shownMastery}% mastery</b>. {mastery < 80
            ? 'It will keep scheduling this pattern until it sticks.'
            : 'Nice work — this one is sticking.'}
        </p>
        <button
          onClick={() => onDone(mastery)}
          className="btn-press h-11 px-6 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm shadow-glow-emerald transition inline-flex items-center gap-2"
        >
          Back to results <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  const q = items[idx]

  return (
    <div className="space-y-5">
      <div className="rise-in">
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-violet-500">
            Practice · {misc.name}
          </div>
          <div className="text-[11px] font-semibold text-emerald-900/40 font-display">
            {idx + 1} <span className="text-emerald-900/25">/ {items.length}</span>
          </div>
        </div>
        <div className="flex gap-1.5 mt-2.5">
          {items.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500
              ${i < idx ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : i === idx ? 'bg-emerald-950' : 'bg-emerald-950/[0.08]'}`} />
          ))}
        </div>
      </div>

      <div className="rise-in rounded-3xl bg-white border border-emerald-950/[0.07] shadow-soft p-6" style={{ animationDelay: '0.07s' }}>
        <div className="text-[11px] text-violet-500 font-bold inline-flex items-center gap-1.5 mb-3 bg-violet-50 border border-violet-100 rounded-full px-2.5 py-1">
          <Sparkles className="w-3 h-3" /> {q.targets}
        </div>
        <p className="font-display font-semibold text-[17px] text-emerald-950 leading-relaxed">{q.question}</p>
        <div className="grid gap-2.5 mt-5">
          {q.options.map((opt, i) => {
            const isPicked = picked === i
            const showTruth = result && i === q.correctIndex
            const showWrong = result && isPicked && i !== q.correctIndex
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={!!result || busy}
                className={`btn-press h-12 rounded-xl border text-left px-4 font-semibold text-sm transition flex items-center gap-3
                  ${showTruth ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-soft'
                    : showWrong ? 'border-rose-400 bg-rose-50 text-rose-700'
                    : isPicked ? 'border-emerald-950 bg-white'
                    : 'border-emerald-950/[0.09] hover:border-emerald-400 hover:bg-emerald-50/40 bg-white'}`}
              >
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-display font-bold shrink-0 transition
                  ${showTruth ? 'bg-emerald-500 text-white'
                    : showWrong ? 'bg-rose-400 text-white'
                    : isPicked ? 'bg-emerald-950 text-white'
                    : 'bg-emerald-950/[0.05] text-emerald-950/50'}`}>
                  {LETTERS[i]}
                </span>
                <span className="flex-1">{opt}</span>
                {showTruth && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" style={{ width: 18, height: 18 }} />}
                {showWrong && <XCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" style={{ width: 18, height: 18 }} />}
              </button>
            )
          })}
        </div>
      </div>

      {result && (
        <div className={`pop-in rounded-2xl border p-4.5 shadow-soft ${result.isCorrect ? 'border-emerald-200 bg-emerald-50/80' : 'border-rose-200 bg-rose-50/80'}`} style={{ padding: '18px' }}>
          <div className={`font-display font-bold text-sm mb-1.5 flex items-center gap-2 ${result.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
            {result.isCorrect
              ? <><CheckCircle2 className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} /> Exactly right.</>
              : <><XCircle className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} /> Not quite — the answer is {q.options[q.correctIndex]}.</>}
          </div>
          <p className="text-[13px] text-emerald-950/65 leading-relaxed">{result.explanation}</p>
          <button
            onClick={next}
            className="btn-press mt-3.5 h-10 px-5 rounded-xl bg-gradient-to-b from-emerald-950 to-emerald-900 hover:from-emerald-900 hover:to-emerald-800 text-white font-semibold text-sm transition inline-flex items-center gap-2"
          >
            {idx === items.length - 1 ? 'Finish round' : 'Next question'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
