import React from 'react'

interface EditorialHeroArtProps {
  className?: string
  scrollProgress?: number
}

export function EditorialHeroArt({ className = '', scrollProgress = 0 }: EditorialHeroArtProps) {
  // Clamp progress between 0 and 1
  const p = Math.max(0, Math.min(1, scrollProgress))
  const scale = 1 - p * 0.08
  const translateY = p * 24
  const arcRotate = p * 15

  return (
    <div
      className={`relative w-full max-w-[440px] aspect-square flex items-center justify-center select-none pointer-events-none transition-transform duration-300 ease-out ${className}`}
      style={{
        transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes trace-travel {
          0% { stroke-dashoffset: 480; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes subtle-arc-drift {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes focal-breathe {
          0%, 100% { opacity: 0.15; transform: scale(0.96); }
          50% { opacity: 0.35; transform: scale(1.04); }
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
          .anim-trace, .anim-arc, .anim-focal {
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
          <radialGradient id="hero-focal-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Soft Focal Aura */}
        <circle cx="240" cy="240" r="160" fill="url(#hero-focal-glow)" className="anim-focal" />

        {/* Precision Coordinate Marks at Quadrants */}
        <g opacity="0.25" stroke="currentColor" strokeWidth="0.8">
          <path d="M 40 40 L 40 48 M 36 44 L 44 44" />
          <path d="M 440 40 L 440 48 M 436 44 L 444 44" />
          <path d="M 40 440 L 40 448 M 36 444 L 44 444" />
          <path d="M 440 440 L 440 448 M 436 444 L 444 444" />
          <text x="50" y="46" fill="currentColor" fontSize="8" fontFamily="monospace" fillOpacity="0.5">COORD:00.1</text>
          <text x="390" y="46" fill="currentColor" fontSize="8" fontFamily="monospace" fillOpacity="0.5">SYS:RUN</text>
        </g>

        {/* Fine Architectural Grid References */}
        <g opacity="0.12" stroke="currentColor" strokeWidth="0.6">
          <line x1="240" y1="60" x2="240" y2="420" strokeDasharray="2 6" />
          <line x1="60" y1="240" x2="420" y2="240" strokeDasharray="2 6" />
          <circle cx="240" cy="240" r="180" strokeDasharray="1 5" />
          <circle cx="240" cy="240" r="110" strokeDasharray="2 4" />
          <circle cx="240" cy="240" r="40" />
        </g>

        {/* Primary Geometric Structural Curves (Scroll-responsive angle) */}
        <g
          className="anim-arc"
          style={{
            transform: `rotate(${arcRotate}deg)`,
            transformOrigin: '240px 240px',
            transition: 'transform 0.4s ease-out',
          }}
        >
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

interface DynamicCapabilityArtProps {
  activeStage: number // 0: ISSUES, 1: WORKFLOW, 2: COLLABORATION, 3: INSIGHT
  className?: string
}

export function DynamicCapabilityArt({ activeStage, className = '' }: DynamicCapabilityArtProps) {
  return (
    <div
      className={`relative w-full max-w-[420px] aspect-square flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-foreground overflow-visible"
      >
        {/* Background Coordinate Bounding Box */}
        <rect
          x="30"
          y="30"
          width="340"
          height="340"
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeWidth="0.8"
        />
        <line x1="200" y1="30" x2="200" y2="370" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="3 6" />
        <line x1="30" y1="200" x2="370" y2="200" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="3 6" />

        {/* Precision Crosshairs in Corners */}
        <g opacity="0.25" stroke="currentColor" strokeWidth="0.8">
          <path d="M 26 30 L 34 30 M 30 26 L 30 34" />
          <path d="M 366 30 L 374 30 M 370 26 L 370 34" />
          <path d="M 26 370 L 34 370 M 30 366 L 30 374" />
          <path d="M 366 370 L 374 370 M 370 366 L 370 374" />
        </g>

        {/* STAGE 0: ISSUES (Structured Nodes & Triage Grid) */}
        <g
          className="transition-all duration-700 ease-out"
          style={{
            opacity: activeStage === 0 ? 1 : 0,
            transform: activeStage === 0 ? 'scale(1) translate3d(0, 0, 0)' : 'scale(0.92) translate3d(-10px, 0, 0)',
            transformOrigin: '200px 200px',
          }}
        >
          {/* Card 1 */}
          <rect x="70" y="80" width="260" height="60" rx="3" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" fill="hsl(var(--card))" fillOpacity="0.4" />
          <rect x="85" y="96" width="44" height="14" rx="2" fill="hsl(var(--primary))" fillOpacity="0.18" />
          <text x="92" y="106" fill="hsl(var(--primary))" fontSize="9" fontFamily="monospace" fontWeight="600">KZ-101</text>
          <text x="140" y="106" fill="currentColor" fontSize="10.5" fontWeight="500" fillOpacity="0.85">Authentication token expiry</text>
          <circle cx="310" cy="110" r="3" fill="#ef4444" fillOpacity="0.8" />

          {/* Card 2 */}
          <rect x="70" y="160" width="260" height="60" rx="3" stroke="hsl(var(--primary))" strokeOpacity="0.4" strokeWidth="1" fill="hsl(var(--card))" fillOpacity="0.7" />
          <rect x="85" y="176" width="44" height="14" rx="2" fill="hsl(var(--primary))" fillOpacity="0.25" />
          <text x="92" y="186" fill="hsl(var(--primary))" fontSize="9" fontFamily="monospace" fontWeight="600">KZ-102</text>
          <text x="140" y="186" fill="currentColor" fontSize="10.5" fontWeight="500" fillOpacity="0.95">Kanban drag trajectory sync</text>
          <circle cx="310" cy="190" r="3" fill="#f59e0b" fillOpacity="0.8" />

          {/* Card 3 */}
          <rect x="70" y="240" width="260" height="60" rx="3" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" fill="hsl(var(--card))" fillOpacity="0.3" />
          <rect x="85" y="256" width="44" height="14" rx="2" fill="hsl(var(--primary))" fillOpacity="0.15" />
          <text x="92" y="266" fill="hsl(var(--primary))" fontSize="9" fontFamily="monospace" fontWeight="600">KZ-103</text>
          <text x="140" y="266" fill="currentColor" fontSize="10.5" fontWeight="500" fillOpacity="0.7">Milestone sprint telemetry</text>
          <circle cx="310" cy="270" r="3" fill="#10b981" fillOpacity="0.8" />

          <text x="200" y="335" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="monospace" textAnchor="middle">
            STATUS: 3 TRIAGED • KEY: KZ
          </text>
        </g>

        {/* STAGE 1: WORKFLOW (Interactive Column Pipeline & Trajectory) */}
        <g
          className="transition-all duration-700 ease-out"
          style={{
            opacity: activeStage === 1 ? 1 : 0,
            transform: activeStage === 1 ? 'scale(1) translate3d(0, 0, 0)' : 'scale(0.92) translate3d(0, 10px, 0)',
            transformOrigin: '200px 200px',
          }}
        >
          {/* Column Guide Lines */}
          <rect x="60" y="70" width="75" height="240" rx="2" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.8" fill="none" strokeDasharray="3 4" />
          <rect x="162" y="70" width="75" height="240" rx="2" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.8" fill="none" strokeDasharray="3 4" />
          <rect x="265" y="70" width="75" height="240" rx="2" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.8" fill="none" strokeDasharray="3 4" />

          <text x="97" y="90" fill="currentColor" fillOpacity="0.4" fontSize="8.5" fontFamily="monospace" textAnchor="middle">01:OPEN</text>
          <text x="199" y="90" fill="hsl(var(--primary))" fillOpacity="0.9" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="600">02:ACTIVE</text>
          <text x="302" y="90" fill="#10b981" fillOpacity="0.9" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="600">03:DONE</text>

          {/* S-Curve Motion Trajectory Arc */}
          <path
            d="M 97 190 C 140 190, 150 140, 200 140 C 250 140, 260 210, 302 210"
            stroke="hsl(var(--primary))"
            strokeOpacity="0.6"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            fill="none"
          />

          {/* Active moving card token */}
          <rect x="168" y="115" width="64" height="46" rx="2" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="1" />
          <text x="200" y="134" fill="hsl(var(--primary))" fontSize="8.5" fontFamily="monospace" fontWeight="600" textAnchor="middle">KZ-102</text>
          <text x="200" y="148" fill="currentColor" fontSize="7.5" fillOpacity="0.6" textAnchor="middle">IN REVIEW</text>

          {/* Destination check node */}
          <circle cx="302" cy="210" r="4" fill="#10b981" />
          <circle cx="302" cy="210" r="8" stroke="#10b981" strokeOpacity="0.4" strokeWidth="0.8" />

          <text x="200" y="335" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="monospace" textAnchor="middle">
            FLOW: PIPELINE TRANSITION VALIDATED
          </text>
        </g>

        {/* STAGE 2: COLLABORATION (Synchronous Team Node Constellation) */}
        <g
          className="transition-all duration-700 ease-out"
          style={{
            opacity: activeStage === 2 ? 1 : 0,
            transform: activeStage === 2 ? 'scale(1) translate3d(0, 0, 0)' : 'scale(0.92) translate3d(10px, 0, 0)',
            transformOrigin: '200px 200px',
          }}
        >
          {/* Constellation Tangents */}
          <line x1="120" y1="130" x2="200" y2="200" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.8" />
          <line x1="280" y1="130" x2="200" y2="200" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.8" />
          <line x1="150" y1="280" x2="200" y2="200" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.8" />
          <line x1="250" y1="280" x2="200" y2="200" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.8" />
          <circle cx="200" cy="200" r="80" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 5" />

          {/* Central Threaded Issue Hub */}
          <circle cx="200" cy="200" r="28" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="1" />
          <text x="200" y="198" fill="hsl(var(--primary))" fontSize="8.5" fontFamily="monospace" fontWeight="600" textAnchor="middle">THREAD</text>
          <text x="200" y="210" fill="currentColor" fontSize="7.5" fillOpacity="0.6" textAnchor="middle">4 REPLIES</text>

          {/* Collaborator Node 1 */}
          <circle cx="120" cy="130" r="16" fill="hsl(var(--card))" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.8" />
          <text x="120" y="133" fill="currentColor" fontSize="8" fontFamily="monospace" textAnchor="middle">@dev1</text>

          {/* Collaborator Node 2 */}
          <circle cx="280" cy="130" r="16" fill="hsl(var(--card))" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.8" />
          <text x="280" y="133" fill="currentColor" fontSize="8" fontFamily="monospace" textAnchor="middle">@lead</text>

          {/* Collaborator Node 3 */}
          <circle cx="150" cy="280" r="16" fill="hsl(var(--card))" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.8" />
          <text x="150" y="283" fill="currentColor" fontSize="8" fontFamily="monospace" textAnchor="middle">@qa</text>

          {/* Collaborator Node 4 */}
          <circle cx="250" cy="280" r="16" fill="hsl(var(--card))" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.8" />
          <text x="250" y="283" fill="currentColor" fontSize="8" fontFamily="monospace" textAnchor="middle">@peer</text>

          <text x="200" y="335" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="monospace" textAnchor="middle">
            ACCESS: ROLE-BASED PERMISSIONS
          </text>
        </g>

        {/* STAGE 3: INSIGHT (Velocity Telemetry & Milestone Vectors) */}
        <g
          className="transition-all duration-700 ease-out"
          style={{
            opacity: activeStage === 3 ? 1 : 0,
            transform: activeStage === 3 ? 'scale(1) translate3d(0, 0, 0)' : 'scale(0.92) translate3d(0, -10px, 0)',
            transformOrigin: '200px 200px',
          }}
        >
          {/* Radial Telemetry Arcs */}
          <circle cx="200" cy="180" r="90" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
          <path
            d="M 110 180 A 90 90 0 1 1 290 180"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="240 300"
          />
          <circle cx="200" cy="180" r="65" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.8" strokeDasharray="3 5" />
          <path
            d="M 135 180 A 65 65 0 1 1 265 180"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="160 220"
          />

          {/* Metric Center */}
          <text x="200" y="174" fill="currentColor" fontSize="24" fontWeight="700" textAnchor="middle">94%</text>
          <text x="200" y="194" fill="currentColor" fillOpacity="0.5" fontSize="8.5" fontFamily="monospace" textAnchor="middle">SPRINT VELOCITY</text>

          {/* Target Indicators */}
          <g transform="translate(100, 270)">
            <text x="0" y="0" fill="#10b981" fontSize="11" fontWeight="600">● 42</text>
            <text x="0" y="14" fill="currentColor" fillOpacity="0.5" fontSize="8" fontFamily="monospace">RESOLVED</text>
          </g>
          <g transform="translate(200, 270)">
            <text x="0" y="0" fill="hsl(var(--primary))" fontSize="11" fontWeight="600">● 03</text>
            <text x="0" y="14" fill="currentColor" fillOpacity="0.5" fontSize="8" fontFamily="monospace">IN REVIEW</text>
          </g>
          <g transform="translate(300, 270)">
            <text x="0" y="0" fill="#f59e0b" fontSize="11" fontWeight="600">● 02</text>
            <text x="0" y="14" fill="currentColor" fillOpacity="0.5" fontSize="8" fontFamily="monospace">OPEN</text>
          </g>

          <text x="200" y="335" fill="currentColor" fillOpacity="0.4" fontSize="9" fontFamily="monospace" textAnchor="middle">
            AUDIT: LIVE ACTIVITY STREAM
          </text>
        </g>
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
          0% { stroke-dashoffset: 400; }
          100% { stroke-dashoffset: 0; }
        }
        .anim-flow-h {
          stroke-dasharray: 20 140;
          animation: flow-horizontal 9s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-flow-h { animation: none !important; }
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

export function FinalResolutionArt({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative w-full max-w-[280px] aspect-square flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-foreground overflow-visible"
      >
        {/* Converging Rays */}
        <line x1="20" y1="120" x2="90" y2="120" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.8" />
        <line x1="220" y1="120" x2="150" y2="120" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.8" />
        <line x1="120" y1="20" x2="120" y2="90" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.8" />
        <line x1="120" y1="220" x2="120" y2="150" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.8" />

        {/* Concentric Precision Rings */}
        <circle cx="120" cy="120" r="80" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.8" strokeDasharray="3 5" />
        <circle cx="120" cy="120" r="50" stroke="hsl(var(--primary))" strokeOpacity="0.25" strokeWidth="1" />
        <circle cx="120" cy="120" r="28" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.8" />

        {/* Central Core Nodes */}
        <circle cx="120" cy="120" r="3" fill="hsl(var(--primary))" />
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
