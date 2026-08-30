import React from 'react'
import { PriorityLevel } from '../types'
import { AlertCircle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const priorityConfig: Record<
  PriorityLevel,
  { label: string; icon: React.ComponentType<{ className?: string }>; textClass: string; bgClass: string }
> = {
  URGENT: {
    label: 'Urgent',
    icon: AlertCircle,
    textClass: 'text-red-400',
    bgClass: 'bg-red-500/10 border-red-500/20',
  },
  HIGH: {
    label: 'High',
    icon: ArrowUp,
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10 border-orange-500/20',
  },
  MEDIUM: {
    label: 'Medium',
    icon: ArrowRight,
    textClass: 'text-amber-400/90',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
  },
  LOW: {
    label: 'Low',
    icon: ArrowDown,
    textClass: 'text-emerald-400/90',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
  },
}

export function PriorityBadge({
  priority,
  showLabel = true,
  className,
}: {
  priority: PriorityLevel | string
  showLabel?: boolean
  className?: string
}) {
  const normPri = (priority || 'MEDIUM').toUpperCase() as PriorityLevel
  const config = priorityConfig[normPri] || priorityConfig.MEDIUM
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-mono font-medium border transition-colors',
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

