import React from 'react'
import { SeverityLevel } from '../types'
import { cn } from '@/lib/utils'

const severityConfig: Record<
  SeverityLevel,
  { label: string; className: string; bgClass: string; bars: number }
> = {
  CRITICAL: {
    label: 'Critical',
    className: 'text-red-400',
    bgClass: 'bg-red-500/10 border-red-500/20',
    bars: 3,
  },
  HIGH: {
    label: 'High',
    className: 'text-orange-400',
    bgClass: 'bg-orange-500/10 border-orange-500/20',
    bars: 3,
  },
  MEDIUM: {
    label: 'Medium',
    className: 'text-amber-400/90',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    bars: 2,
  },
  LOW: {
    label: 'Low',
    className: 'text-emerald-400/90',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    bars: 1,
  },
}

export function SeverityBadge({
  severity,
  showLabel = true,
  className,
}: {
  severity: SeverityLevel | string
  showLabel?: boolean
  className?: string
}) {
  const normSev = (severity || 'MEDIUM').toUpperCase() as SeverityLevel
  const config = severityConfig[normSev] || severityConfig.MEDIUM

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10.5px] font-mono font-medium border transition-colors',
        config.bgClass,
        config.className,
        className
      )}
    >
      <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
        <rect x="2" y="10" width="3" height="4" rx="0.5" opacity={config.bars >= 1 ? 1 : 0.3} />
        <rect x="6.5" y="7" width="3" height="7" rx="0.5" opacity={config.bars >= 2 ? 1 : 0.3} />
        <rect x="11" y="4" width="3" height="10" rx="0.5" opacity={config.bars >= 3 ? 1 : 0.3} />
      </svg>
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}

