import React from 'react'
import { IssueStatus } from '../types'
import { cn } from '@/lib/utils'

const statusConfig: Record<
  IssueStatus,
  { label: string; dotClass: string; textClass: string; bgClass: string }
> = {
  OPEN: {
    label: 'Open',
    dotClass: 'bg-info shadow-[0_0_8px_rgba(56,189,248,0.6)]',
    textClass: 'text-info',
    bgClass: 'bg-info/10 border-info/20',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dotClass: 'bg-warning shadow-[0_0_8px_rgba(251,191,36,0.6)]',
    textClass: 'text-warning',
    bgClass: 'bg-warning/10 border-warning/20',
  },
  IN_REVIEW: {
    label: 'In Review',
    dotClass: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10 border-purple-500/20',
  },
  RESOLVED: {
    label: 'Resolved',
    dotClass: 'bg-success shadow-[0_0_8px_rgba(74,222,128,0.6)]',
    textClass: 'text-success',
    bgClass: 'bg-success/10 border-success/20',
  },
  CLOSED: {
    label: 'Closed',
    dotClass: 'bg-zinc-500',
    textClass: 'text-muted-foreground',
    bgClass: 'bg-muted/40 border-border/40',
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
      <span className={cn('inline-flex items-center gap-1.5 text-[12px] text-muted-foreground', className)}>
        <span className={cn('h-2 w-2 rounded-full shrink-0', config.dotClass)} />
        <span>{config.label}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors',
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
