import React from 'react'

interface StackedLogoProps {
  size?: number
  className?: string
  color?: string
}

export function StackedLogo({ size = 16, className = '', color = 'currentColor' }: StackedLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2.5" y="1.5" width="11" height="3" rx="0.5" fill={color} />
      <rect x="4.5" y="6.5" width="9" height="3" rx="0.5" fill={color} />
      <rect x="2" y="11.5" width="12" height="3" rx="0.5" fill={color} />
    </svg>
  )
}
