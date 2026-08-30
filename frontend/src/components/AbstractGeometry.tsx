import React from 'react'

export function EditorialHeroArt({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative w-full max-w-[440px] aspect-square flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes trace-travel {
          0% {
            stroke-dashoffset: 480;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes subtle-arc-drift {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }

        @keyframes focal-breathe {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.45;
            transform: scale(1.04);
          }
        }

        .anim-trace {
          stroke-dasharray: 32 200;
          animation: trace-travel 12s linear infinite;
        }

        .anim-arc {
          animation: subtle-arc-drift 24s ease-in-out infinite;
          transform-origin: 240px 240px;
        }

        .anim-focal {
          animation: focal-breathe 8s ease-in-out infinite;
          transform-origin: 240px 240px;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-trace,
          .anim-arc,
          .anim-focal {
            animation: none !important;
          }
        }
      `}</style>

      <svg
        viewBox="0 0 480 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-foreground overflow-visible"
      >
        <defs>
          <radialGradient id="focal-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Soft Focal Aura */}
        <circle cx="240" cy="240" r="160" fill="url(#focal-glow)" className="anim-focal" />

        {/* Precision Coordinate Marks at Quadrants */}
        <g opacity="0.2" stroke="currentColor" strokeWidth="0.8">
          <path d="M 40 40 L 40 48 M 36 44 L 44 44" />
          <path d="M 440 40 L 440 48 M 436 44 L 444 44" />
          <path d="M 40 440 L 40 448 M 36 444 L 44 444" />
          <path d="M 440 440 L 440 448 M 436 444 L 444 444" />
        </g>

        {/* Fine Architectural Grid References */}
        <g opacity="0.12" stroke="currentColor" strokeWidth="0.6">
          <line x1="240" y1="60" x2="240" y2="420" strokeDasharray="2 6" />
          <line x1="60" y1="240" x2="420" y2="240" strokeDasharray="2 6" />
          <circle cx="240" cy="240" r="180" strokeDasharray="1 5" />
          <circle cx="240" cy="240" r="110" strokeDasharray="2 4" />
          <circle cx="240" cy="240" r="40" />
        </g>

        {/* Primary Geometric Structural Curves */}
        <g className="anim-arc">
          {/* Outer sweeping arc */}
          <path
            d="M 100 240 A 140 140 0 0 1 380 240"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="1"
          />
          {/* Intersecting counter arc */}
          <path
            d="M 240 100 A 140 140 0 0 1 240 380"
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="0.8"
          />
          {/* Sharp 45-degree architectural tangential ray */}
          <line
            x1="120"
            y1="360"
            x2="360"
            y2="120"
            stroke="currentColor"
            strokeOpacity="0.16"
            strokeWidth="0.8"
          />
        </g>

        {/* The Continuous Dynamic Trajectory Trace */}
        <path
          d="M 70 320 C 120 320, 140 160, 240 160 C 340 160, 360 280, 410 280"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1.2"
          fill="none"
        />

        {/* The Luminous Travelling Micro-Signal */}
        <path
          d="M 70 320 C 120 320, 140 160, 240 160 C 340 160, 360 280, 410 280"
          stroke="hsl(var(--primary))"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          className="anim-trace"
        />

        {/* Origin and Focal Anchor Nodes */}
        <circle cx="70" cy="320" r="2.5" fill="currentColor" fillOpacity="0.4" />
        <circle cx="240" cy="160" r="3" fill="hsl(var(--primary))" fillOpacity="0.8" />
        <circle cx="410" cy="280" r="3" fill="#10b981" fillOpacity="0.8" />
        <circle cx="410" cy="280" r="7" stroke="#10b981" strokeOpacity="0.3" strokeWidth="0.8" fill="none" />
      </svg>
    </div>
  )
}

export function WorkflowTrajectoryArt({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative w-full max-w-[640px] aspect-[16/6] flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes flow-horizontal {
          0% {
            stroke-dashoffset: 400;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .anim-flow-h {
          stroke-dasharray: 20 140;
          animation: flow-horizontal 9s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-flow-h {
            animation: none !important;
          }
        }
      `}</style>
      <svg
        viewBox="0 0 600 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-foreground overflow-visible"
      >
        {/* Horizontal Guide Axes */}
        <line x1="40" y1="100" x2="560" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.8" strokeDasharray="3 6" />

        {/* Continuous S-Curve Workflow */}
        <path
          d="M 60 140 C 160 140, 180 60, 300 60 C 420 60, 440 140, 540 140"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1.2"
          fill="none"
        />

        {/* Animated Pulse */}
        <path
          d="M 60 140 C 160 140, 180 60, 300 60 C 420 60, 440 140, 540 140"
          stroke="hsl(var(--primary))"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          className="anim-flow-h"
        />

        {/* 3 Step Anchor Points: Reported -> In Progress -> Resolved */}
        {/* Step 1: Reported */}
        <g transform="translate(60, 140)">
          <circle cx="0" cy="0" r="3" fill="currentColor" fillOpacity="0.5" />
          <circle cx="0" cy="0" r="7" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.8" />
          <text x="0" y="24" fill="currentColor" fillOpacity="0.6" fontSize="9" fontFamily="monospace" textAnchor="middle">
            01:REPORTED
          </text>
        </g>

        {/* Step 2: Triaged / Progress */}
        <g transform="translate(300, 60)">
          <circle cx="0" cy="0" r="3.5" fill="hsl(var(--primary))" />
          <circle cx="0" cy="0" r="8" stroke="hsl(var(--primary))" strokeOpacity="0.3" strokeWidth="0.8" />
          <text x="0" y="-14" fill="currentColor" fillOpacity="0.9" fontSize="9" fontFamily="monospace" fontWeight="600" textAnchor="middle">
            02:WORKFLOW
          </text>
        </g>

        {/* Step 3: Resolved */}
        <g transform="translate(540, 140)">
          <circle cx="0" cy="0" r="3.5" fill="#10b981" />
          <circle cx="0" cy="0" r="8" stroke="#10b981" strokeOpacity="0.4" strokeWidth="0.8" />
          <text x="0" y="24" fill="#10b981" fontSize="9" fontFamily="monospace" fontWeight="600" textAnchor="middle">
            03:RESOLVED
          </text>
        </g>
      </svg>
    </div>
  )
}

export function SectionCrosshair({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center opacity-30 text-muted-foreground ${className}`} aria-hidden="true">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <line x1="5" y1="0" x2="5" y2="10" stroke="currentColor" strokeWidth="1" />
        <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  )
}
