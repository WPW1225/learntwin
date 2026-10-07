'use client'

import { BookOpen, Stethoscope, Dumbbell } from 'lucide-react'
import { Mark } from './motion'

// Processing: staged progress while the pipeline runs (extract / diagnose+practice).
export default function Processing({ stage, phase }: { stage: string; phase: 'read' | 'diagnose' }) {
  const steps = phase === 'read'
    ? [
      { icon: BookOpen, label: 'Reading your homework' },
      { icon: Stethoscope, label: 'Checking my own math' },
      { icon: Dumbbell, label: 'Preparing your confirmation' },
    ]
    : [
      { icon: Stethoscope, label: 'Diagnosing root causes' },
      { icon: Dumbbell, label: 'Designing your practice' },
      { icon: BookOpen, label: 'Updating your Twin' },
    ]

  return (
    <div className="py-14 text-center rise-in">
      {/* orbital mark */}
      <div className="relative inline-flex items-center justify-center mb-9">
        <span className="absolute w-full h-full rounded-full border border-emerald-200/70 animate-ping" style={{ animationDuration: '2.4s' }} />
        {/* orbit rings */}
        <span className="absolute rounded-full border border-dashed border-emerald-200" style={{ width: 108, height: 108 }} />
        <span className="absolute rounded-full border border-dashed border-violet-200" style={{ width: 136, height: 136 }} />
        {/* orbiting particles */}
        <span className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-emerald-400"
          style={{ animation: 'orbit 3.2s linear infinite', ['--orbit-r' as any]: '54px' }} />
        <span className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-violet-400"
          style={{ animation: 'orbit 4.6s linear infinite reverse', ['--orbit-r' as any]: '68px' }} />
        <div className="breathe"><Mark size={56} glow /></div>
      </div>

      <h2 className="font-display font-bold text-xl text-emerald-950">
        {stage || 'Working…'}
      </h2>
      <div className="mx-auto mt-2 h-0.5 w-24 rounded-full shimmer bg-gradient-to-r from-emerald-400 to-violet-400" />

      <div className="mt-9 space-y-2.5 max-w-xs mx-auto text-left stagger">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl bg-white border border-emerald-950/[0.06] shadow-soft px-4 py-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/70">
              <s.icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-emerald-950/70">{s.label}</span>
            <span className="ml-auto flex gap-1">
              <i className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <i className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <i className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        ))}
      </div>

      <p className="mt-10 text-xs text-emerald-900/55">
        This usually takes 1–3 minutes. Feel free to leave this page open.
      </p>
    </div>
  )
}
