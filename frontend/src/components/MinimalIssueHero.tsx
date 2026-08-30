import React from 'react'
import { Check } from 'lucide-react'

export function MinimalIssueHero({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative w-full max-w-[420px] aspect-[4/3] flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes pulse-travel {
          0% {
            stroke-dashoffset: 400;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes card-subtle-float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes status-beacon {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes glow-breathe {
          0%, 100% {
            opacity: 0.12;
          }
          50% {
            opacity: 0.22;
          }
        }

        .anim-line-pulse {
          stroke-dasharray: 24 160;
          animation: pulse-travel 8s linear infinite;
        }

        .anim-card-float {
          animation: card-subtle-float 8s ease-in-out infinite;
        }

        .anim-beacon {
          animation: status-beacon 3s ease-in-out infinite;
          transform-origin: center;
        }

        .anim-glow {
          animation: glow-breathe 6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-line-pulse,
          .anim-card-float,
          .anim-beacon,
          .anim-glow {
            animation: none !important;
          }
        }
      `}</style>

      {/* SVG Background Artwork: Flowing Lifecycle Path & Ambient Guides */}
      <svg
        viewBox="0 0 440 330"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full text-foreground overflow-visible"
      >
        <defs>
          {/* Subtle glow filter */}
          <filter id="subtle-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Ambient card backlight */}
          <radialGradient id="card-glow" cx="45%" cy="48%" r="45%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Backlight Behind Card */}
        <circle cx="210" cy="155" r="140" fill="url(#card-glow)" className="anim-glow" />

        {/* Minimal Precision Coordinate Crosshairs */}
        <g opacity="0.15" stroke="currentColor" strokeWidth="0.8">
          {/* Top Left */}
          <path d="M 28 32 L 28 40 M 24 36 L 32 36" />
          {/* Bottom Right */}
          <path d="M 412 284 L 412 292 M 408 288 L 416 288" />
        </g>

        {/* Base Lifecycle Track (Quiet, Elegant Hairline) */}
        <path
          d="M 36 75 C 90 75, 110 165, 180 165 C 260 165, 270 250, 360 250 L 372 250"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="1.2"
          strokeDasharray="2 3"
          fill="none"
        />

        {/* Traveling Luminous Pulse */}
        <path
          d="M 36 75 C 90 75, 110 165, 180 165 C 260 165, 270 250, 360 250 L 372 250"
          stroke="hsl(var(--primary))"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          className="anim-line-pulse"
        />

        {/* Lifecycle Start Origin Dot */}
        <circle cx="36" cy="75" r="2.5" fill="currentColor" fillOpacity="0.3" />
        <circle cx="36" cy="75" r="5" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.8" fill="none" />

        {/* Final Resolved Checkmark Node */}
        <g transform="translate(372, 250)">
          {/* Glow backdrop */}
          <circle cx="0" cy="0" r="14" fill="#10b981" fillOpacity="0.08" />
          {/* Outer Ring */}
          <circle
            cx="0"
            cy="0"
            r="11"
            fill="#080c0a"
            stroke="#10b981"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
          {/* Checkmark Icon */}
          <path
            d="M -3.5 -0.5 L -1 2 L 4 -3"
            stroke="#10b981"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Subtle Monospace Label */}
          <text
            x="18"
            y="3.5"
            fill="#10b981"
            fillOpacity="0.8"
            fontSize="8.5"
            fontFamily="monospace"
            letterSpacing="0.06em"
          >
            RESOLVED
          </text>
        </g>
      </svg>

      {/* Primary Floating Issue Card */}
      <div className="relative z-10 w-[270px] sm:w-[290px] rounded-lg border border-border/80 bg-[#0c0c11]/85 backdrop-blur-md p-4 shadow-2xl shadow-black/80 anim-card-float">
        {/* Top Meta Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-semibold text-primary/90 tracking-wide">
              BUGZ-184
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium bg-amber-500/10 text-amber-400/90 border border-amber-500/20">
            HIGH
          </span>
        </div>

        {/* Issue Title */}
        <h4 className="text-[13px] font-semibold text-foreground tracking-tight leading-snug mb-3">
          Fix authentication flow
        </h4>

        {/* Bottom Status & Trajectory Row */}
        <div className="flex items-center justify-between pt-2.5 border-t border-border/40 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="anim-beacon absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="font-mono text-[10.5px] text-muted-foreground font-medium">
              IN PROGRESS
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground/60">
            #auth-session
          </span>
        </div>
      </div>
    </div>
  )
}

export default MinimalIssueHero
