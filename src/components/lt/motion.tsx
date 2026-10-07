'use client'

import { useEffect, useRef, useState } from 'react'

/* Count from 0 (or `from`) to `target` with an ease-out curve. */
export function useCountUp(target: number, duration = 900, from = 0) {
  const [val, setVal] = useState(from)
  const raf = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)

  useEffect(() => {
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(from + (target - from) * eased))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration, from])

  return val
}

/* Animated SVG progress ring with count-up center label. */
export function Ring({
  value, total, size = 132, stroke = 10, label, sublabel, tone = 'emerald',
}: {
  value: number
  total: number
  size?: number
  stroke?: number
  label?: React.ReactNode
  sublabel?: string
  tone?: 'emerald' | 'amber' | 'rose'
}) {
  const pct = total > 0 ? value / total : 0
  const shown = useCountUp(Math.round(pct * 100))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const grad =
    tone === 'emerald' ? ['#34d399', '#059669'] :
    tone === 'amber' ? ['#fbbf24', '#d97706'] :
    ['#fb7185', '#e11d48']

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ring-${tone}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad[0]} />
            <stop offset="100%" stopColor={grad[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#ring-${tone})`}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-white leading-none" style={{ fontSize: size * 0.24 }}>
          {label ?? `${shown}%`}
        </span>
        {sublabel && <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70 mt-1">{sublabel}</span>}
      </div>
    </div>
  )
}

/* The LearnTwin lambda mark. glow = luminous variant for dark surfaces. */
export function Mark({ size = 36, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl font-display font-bold text-white shrink-0
        bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600
        ${glow ? 'shadow-glow-emerald' : 'shadow-soft'}`}
      style={{ width: size, height: size, fontSize: size * 0.52 }}
    >
      <span className="relative z-10" style={{ transform: 'translateY(-2%)' }}>λ</span>
      <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/25 to-transparent h-1/2" />
    </div>
  )
}
