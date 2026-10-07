'use client'

import { useState } from 'react'
import { Check, Pencil, ShieldAlert, ArrowRight, ScanLine } from 'lucide-react'
import type { Problem } from '@/lib/client'
import { api } from '@/lib/client'

// CONFIRM ring: the product answer to VLM misreads (4 vs 9 handwriting etc).
// Low/medium confidence rows are flagged amber with an alt-reading switch.
export default function Confirm({
  assignmentId, problems, onConfirmed, legibilityNotes,
}: {
  assignmentId: string
  problems: Problem[]
  onConfirmed: () => void
  legibilityNotes?: string | null
}) {
  const [fixes, setFixes] = useState<Record<number, string>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const flagged = problems.filter(p => p.readConfidence === 'low' || p.readConfidence === 'medium').length

  function toggleFix(p: Problem) {
    setFixes(f => ({ ...f, [p.number]: f[p.number] !== undefined ? undefined : (p.altReading || '') }))
  }

  async function confirm() {
    setBusy(true)
    try {
      await api(`/api/assignments/${assignmentId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ fixes }),
      })
      onConfirmed()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rise-in">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2">
          <ScanLine className="w-3.5 h-3.5" /> Reading check
        </div>
        <h2 className="font-display font-bold text-xl text-emerald-950 leading-snug">
          Before I diagnose —<br className="sm:hidden" /> did I read your work right?
        </h2>
        <p className="text-sm text-emerald-900/50 mt-1.5">
          {flagged > 0
            ? <>I flagged <b className="text-amber-600">{flagged} reading{flagged > 1 ? 's' : ''}</b> I&apos;m not sure about. Tap ✎ if I misread you.</>
            : 'Tap ✓ on each row to confirm my reading. Anything off? Your correction changes the diagnosis.'}
        </p>
      </div>

      {legibilityNotes && (
        <div className="rounded-xl bg-amber-50/70 border border-amber-200/60 px-4 py-2.5 text-[12px] text-amber-800/80 fade-in">
          <b className="font-semibold">Handwriting notes:</b> {legibilityNotes}
        </div>
      )}

      <div className="space-y-2 stagger">
        {problems.map(p => {
          const uncertain = p.readConfidence === 'low' || p.readConfidence === 'medium'
          const fixed = fixes[p.number] !== undefined && fixes[p.number] !== ''
          return (
            <div
              key={p.number}
              className={`card-lift flex items-center gap-3 rounded-2xl border p-3.5 transition-all
                ${fixed
                  ? 'border-emerald-400/70 bg-emerald-50/70 shadow-soft'
                  : uncertain
                    ? 'border-amber-300/80 bg-amber-50/50 shadow-soft'
                    : 'border-emerald-950/[0.07] bg-white shadow-soft hover:border-emerald-200'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-xs shrink-0
                ${fixed ? 'bg-emerald-500 text-white' : uncertain ? 'bg-amber-100 text-amber-700' : 'bg-emerald-950/[0.05] text-emerald-950/60'}`}>
                {p.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-emerald-900/45 truncate">{p.question}</div>
                <div className="font-bold text-[15px] mt-0.5 text-emerald-950">
                  I read: <span className="text-emerald-600">{fixed ? fixes[p.number] : p.studentAnswer ?? '(blank)'}</span>
                  {fixed && <span className="text-[11px] text-emerald-600/60 font-normal ml-1.5">corrected</span>}
                </div>
              </div>
              {uncertain && !fixed && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-200/80 text-amber-800 rounded-full px-2 py-0.5">
                  <ShieldAlert className="w-3 h-3" /> unsure
                </span>
              )}
              {uncertain ? (
                <button
                  onClick={() => toggleFix(p)}
                  className={`btn-press shrink-0 h-8 px-3 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1
                    ${fixed ? 'bg-emerald-600 text-white shadow-glow-emerald' : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300/50'}`}
                >
                  {fixed ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                  {fixed ? 'fixed' : `use ${p.altReading}`}
                </button>
              ) : (
                <button
                  onClick={() => setChecked(c => ({ ...c, [p.number]: !c[p.number] }))}
                  className={`btn-press shrink-0 h-8 w-8 rounded-lg transition inline-flex items-center justify-center
                    ${checked[p.number]
                      ? 'bg-emerald-600 text-white shadow-glow-emerald pop-in'
                      : 'bg-emerald-950/[0.05] text-emerald-950/35 hover:bg-emerald-950/10 hover:text-emerald-950/60'}`}
                  aria-label={`confirm reading of question ${p.number}`}
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {note && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[13px] text-emerald-800 fade-in">{note}</div>}

      <button
        onClick={confirm} disabled={busy}
        className="btn-press w-full h-12 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700
          text-white font-semibold shadow-glow-emerald transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {busy ? (
          <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Diagnosing…</>
        ) : (
          <>Looks right — diagnose me <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  )
}
