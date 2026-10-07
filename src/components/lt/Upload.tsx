'use client'

import { useRef, useState } from 'react'
import { Camera, FileImage, Sparkles, Clock, ChevronRight, ScanLine, Stethoscope, Dumbbell } from 'lucide-react'
import { api } from '@/lib/client'

type Recent = {
  id: string; filename: string; status: string
  score: number | null; total: number | null; createdAt: string
}

const FLOW = [
  { icon: ScanLine, label: 'Snap' },
  { icon: Stethoscope, label: 'Diagnose' },
  { icon: Dumbbell, label: 'Train' },
]

export default function Upload({
  onUploaded, recents, onOpenRecent,
}: {
  onUploaded: (id: string) => void
  recents: Recent[]
  onOpenRecent: (id: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function send(file: File, name?: string) {
    setBusy(true); setError(null)
    try {
      const form = new FormData()
      form.append('image', file, name || file.name)
      const res = await api('/api/assignments', { method: 'POST', body: form })
      onUploaded(res.id)
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function trySample() {
    setBusy(true); setError(null)
    try {
      const form = new FormData()
      form.append('demo', '1')
      const res = await api('/api/assignments', { method: 'POST', body: form })
      onUploaded(res.id)
    } catch (e: any) {
      setError(e.message || 'Sample failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* headline */}
      <div className="rise-in">
        <h1 className="font-display font-bold text-2xl text-emerald-950">
          What did the homework say?
        </h1>
        <p className="text-sm text-emerald-900/60 mt-1">
          Print or handwriting — your Twin reads it, checks its own math, then asks you to confirm.
        </p>
      </div>

      {/* dropzone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault(); setDrag(false)
          const f = e.dataTransfer.files?.[0]
          if (f) send(f)
        }}
        className={`rise-in relative overflow-hidden rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300
          ${drag
            ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01] shadow-soft-lg'
            : 'border-emerald-950/[0.16] bg-white hover:border-emerald-400/70 hover:bg-emerald-50/30 shadow-soft'}`}
        style={{ animationDelay: '0.08s' }}
      >
        {/* corner glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-300/[0.12] blur-3xl" />

        <div className={`inline-flex items-center justify-center w-[72px] h-[72px] rounded-3xl mb-5 transition
          ${drag ? 'bg-emerald-500 text-white shadow-glow-emerald' : 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 border border-emerald-100'}`}>
          <span className={drag ? '' : 'float-soft'}><Camera className="w-8 h-8" /></span>
        </div>
        <h2 className="font-display font-bold text-xl text-emerald-950">Snap a homework photo</h2>
        <p className="text-sm text-emerald-900/60 mt-1.5 max-w-sm mx-auto leading-relaxed">
          Drag &amp; drop, or choose a file. One page is enough — your Twin finds the pattern behind every miss.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-6">
          <button
            onClick={() => fileRef.current?.click()} disabled={busy}
            className="btn-press h-11 px-5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700
              text-white font-semibold text-sm shadow-glow-emerald disabled:opacity-50 inline-flex items-center gap-2 justify-center"
          >
            <FileImage className="w-4 h-4" /> {busy ? 'Uploading…' : 'Choose photo'}
          </button>
          <button
            onClick={trySample} disabled={busy}
            className="btn-press h-11 px-5 rounded-xl border border-emerald-950/[0.16] bg-white hover:bg-emerald-50/60 hover:border-emerald-400 shadow-soft
              text-emerald-950/80 hover:text-emerald-950 font-semibold text-sm disabled:opacity-50 inline-flex items-center gap-2 justify-center transition"
          >
            <Sparkles className="w-4 h-4 text-violet-500" /> Try a sample assignment
          </button>
        </div>
        <input
          ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) send(f) }}
        />
        {error && <p className="text-xs text-rose-600 mt-3 bg-rose-50 inline-block rounded-lg px-3 py-1.5 pop-in">{error}</p>}

        {/* flow hint */}
        <div className="flex items-center justify-center gap-2 mt-7 text-emerald-900/55">
          {FLOW.map((f, i) => (
            <span key={f.label} className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
              <f.icon className="w-3.5 h-3.5" /> {f.label}
              {i < FLOW.length - 1 && <ChevronRight className="w-3 h-3 text-emerald-900/20" />}
            </span>
          ))}
        </div>
      </div>

      {/* recents */}
      {recents.length > 0 && (
        <div className="rise-in" style={{ animationDelay: '0.16s' }}>
          <h3 className="text-[11px] font-bold text-emerald-900/40 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Recent assignments
          </h3>
          <div className="space-y-2 stagger">
            {recents.map(r => {
              const working = r.status !== 'done' && r.status !== 'error' && r.status !== 'confirm'
              return (
                <button
                  key={r.id} onClick={() => onOpenRecent(r.id)}
                  className="card-lift w-full flex items-center justify-between rounded-2xl bg-white border border-emerald-950/[0.07] shadow-soft hover:shadow-soft-lg hover:border-emerald-200 p-3.5 text-left"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${working ? 'bg-amber-400 animate-pulse' : r.status === 'done' ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-emerald-950 truncate">{r.filename}</div>
                      <div className="text-[11px] text-emerald-900/40">
                        {new Date(r.createdAt).toLocaleString()} · {r.status === 'done' ? 'diagnosed' : r.status}
                      </div>
                    </div>
                  </div>
                  {r.status === 'done' && r.total ? (
                    <div className="text-sm shrink-0 ml-3 font-display font-bold text-emerald-950/70">
                      {r.total - (r.score ?? 0)}<span className="text-emerald-900/45 font-semibold">/{r.total}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 rounded-full px-2.5 py-1 shrink-0 ml-3">{r.status}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
