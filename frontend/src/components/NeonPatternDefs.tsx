import React from 'react'

export function NeonPatternDefs({ colors = [] }: { colors?: string[] }) {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none" style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <linearGradient id="primary-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="success-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.8} />
          <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="warning-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.8} />
          <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="destructive-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
          <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="info-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--info))" stopOpacity={0.8} />
          <stop offset="100%" stopColor="hsl(var(--info))" stopOpacity={0.1} />
        </linearGradient>
      </defs>
    </svg>
  )
}
