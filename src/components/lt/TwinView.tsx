'use client'

import { Repeat, Brain, Plus, CalendarDays, Radar } from 'lucide-react'
import type { TwinOverview } from '@/lib/client'
import { Mark } from './motion'

export default function TwinView({ data, onNew }: { data: TwinOverview; onNew: () => void }) {
  const miscs = data.twin?.misconceptions || []
  const history = data.history || []
  const mastered = miscs.filter(m => m.mastery >= 80).length

  return (
    <div className="space-y-5">
      {/* dark twin hero */}
      <div className="relative overflow-hidden rounded-3xl twin-hero text-white p-7 shadow-soft-lg rise-in">
        <div className="pointer-events-none absolute -top-14 -right-10 w-56 h-56 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-wider text-emerald-200/80">
          <Brain className="w-4 h-4" /> Your Learning Twin
        </div>

        <div className="relative flex items-start gap-4 mt-4">
          <div className="hidden sm:block float-soft"><Mark size={52} glow /></div>
          <p className="text-[15px] text-emerald-50/95 leading-relaxed max-w-md">
            {miscs.length === 0
              ? 'No diagnosed gaps yet — upload an assignment and I&apos;ll start building your profile.'
              : <>I&apos;m tracking <b className="text-white">{miscs.length} pattern{miscs.length > 1 ? 's' : ''}</b> across <b className="text-white">{history.length} assignment{history.length === 1 ? '' : 's'}</b>. They don&apos;t disappear until you beat them twice.</>}
          </p>
        </div>

        {/* stats row */}
        <div className="relative grid grid-cols-3 gap-2.5 mt-6">
          {[
            { n: miscs.length, label: 'patterns tracked' },
            { n: history.length, label: 'assignments read' },
            { n: mastered, label: 'mastered' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-white/[0.09] border border-white/[0.12] px-3.5 py-3 backdrop-blur-sm">
              <div className="font-display font-bold text-2xl leading-none text-white">{s.n}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100/75 mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* mastery map */}
      <div className="space-y-3">
        <h3 className="text-sm font-display font-bold text-emerald-950 flex items-center gap-1.5 rise-in" style={{ animationDelay: '0.06s' }}>
          <Radar className="w-4 h-4 text-emerald-600" /> Mastery map
        </h3>
        {miscs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-emerald-950/[0.12] bg-white/60 p-8 text-center text-sm text-emerald-900/55 fade-in">
            Nothing tracked yet — upload an assignment to begin.
          </div>
        )}
        <div className="space-y-3 stagger">
          {miscs.map(m => (
            <div key={m.id} className="card-lift rounded-2xl bg-white border border-emerald-950/[0.07] shadow-soft p-4.5 hover:shadow-soft-lg" style={{ padding: '18px' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-display font-semibold text-[15px] text-emerald-950 leading-snug">{m.name}</div>
                {m.occurrences > 1 && (
                  <span className="shrink-0 pop-in inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 rounded-full px-2 py-0.5">
                    <Repeat className="w-3 h-3" /> seen {m.occurrences}×
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2.5">
                <div className="flex-1 h-2 bg-emerald-950/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 shimmer bg-gradient-to-r from-emerald-400 to-emerald-600"
                    style={{ width: `${m.mastery}%` }}
                  />
                </div>
                <span className="text-[11px] font-display font-bold text-emerald-950/50 shrink-0">{m.mastery}%</span>
              </div>
              <div className="text-[11px] text-emerald-900/55 mt-2 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                first seen {new Date(m.firstSeenAt).toLocaleDateString()} · last seen {new Date(m.lastSeenAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* history */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-display font-bold text-emerald-950 rise-in" style={{ animationDelay: '0.1s' }}>Assignment history</h3>
          <div className="space-y-2 stagger">
            {history.map(a => (
              <div key={a.id} className="card-lift flex items-center gap-3 rounded-2xl bg-white border border-emerald-950/[0.06] shadow-soft p-3.5">
                <span className="w-1.5 h-9 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-emerald-950 truncate">{a.filename}</div>
                  <div className="text-[11px] text-emerald-900/40">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                {a.total != null && (
                  <div className="text-sm font-display font-bold text-emerald-950/60">
                    {a.total - (a.score ?? 0)}<span className="text-emerald-900/25 font-semibold">/{a.total}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onNew}
        className="btn-press w-full h-12 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm shadow-glow-emerald transition inline-flex items-center justify-center gap-2 mb-8 rise-in"
        style={{ animationDelay: '0.14s' }}
      >
        <Plus className="w-4 h-4" /> New assignment
      </button>
    </div>
  )
}
