'use client'

import { useState } from 'react'
import { ArrowRight, Repeat, AlertTriangle, CheckCircle2, XCircle, ChevronRight, Brain } from 'lucide-react'
import type { AssignmentDetail } from '@/lib/client'
import { Ring, useCountUp } from './motion'

// RESULT ring: score (the least interesting part) + per-problem verdicts +
// misconception cards with RECURRING badges from the Twin's memory.
export default function Result({
  detail, onPractice, onTwin, onNew,
}: {
  detail: AssignmentDetail
  onPractice: (mid: string) => void
  onTwin: () => void
  onNew: () => void
}) {
  const problems = detail.problems || []
  const miscs = detail.misconceptions || []
  const wrong = problems.filter(p => !p.isCorrect).length
  const right = problems.length - wrong
  const recurring = miscs.filter(m => !m.isNew).length

  const pct = problems.length > 0 ? right / problems.length : 0
  const shownRight = useCountUp(right, 1000)

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  return (
    <div className="space-y-5">
      {/* score hero — deep clinical ink */}
      <div className="relative overflow-hidden rounded-3xl twin-hero text-white p-6 shadow-soft-lg rise-in">
        <div className="pointer-events-none absolute -top-16 -left-16 w-56 h-56 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative flex items-center gap-6">
          <Ring value={right} total={problems.length} tone="emerald" sublabel="accuracy" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-display font-bold text-4xl leading-none">{shownRight}</span>
              <span className="text-lg text-white/50 font-semibold">/ {problems.length} correct</span>
              {recurring > 0 && (
                <span className="pop-in inline-flex items-center gap-1 bg-rose-400/15 text-rose-200 border border-rose-300/20 text-[11px] font-bold rounded-full px-2.5 py-1">
                  <Repeat className="w-3 h-3" /> {recurring} RECURRING
                </span>
              )}
            </div>
            <p className="text-[13px] text-white/65 mt-2.5 leading-relaxed">
              {wrong === 0
                ? 'Clean sheet — but the score is the least interesting part.'
                : <>{wrong} wrong — but they cluster into <b className="text-emerald-300">{miscs.length} root cause{miscs.length > 1 ? 's' : ''}</b>. That&apos;s what matters.</>}
            </p>
          </div>
        </div>
      </div>

      {/* twin summary — the AI moment */}
      {detail.twinSummary && (
        <div className="rise-in relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-violet-100 p-4.5 shadow-soft" style={{ animationDelay: '0.06s', padding: '18px' }}>
          <div className="pointer-events-none absolute -right-8 -top-8 w-28 h-28 rounded-full bg-violet-200/25 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center shrink-0 shadow-soft">
              <Brain className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-violet-500/70 uppercase tracking-wider mb-1">Your Twin says</div>
              <p className="text-sm text-emerald-950/80 italic leading-relaxed">&ldquo;{detail.twinSummary}&rdquo;</p>
            </div>
          </div>
        </div>
      )}

      {/* misconceptions — diagnosis cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-display font-bold text-emerald-950 rise-in" style={{ animationDelay: '0.1s' }}>
          Why the points were lost
        </h3>
        <div className="space-y-3 stagger">
          {miscs.map((m, i) => (
            <div key={m.id} className="rounded-2xl bg-white border border-emerald-950/[0.07] shadow-soft overflow-hidden card-lift hover:shadow-soft-lg">
              <div className="p-4.5" style={{ padding: '18px' }}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-display font-bold text-xs shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-display font-semibold text-[14px] text-emerald-950 leading-snug min-w-0">{m.name}</div>
                      {m.isNew ? (
                        <span className="shrink-0 text-[10px] font-bold bg-emerald-950/[0.07] text-emerald-950/60 rounded-full px-2 py-0.5 uppercase tracking-wide">New</span>
                      ) : (
                        <span className="shrink-0 pop-in inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 rounded-full px-2 py-0.5">
                          <Repeat className="w-3 h-3" /> {ordinal(m.occurrences)} time
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-emerald-900/65 mt-1.5 leading-relaxed">{m.explanationStudent}</p>
                    <div className="mt-3.5 flex items-center gap-2.5">
                      <div className="flex-1 h-2 bg-emerald-950/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 shimmer"
                          style={{ width: `${m.mastery}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-950/50 shrink-0">{m.mastery}% mastery</span>
                    </div>
                  </div>
                </div>
              </div>
              {m.practice?.length > 0 && (
                <button
                  onClick={() => onPractice(m.id)}
                  className="btn-press w-full border-t border-emerald-950/[0.06] bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100
                    text-emerald-800 font-semibold text-sm py-3.5 transition inline-flex items-center justify-center gap-2"
                >
                  Practice it — {m.practice.length} questions <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* per-problem */}
      <div className="space-y-2">
        <h3 className="text-sm font-display font-bold text-emerald-950" style={{ animationDelay: '0.14s' }}>Every problem</h3>
        <div className="space-y-2 stagger">
          {problems.map(p => (
            <div key={p.number} className="card-lift flex items-center gap-3 rounded-2xl bg-white border border-emerald-950/[0.06] shadow-soft p-3.5">
              <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${p.isCorrect ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>
                {p.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-emerald-950/75 truncate font-medium">{p.question}</div>
                <div className="text-[11px] text-emerald-900/40 mt-0.5">
                  you: <b className="text-emerald-950/60">{p.studentAnswer ?? 'blank'}</b>
                  {!p.isCorrect && <> · correct: <b className="text-emerald-950/60">{p.correctAnswer}</b></>}
                </div>
              </div>
              {!p.isCorrect && p.errorType && (
                <span className="shrink-0 text-[10px] text-emerald-900/40 bg-emerald-950/[0.04] border border-emerald-950/[0.06] rounded-full px-2 py-0.5 hidden sm:inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{p.errorType.slice(0, 34)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2.5 pb-8 rise-in" style={{ animationDelay: '0.18s' }}>
        <button onClick={onTwin} className="btn-press flex-1 h-12 rounded-2xl border border-emerald-950/[0.1] bg-white hover:bg-emerald-50/60 hover:border-emerald-300 text-emerald-950 font-semibold text-sm transition inline-flex items-center justify-center gap-2">
          See my Twin <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={onNew} className="btn-press flex-1 h-12 rounded-2xl bg-gradient-to-b from-emerald-950 to-emerald-900 hover:from-emerald-900 hover:to-emerald-800 text-white font-semibold text-sm shadow-soft transition">
          New assignment
        </button>
      </div>
    </div>
  )
}
