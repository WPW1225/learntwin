'use client'

import { useState } from 'react'
import { Eye, Stethoscope, Dumbbell, ArrowRight } from 'lucide-react'
import { api, setToken } from '@/lib/client'
import { Mark } from './motion'

export default function Auth({ onDone }: { onDone: (user: { id: string; username: string }) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || password.length < 4) {
      setError('Pick a name and a 4+ character password.')
      return
    }
    setBusy(true); setError(null)
    try {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
      })
      setToken(res.token)
      onDone(res.user)
    } catch (err: any) {
      setError(err.message === 'username already taken'
        ? 'That name is taken with a different password — try another.'
        : err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const features = [
    { icon: Eye, title: 'It reads', desc: 'Snap homework — print or handwriting.' },
    { icon: Stethoscope, title: 'It diagnoses', desc: 'Not “wrong answer” — which pattern made you miss it.' },
    { icon: Dumbbell, title: 'It trains', desc: 'Practice tuned to your exact misconception, not random drills.' },
  ]

  return (
    <div className="canvas-paper min-h-dvh flex flex-col lg:flex-row">
      {/* ---- brand story panel ---- */}
      <div className="relative hidden lg:flex flex-col justify-between flex-1 px-12 xl:px-16 py-12 overflow-hidden">
        {/* ambient blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -right-20 w-[28rem] h-[28rem] rounded-full bg-violet-300/15 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <Mark size={34} />
          <span className="font-display font-bold text-lg text-emerald-950 tracking-tight">LearnTwin</span>
        </div>

        <div className="relative max-w-md">
          <div className="stagger">
            <h1 className="font-display font-bold text-[2.6rem] leading-[1.08] text-emerald-950">
              Every wrong answer<br />has a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">pattern.</span>
            </h1>
            <p className="mt-5 text-[15px] text-emerald-900/60 leading-relaxed">
              LearnTwin is your learning doctor — it reads your homework,
              finds the root cause behind each miss, and trains it away.
              Its memory spans assignments, so patterns can&apos;t hide.
            </p>
            <div className="mt-9 space-y-4">
              {features.map(f => (
                <div key={f.title} className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-soft flex items-center justify-center text-emerald-600 shrink-0">
                    <f.icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-[14px] text-emerald-950">{f.title}</div>
                    <div className="text-[13px] text-emerald-900/50 leading-snug">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="relative text-[11px] font-medium text-emerald-900/55">
          Errors are patterns. We diagnose the pattern, not the problem.
        </p>
      </div>

      {/* ---- form panel ---- */}
      <div className="flex items-center justify-center px-6 py-12 lg:w-[460px] xl:w-[500px] lg:border-l lg:border-emerald-950/[0.06] bg-white/60 lg:bg-white lg:backdrop-blur-none backdrop-blur-sm min-h-dvh lg:min-h-0">
        <div className="w-full max-w-sm rise-in">
          {/* mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-block float-soft"><Mark size={56} /></div>
            <h1 className="font-display font-bold text-xl text-emerald-950 mt-4">LearnTwin</h1>
            <p className="text-[13px] text-emerald-900/50 mt-1.5">
              Your learning doctor. It finds the <em>why</em> behind every miss.
            </p>
          </div>

          <form onSubmit={submit} className="rounded-2xl bg-white border border-emerald-950/[0.07] shadow-soft-lg p-7 space-y-4">
            <div className="hidden lg:block mb-1">
              <h2 className="font-display font-bold text-[17px] text-emerald-950">Start your Twin</h2>
              <p className="text-[12px] text-emerald-900/45 mt-0.5">Its memory stays with your account.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="username" className="text-[11px] font-bold text-emerald-900/50 uppercase tracking-wider">Your name</label>
              <input
                id="username" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-emerald-950/[0.1] bg-[#FAFAF7] focus:bg-white
                  focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/[0.12] outline-none text-sm
                  placeholder:text-emerald-900/30 transition"
                placeholder="e.g. Alex" autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[11px] font-bold text-emerald-900/50 uppercase tracking-wider">Password</label>
              <input
                id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-emerald-950/[0.1] bg-[#FAFAF7] focus:bg-white
                  focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/[0.12] outline-none text-sm
                  placeholder:text-emerald-900/30 transition"
                placeholder="4+ characters" autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 pop-in">{error}</p>
            )}

            <button
              type="submit" disabled={busy}
              className="btn-press w-full h-11 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700
                text-white font-semibold text-sm shadow-glow-emerald disabled:opacity-50
                inline-flex items-center justify-center gap-2"
            >
              {busy ? 'Setting up…' : <>Create my Twin <ArrowRight className="w-4 h-4" /></>}
            </button>

            <p className="text-[11px] text-center text-emerald-900/55 leading-relaxed">
              New here? This creates your account.<br className="sm:hidden" /> Your Twin&apos;s memory stays with it.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
