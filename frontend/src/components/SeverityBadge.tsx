import React from 'react'
import { SeverityLevel } from '../types'
import { cn } from '@/lib/utils'

const severityConfig: Record<
  SeverityLevel,
  { label: string; className: string; bgClass: string; bars: number }
> = {
  CRITICAL: {
    label: 'Critical',
    className: 'text-severity-critical',
    bgClass: 'bg-destructive/10 border-destructive/20',
    bars: 3,
  },
  HIGH: {
    label: 'High',
    className: 'text-severity-high',
    bgClass: 'bg-orange-500/10 border-orange-500/20',
    bars: 3,
  },
  MEDIUM: {
    label: 'Medium',
    className: 'text-severity-medium',
    bgClass: 'bg-yellow-500/10 border-yellow-500/20',
    bars: 2,
  },
  LOW: {
    label: 'Low',
    className: 'text-severity-low',
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
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border',
        config.bgClass,
        config.className,
        className
      )}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
        <rect x="2" y="10" width="3" height="4" rx="0.5" opacity={config.bars >= 1 ? 1 : 0.3} />
        <rect x="6.5" y="7" width="3" height="7" rx="0.5" opacity={config.bars >= 2 ? 1 : 0.3} />
        <rect x="11" y="4" width="3" height="10" rx="0.5" opacity={config.bars >= 3 ? 1 : 0.3} />
      </svg>
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}
