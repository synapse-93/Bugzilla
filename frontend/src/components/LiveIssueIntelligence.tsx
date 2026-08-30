import React, { useState, useEffect } from 'react'

export function LiveIssueIntelligence({ className = '' }: { className?: string }) {
  // Active issue lifecycle stage simulation: 0: REPORTED, 1: TRIAGED, 2: ASSIGNED, 3: RESOLVED
  const [activeStage, setActiveStage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % 4)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const stages = [
    { label: 'REPORTED', color: '#38bdf8', dot: 'bg-sky-400' },
    { label: 'TRIAGED', color: '#fbbf24', dot: 'bg-amber-400' },
    { label: 'ASSIGNED', color: '#818cf8', dot: 'bg-indigo-400' },
    { label: 'RESOLVED', color: '#4ade80', dot: 'bg-emerald-400' },
  ]

  return (
    <div
      className={`relative w-full max-w-[440px] lg:max-w-[480px] flex flex-col items-center justify-center select-none ${className}`}
      aria-label="Live Issue Intelligence Stream"
    >
      <style>{`
        @keyframes radar-ping-1 {
          0% {
            r: 28;
            opacity: 0.6;
          }
          100% {
            r: 72;
            opacity: 0;
          }
        }

        @keyframes radar-ping-2 {
          0% {
            r: 28;
            opacity: 0.4;
          }
          100% {
            r: 96;
            opacity: 0;
          }
        }

        @keyframes pulse-travel-1 {
          0% {
            stroke-dashoffset: 80;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes pulse-travel-2 {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 80;
          }
        }

        @keyframes core-breathe {
          0%, 100% {
            opacity: 0.85;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes node-drift-a {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-3px) translateX(1.5px);
          }
        }

        @keyframes node-drift-b {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(2.5px) translateX(-2px);
          }
        }

        @keyframes node-drift-c {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-2px) translateX(-1.5px);
          }
        }

        .anim-radar-1 {
          animation: radar-ping-1 4.5s cubic-bezier(0.2, 0.6, 0.4, 1) infinite;
        }

        .anim-radar-2 {
          animation: radar-ping-2 4.5s cubic-bezier(0.2, 0.6, 0.4, 1) 2.25s infinite;
        }

        .anim-flow-in {
          stroke-dasharray: 4 10;
          animation: pulse-travel-1 9s linear infinite;
        }

        .anim-flow-out {
          stroke-dasharray: 4 10;
          animation: pulse-travel-2 9s linear infinite;
        }

        .anim-core {
          animation: core-breathe 4s ease-in-out infinite;
        }

        .anim-drift-1 {
          animation: node-drift-a 18s ease-in-out infinite;
        }

        .anim-drift-2 {
          animation: node-drift-b 22s ease-in-out infinite;
        }

        .anim-drift-3 {
          animation: node-drift-c 26s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-radar-1,
          .anim-radar-2,
          .anim-flow-in,
          .anim-flow-out,
          .anim-core,
          .anim-drift-1,
          .anim-drift-2,
          .anim-drift-3 {
            animation: none !important;
          }
        }
      `}</style>

      {/* Observability Top Telemetry Strip */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-t-md border border-border/80 bg-card/60 font-mono text-[10px] text-muted-foreground backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-foreground font-semibold tracking-wider">LIVE TELEMETRY</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-muted-foreground/80">STREAM: ACTIVE</span>
          <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 text-[9.5px]">
            LAT: 0.8ms
          </span>
        </div>
      </div>

      {/* Main SVG Visualization Canvas */}
      <div className="relative w-full aspect-square border-x border-border/80 bg-[#07070a] overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 480 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-foreground"
        >
          <defs>
            {/* Fine coordinate grid pattern */}
            <pattern id="live-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.04" />
              <circle cx="0" cy="0" r="0.5" fill="currentColor" fillOpacity="0.08" />
            </pattern>

            {/* Micro diagonal line hatch for cards */}
            <pattern id="card-hatch" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.06" />
            </pattern>

            {/* Edge fade mask */}
            <radialGradient id="live-vignette" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <mask id="live-mask">
              <rect width="480" height="480" fill="url(#live-vignette)" />
            </mask>
          </defs>

          <g mask="url(#live-mask)">
            {/* Ambient Background Grid */}
            <rect width="480" height="480" fill="url(#live-grid)" />

            {/* Subtle Crosshairs and Coordinate Marks */}
            <g opacity="0.3">
              <line x1="240" y1="20" x2="240" y2="460" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 6" strokeOpacity="0.4" />
              <line x1="20" y1="240" x2="460" y2="240" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 6" strokeOpacity="0.4" />
              <text x="28" y="32" fill="currentColor" fontSize="6.5" fontFamily="monospace" letterSpacing="0.05em">00:INGEST</text>
              <text x="400" y="32" fill="currentColor" fontSize="6.5" fontFamily="monospace" letterSpacing="0.05em">MESH:0x9B</text>
              <text x="28" y="460" fill="currentColor" fontSize="6.5" fontFamily="monospace" letterSpacing="0.05em">TOPOLOGY</text>
              <text x="396" y="460" fill="currentColor" fontSize="6.5" fontFamily="monospace" letterSpacing="0.05em">STATE:SYNC</text>
            </g>

            {/* Radar Pulse Rings from Issue Core */}
            <circle cx="240" cy="240" r="28" stroke="hsl(var(--primary))" strokeWidth="0.8" fill="none" className="anim-radar-1" />
            <circle cx="240" cy="240" r="28" stroke="#38bdf8" strokeWidth="0.6" fill="none" className="anim-radar-2" />

            {/* Static Telemetry Base Connecting Paths (Orthogonal 90° Routing) */}
            <g opacity="0.25" stroke="currentColor" strokeWidth="0.8" fill="none">
              {/* Path 1: BUGZ-184 -> Core */}
              <path d="M 125 110 L 175 110 L 175 220 L 180 220" />
              {/* Path 2: BUGZ-207 -> Core */}
              <path d="M 300 100 L 265 100 L 265 195 L 260 195" />
              {/* Path 3: BUGZ-241 -> Core */}
              <path d="M 145 235 L 180 235" />
              {/* Path 4: BUGZ-318 -> Core */}
              <path d="M 315 240 L 300 240" />
              {/* Path 5: BUGZ-402 -> Core */}
              <path d="M 135 365 L 195 365 L 195 265 L 205 265" />
              {/* Path 6: BUGZ-489 -> Core */}
              <path d="M 300 370 L 265 370 L 265 265 L 260 265" />
            </g>

            {/* Animated Data Pulses Traveling Inbound & Outbound */}
            <g opacity="0.75">
              {/* Inbound Pulses (Detected/Triaged -> Core) */}
              <path d="M 125 110 L 175 110 L 175 220 L 180 220" stroke="#38bdf8" strokeWidth="1" fill="none" className="anim-flow-in" />
              <path d="M 145 235 L 180 235" stroke="#fbbf24" strokeWidth="1" fill="none" className="anim-flow-in" />
              <path d="M 135 365 L 195 365 L 195 265 L 205 265" stroke="#818cf8" strokeWidth="1" fill="none" className="anim-flow-in" />

              {/* Outbound Pulses (Core -> Resolved/Dispatched) */}
              <path d="M 300 100 L 265 100 L 265 195 L 260 195" stroke="#ef4444" strokeWidth="1" fill="none" className="anim-flow-out" />
              <path d="M 315 240 L 300 240" stroke="#4ade80" strokeWidth="1.2" fill="none" className="anim-flow-out" />
              <path d="M 300 370 L 265 370 L 265 265 L 260 265" stroke="#38bdf8" strokeWidth="1" fill="none" className="anim-flow-out" />
            </g>

            {/* SATELLITE NODE 1: BUGZ-184 (Drift 1) */}
            <g className="anim-drift-1">
              <g transform="translate(42, 85)">
                <rect x="0" y="0" width="85" height="42" rx="3" fill="#0b0b10" stroke="currentColor" strokeOpacity="0.22" strokeWidth="0.8" />
                <rect x="0" y="0" width="85" height="42" fill="url(#card-hatch)" />
                {/* Header */}
                <circle cx="9" cy="11" r="2" fill="#38bdf8" />
                <text x="16" y="14" fill="currentColor" fontSize="7.5" fontFamily="monospace" fontWeight="600">
                  BUGZ-184
                </text>
                <text x="64" y="14" fill="#38bdf8" fontSize="6.5" fontFamily="monospace">
                  OPEN
                </text>
                {/* Title */}
                <text x="9" y="26" fill="currentColor" fillOpacity="0.75" fontSize="6.5" fontFamily="monospace">
                  auth.session.race
                </text>
                {/* Telemetry */}
                <text x="9" y="36" fill="#fbbf24" fontSize="6" fontFamily="monospace">
                  HIGH • p99 1.4ms
                </text>
              </g>
            </g>

            {/* SATELLITE NODE 2: BUGZ-207 (Active Lifecycle Showcase Node - Drift 2) */}
            <g className="anim-drift-2">
              <g transform="translate(300, 75)">
                <rect
                  x="0"
                  y="0"
                  width="135"
                  height="50"
                  rx="3"
                  fill="#0e0e14"
                  stroke={stages[activeStage].color}
                  strokeOpacity="0.7"
                  strokeWidth="1"
                />
                <rect x="0" y="0" width="135" height="50" fill="url(#card-hatch)" />

                {/* Header with Active Lifecycle Pill */}
                <circle cx="9" cy="12" r="2.2" fill={stages[activeStage].color} />
                <text x="16" y="15" fill="currentColor" fontSize="8" fontFamily="monospace" fontWeight="700">
                  BUGZ-207
                </text>
                <rect x="74" y="6" width="55" height="12" rx="2" fill={`${stages[activeStage].color}18`} stroke={stages[activeStage].color} strokeWidth="0.6" />
                <text x="101.5" y="14.5" fill={stages[activeStage].color} fontSize="6" fontFamily="monospace" fontWeight="700" textAnchor="middle">
                  {stages[activeStage].label}
                </text>

                {/* Title */}
                <text x="9" y="29" fill="currentColor" fillOpacity="0.9" fontSize="7" fontFamily="monospace">
                  query.planner.timeout
                </text>

                {/* Lifecycle Stepper Mini Bar */}
                <g transform="translate(9, 36)">
                  {[0, 1, 2, 3].map((step) => (
                    <g key={step} transform={`translate(${step * 29}, 0)`}>
                      <rect
                        x="0"
                        y="0"
                        width="24"
                        height="3"
                        rx="1"
                        fill={step <= activeStage ? stages[activeStage].color : '#27272a'}
                        fillOpacity={step <= activeStage ? 0.9 : 0.4}
                      />
                    </g>
                  ))}
                </g>
              </g>
            </g>

            {/* SATELLITE NODE 3: BUGZ-241 (Drift 1) */}
            <g className="anim-drift-1">
              <g transform="translate(25, 215)">
                <rect x="0" y="0" width="90" height="42" rx="3" fill="#0b0b10" stroke="currentColor" strokeOpacity="0.22" strokeWidth="0.8" />
                <circle cx="9" cy="11" r="2" fill="#fbbf24" />
                <text x="16" y="14" fill="currentColor" fontSize="7.5" fontFamily="monospace" fontWeight="600">
                  BUGZ-241
                </text>
                <text x="62" y="14" fill="#fbbf24" fontSize="6.5" fontFamily="monospace">
                  TRIAGED
                </text>
                <text x="9" y="26" fill="currentColor" fillOpacity="0.75" fontSize="6.5" fontFamily="monospace">
                  cors.preflight.opt
                </text>
                <text x="9" y="36" fill="currentColor" fillOpacity="0.5" fontSize="6" fontFamily="monospace">
                  MED • 128 req/s
                </text>
              </g>
            </g>

            {/* SATELLITE NODE 4: BUGZ-318 (Resolved State - Drift 3) */}
            <g className="anim-drift-3">
              <g transform="translate(315, 218)">
                <rect x="0" y="0" width="105" height="42" rx="3" fill="#09110d" stroke="#4ade80" strokeOpacity="0.35" strokeWidth="0.8" />
                <circle cx="9" cy="11" r="2" fill="#4ade80" />
                <text x="16" y="14" fill="currentColor" fontSize="7.5" fontFamily="monospace" fontWeight="600">
                  BUGZ-318
                </text>
                <text x="66" y="14" fill="#4ade80" fontSize="6.5" fontFamily="monospace" fontWeight="600">
                  RESOLVED
                </text>
                <text x="9" y="26" fill="currentColor" fillOpacity="0.8" fontSize="6.5" fontFamily="monospace">
                  milestone.calc.drift
                </text>
                <text x="9" y="36" fill="#4ade80" fillOpacity="0.8" fontSize="6" fontFamily="monospace">
                  FIXED • tx: 0x4A2F
                </text>
              </g>
            </g>

            {/* SATELLITE NODE 5: BUGZ-402 (Drift 2) */}
            <g className="anim-drift-2">
              <g transform="translate(35, 345)">
                <rect x="0" y="0" width="100" height="42" rx="3" fill="#0b0b10" stroke="currentColor" strokeOpacity="0.22" strokeWidth="0.8" />
                <circle cx="9" cy="11" r="2" fill="#818cf8" />
                <text x="16" y="14" fill="currentColor" fontSize="7.5" fontFamily="monospace" fontWeight="600">
                  BUGZ-402
                </text>
                <text x="64" y="14" fill="#818cf8" fontSize="6.5" fontFamily="monospace">
                  ASSIGNED
                </text>
                <text x="9" y="26" fill="currentColor" fillOpacity="0.75" fontSize="6.5" fontFamily="monospace">
                  pool.connection.leak
                </text>
                <text x="9" y="36" fill="#fbbf24" fontSize="6" fontFamily="monospace">
                  HIGH • @lead_dev
                </text>
              </g>
            </g>

            {/* SATELLITE NODE 6: BUGZ-489 (Drift 3) */}
            <g className="anim-drift-3">
              <g transform="translate(300, 350)">
                <rect x="0" y="0" width="100" height="42" rx="3" fill="#0b0b10" stroke="currentColor" strokeOpacity="0.22" strokeWidth="0.8" />
                <circle cx="9" cy="11" r="2" fill="#38bdf8" />
                <text x="16" y="14" fill="currentColor" fontSize="7.5" fontFamily="monospace" fontWeight="600">
                  BUGZ-489
                </text>
                <text x="66" y="14" fill="#38bdf8" fontSize="6.5" fontFamily="monospace">
                  OPEN
                </text>
                <text x="9" y="26" fill="currentColor" fillOpacity="0.75" fontSize="6.5" fontFamily="monospace">
                  telemetry.buffer.lag
                </text>
                <text x="9" y="36" fill="currentColor" fillOpacity="0.5" fontSize="6" fontFamily="monospace">
                  MED • q: 0.2s
                </text>
              </g>
            </g>

            {/* CENTRAL OBSERVABILITY HUB: ISSUE CORE */}
            <g className="anim-core" transform="translate(180, 195)">
              {/* Outer Core Chassis */}
              <rect
                x="0"
                y="0"
                width="120"
                height="80"
                rx="4"
                fill="#0d0d12"
                stroke="hsl(var(--primary))"
                strokeOpacity="0.6"
                strokeWidth="1"
              />
              <rect x="0" y="0" width="120" height="80" fill="url(#card-hatch)" />

              {/* Core Header */}
              <rect x="0" y="0" width="120" height="18" rx="4" fill="hsl(var(--primary))" fillOpacity="0.12" />
              <line x1="0" y1="18" x2="120" y2="18" stroke="hsl(var(--primary))" strokeOpacity="0.3" strokeWidth="0.8" />
              
              <circle cx="10" cy="9" r="2.2" fill="hsl(var(--primary))" />
              <text x="18" y="12.5" fill="currentColor" fontSize="7.5" fontFamily="monospace" fontWeight="700" letterSpacing="0.08em">
                ISSUE CORE
              </text>
              <text x="88" y="12.5" fill="hsl(var(--primary))" fontSize="6.5" fontFamily="monospace">
                PIPELINE
              </text>

              {/* Central Dynamic Processing Gauge */}
              <g transform="translate(12, 28)">
                <text x="0" y="8" fill="currentColor" fillOpacity="0.6" fontSize="6" fontFamily="monospace">
                  REALTIME DISPATCH
                </text>
                <text x="0" y="20" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="700">
                  99.4% UPTIME
                </text>
                <text x="0" y="31" fill="#4ade80" fontSize="6.5" fontFamily="monospace">
                  ACID VALIDATED • 0 ERR
                </text>
                <text x="0" y="42" fill="currentColor" fillOpacity="0.4" fontSize="5.5" fontFamily="monospace">
                  EVENT BUS: ACTIVE
                </text>
              </g>

              {/* Mini Reticle Crosshair in Corner */}
              <g transform="translate(104, 64)" opacity="0.6">
                <circle cx="0" cy="0" r="4" stroke="currentColor" strokeWidth="0.6" fill="none" />
                <line x1="-6" y1="0" x2="6" y2="0" stroke="currentColor" strokeWidth="0.6" />
                <line x1="0" y1="-6" x2="0" y2="6" stroke="currentColor" strokeWidth="0.6" />
              </g>
            </g>
          </g>
        </svg>
      </div>

      {/* Observability Bottom Metrics Bar */}
      <div className="w-full grid grid-cols-3 divide-x divide-border/60 border border-border/80 border-t-0 rounded-b-md bg-card/60 font-mono text-[10px] backdrop-blur-xs">
        <div className="p-2 text-center">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Active Issues</p>
          <p className="text-[12px] font-bold text-sky-400 mt-0.5">12</p>
        </div>
        <div className="p-2 text-center">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">In Triage</p>
          <p className="text-[12px] font-bold text-amber-400 mt-0.5">04</p>
        </div>
        <div className="p-2 text-center">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Resolved</p>
          <p className="text-[12px] font-bold text-emerald-400 mt-0.5">87%</p>
        </div>
      </div>
    </div>
  )
}

// Backwards compatibility alias
export const TechnicalGeometryHero = LiveIssueIntelligence
