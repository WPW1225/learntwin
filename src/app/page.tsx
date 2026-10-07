'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Brain, LogOut, Upload as UploadIcon } from 'lucide-react'
import { api, clearToken, getToken } from '@/lib/client'
import type { AssignmentDetail, TwinOverview } from '@/lib/client'
import Auth from '@/components/lt/Auth'
import Upload from '@/components/lt/Upload'
import Confirm from '@/components/lt/Confirm'
import Processing from '@/components/lt/Processing'
import Result from '@/components/lt/Result'
import Practice from '@/components/lt/Practice'
import TwinView from '@/components/lt/TwinView'
import { Mark } from '@/components/lt/motion'

type View = 'upload' | 'processing' | 'confirm' | 'result' | 'practice' | 'twin'

export default function Home() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null)
  const [booting, setBooting] = useState(true)
  const [view, setView] = useState<View>('upload')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [detail, setDetail] = useState<AssignmentDetail | null>(null)
  const [twin, setTwin] = useState<TwinOverview | null>(null)
  const [practiceMid, setPracticeMid] = useState<string | null>(null)
  const [recents, setRecents] = useState<any[]>([])
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const t = getToken()
    if (!t) { setBooting(false); return }
    api('/api/me').then(r => setUser(r.user)).catch(() => {}).finally(() => setBooting(false))
  }, [])

  const refreshRecents = useCallback(async () => {
    try {
      const r = await api('/api/assignments')
      setRecents(r.assignments || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { if (user) void refreshRecents() }, [user, refreshRecents])

  // poll the active assignment while it's processing
  useEffect(() => {
    if (!activeId || (view !== 'processing')) return
    let alive = true
    const tick = async () => {
      try {
        const d: AssignmentDetail = await api(`/api/assignments/${activeId}`)
        if (!alive) return
        setDetail(d)
        if (d.status === 'confirm') { setView('confirm'); stopPoll() }
        else if (d.status === 'done') { setView('result'); void refreshRecents(); stopPoll() }
        else if (d.status === 'error') { setView('upload'); stopPoll(); alert(`Pipeline error: ${d.stage}`) }
      } catch { /* transient */ }
    }
    tick()
    const iv = setInterval(tick, 2500)
    pollRef.current = iv
    return () => { alive = false; stopPoll() }
    function stopPoll() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  }, [activeId, view, refreshRecents])

  async function openAssignment(id: string) {
    setActiveId(id)
    const d: AssignmentDetail = await api(`/api/assignments/${id}`)
    setDetail(d)
    if (d.status === 'confirm') setView('confirm')
    else if (d.status === 'done') setView('result')
    else if (d.status === 'error') { alert(`Pipeline error: ${d.stage}`); setView('upload') }
    else setView('processing')
  }

  async function openTwin() {
    const t = await api('/api/twin')
    setTwin(t)
    setView('twin')
  }

  function logout() {
    clearToken(); setUser(null); setView('upload'); setDetail(null); setActiveId(null)
  }

  if (booting) {
    return (
      <main className="canvas-paper min-h-screen flex items-center justify-center">
        <div className="breathe"><Mark size={44} /></div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-dvh">
        <Auth onDone={u => { setUser(u); void refreshRecents() }} />
      </main>
    )
  }

  const activeMisc = detail?.misconceptions?.find(m => m.id === practiceMid) || null
  const viewKey = `${view}-${activeId ?? ''}`

  return (
    <main className="canvas-paper min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-[#FAFAF7]/85 backdrop-blur-md border-b border-emerald-950/[0.06]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2.5">
          <Mark size={28} />
          <span className="font-display font-bold text-emerald-950 tracking-tight">LearnTwin</span>
          <span className="text-[9px] font-bold bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 hidden sm:inline tracking-widest uppercase">AI</span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={openTwin}
              className="h-9 px-3 rounded-xl hover:bg-emerald-950/[0.05] text-emerald-950/80 hover:text-emerald-950 text-sm font-semibold transition btn-press inline-flex items-center gap-1.5"
            >
              <Brain className="w-4 h-4" /> Twin
            </button>
            <button
              onClick={() => { setView('upload') }}
              className="h-9 px-3 rounded-xl hover:bg-emerald-950/[0.05] text-emerald-950/80 hover:text-emerald-950 text-sm font-semibold transition btn-press hidden sm:inline-flex items-center gap-1.5"
            >
              <UploadIcon className="w-4 h-4" /> Upload
            </button>
            <div className="w-px h-5 bg-emerald-950/[0.08] mx-1 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 pl-1" title={user.username}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
            </div>
            <button
              onClick={logout}
              className="h-9 w-9 rounded-xl hover:bg-emerald-950/[0.05] text-emerald-950/40 hover:text-emerald-950/70 transition btn-press inline-flex items-center justify-center"
              aria-label="log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div key={viewKey} className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 rise-in">
        {view === 'upload' && (
          <Upload
            onUploaded={id => { setActiveId(id); setView('processing') }}
            recents={recents}
            onOpenRecent={openAssignment}
          />
        )}
        {view === 'processing' && detail && (
          <Processing stage={detail.stage} phase={detail.status === 'extracting' ? 'read' : 'diagnose'} />
        )}
        {view === 'confirm' && detail?.problems && (
          <Confirm
            assignmentId={activeId!}
            problems={detail.problems}
            legibilityNotes={detail.legibilityNotes}
            onConfirmed={() => setView('processing')}
          />
        )}
        {view === 'result' && detail && (
          <Result
            detail={detail}
            onPractice={mid => { setPracticeMid(mid); setView('practice') }}
            onTwin={openTwin}
            onNew={() => { setActiveId(null); setDetail(null); setView('upload') }}
          />
        )}
        {view === 'practice' && activeMisc && (
          <Practice
            misc={activeMisc}
            onDone={async () => {
              const d = await api(`/api/assignments/${activeId}`)
              setDetail(d)
              setView('result')
            }}
          />
        )}
        {view === 'twin' && twin && <TwinView data={twin} onNew={() => { setActiveId(null); setDetail(null); setView('upload') }} />}
      </div>

      <footer className="pb-6 pt-2 text-center text-[11px] text-emerald-950/60">
        LearnTwin AI — errors are patterns.
      </footer>
    </main>
  )
}
