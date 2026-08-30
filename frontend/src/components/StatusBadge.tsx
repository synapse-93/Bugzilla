import React from 'react'
import { IssueStatus } from '../types'
import { cn } from '@/lib/utils'

const statusConfig: Record<
  IssueStatus,
  { label: string; dotClass: string; textClass: string; bgClass: string }
> = {
  OPEN: {
    label: 'Open',
    dotClass: 'bg-sky-400',
    textClass: 'text-sky-400',
    bgClass: 'bg-sky-500/10 border-sky-500/20',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
  },
  IN_REVIEW: {
    label: 'In Review',
    dotClass: 'bg-purple-400',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10 border-purple-500/20',
  },
  RESOLVED: {
    label: 'Resolved',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
  },
  CLOSED: {
    label: 'Closed',
    dotClass: 'bg-muted-foreground/60',
    textClass: 'text-muted-foreground',
    bgClass: 'bg-muted/30 border-border/40',
  },
}

export function StatusBadge({
  status,
  variant = 'pill',
  className,
}: {
  status: IssueStatus | string
  variant?: 'pill' | 'dot'
  className?: string
}) {
  const normStatus = (status || 'OPEN').toUpperCase() as IssueStatus
  const config = statusConfig[normStatus] || statusConfig.OPEN

  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground font-mono', className)}>
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dotClass)} />
        <span>{config.label}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-mono font-medium border transition-colors',
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dotClass)} />
      {config.label}
    </span>
  )
}

