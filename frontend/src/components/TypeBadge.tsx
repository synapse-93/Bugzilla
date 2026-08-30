import React from 'react'
import { IssueType } from '../types'
import { Bug, Sparkles, CheckSquare, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const typeConfig: Record<
  IssueType,
  { label: string; icon: React.ComponentType<{ className?: string }>; textClass: string; bgClass: string }
> = {
  BUG: {
    label: 'Bug',
    icon: Bug,
    textClass: 'text-red-400',
    bgClass: 'bg-red-500/10 border-red-500/20',
  },
  FEATURE: {
    label: 'Feature',
    icon: Sparkles,
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
  },
  TASK: {
    label: 'Task',
    icon: CheckSquare,
    textClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10 border-blue-500/20',
  },
  IMPROVEMENT: {
    label: 'Improvement',
    icon: Zap,
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10 border-purple-500/20',
  },
}

export function TypeBadge({
  type,
  showLabel = true,
  className,
}: {
  type: IssueType | string
  showLabel?: boolean
  className?: string
}) {
  const normType = (type || 'BUG').toUpperCase() as IssueType
  const config = typeConfig[normType] || typeConfig.BUG
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border',
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}
