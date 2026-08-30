import React from 'react'

export function TechnicalGeometryHero({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative w-full max-w-[460px] lg:max-w-[500px] aspect-square flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes dag-drift-1 {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-4px) translateX(2px);
          }
        }

        @keyframes dag-drift-2 {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(4px) translateX(-3px);
          }
        }

        @keyframes dag-drift-3 {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-5px) translateX(-2px);
          }
        }

        @keyframes slow-trace-flow {
          0% {
            stroke-dashoffset: 48;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes state-pulse-calm {
          0%, 100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.95;
          }
        }

        @keyframes axis-satellite-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .anim-dag-1 {
          animation: dag-drift-1 22s ease-in-out infinite;
        }

        .anim-dag-2 {
          animation: dag-drift-2 28s ease-in-out infinite;
        }

        .anim-dag-3 {
          animation: dag-drift-3 34s ease-in-out infinite;
        }

        .anim-trace-flow {
          stroke-dasharray: 4 8;
          animation: slow-trace-flow 24s linear infinite;
        }

        .anim-state-pulse {
          animation: state-pulse-calm 7s ease-in-out infinite;
        }

        .anim-satellite {
          animation: axis-satellite-spin 75s linear infinite;
          transform-origin: 320px 240px;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-dag-1,
          .anim-dag-2,
          .anim-dag-3,
          .anim-trace-flow,
          .anim-state-pulse,
          .anim-satellite {
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
          {/* Subtle 1px grid pattern */}
          <pattern id="infra-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.04" />
            <circle cx="0" cy="0" r="0.6" fill="currentColor" fillOpacity="0.12" />
          </pattern>

          {/* Micro line hatch pattern for node fills */}
          <pattern id="node-hatch" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.08" />
          </pattern>

          {/* Sparse mask to fade outer edges seamlessly */}
          <radialGradient id="edge-fade" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <mask id="fade-mask">
            <rect width="480" height="480" fill="url(#edge-fade)" />
          </mask>
        </defs>

        <g mask="url(#fade-mask)">
          {/* Background Technical Grid */}
          <rect width="480" height="480" fill="url(#infra-grid)" />

          {/* Peripheral Coordinate Marks & Crosshairs */}
          <g opacity="0.3">
            <path d="M 36 32 L 36 40 M 32 36 L 40 36" stroke="currentColor" strokeWidth="0.8" />
            <text x="46" y="39" fill="currentColor" fontSize="6.5" fontFamily="monospace" letterSpacing="0.05em">00:SYS_INIT</text>

            <path d="M 444 32 L 444 40 M 440 36 L 448 36" stroke="currentColor" strokeWidth="0.8" />
            <text x="406" y="39" fill="currentColor" fontSize="6.5" fontFamily="monospace" letterSpacing="0.05em">GRAPH:0x7A</text>

            <path d="M 36 444 L 36 452 M 32 448 L 40 448" stroke="currentColor" strokeWidth="0.8" />
            <text x="46" y="451" fill="currentColor" fontSize="6.5" fontFamily="monospace" letterSpacing="0.05em">TX_QUEUE:0</text>

            <path d="M 444 444 L 444 452 M 440 448 L 448 448" stroke="currentColor" strokeWidth="0.8" />
            <text x="408" y="451" fill="currentColor" fontSize="6.5" fontFamily="monospace" letterSpacing="0.05em">STATE:ACID</text>
          </g>

          {/* Thin Boundary Scale Rulers */}
          <g opacity="0.2">
            <line x1="28" y1="120" x2="28" y2="360" stroke="currentColor" strokeWidth="0.6" />
            {[120, 160, 200, 240, 280, 320, 360].map((y) => (
              <line key={y} x1="25" y1={y} x2="28" y2={y} stroke="currentColor" strokeWidth="0.6" />
            ))}

            <line x1="120" y1="452" x2="360" y2="452" stroke="currentColor" strokeWidth="0.6" />
            {[120, 160, 200, 240, 280, 320, 360].map((x) => (
              <line key={x} x1={x} y1="449" x2={x} y2="452" stroke="currentColor" strokeWidth="0.6" />
            ))}
          </g>

          {/* Structural Connecting Dependency Traces (Orthogonal 90° Routing) */}
          <g opacity="0.35">
            {/* Primary Trunk Path */}
            <path
              d="M 96 112 L 176 112 L 176 176 L 244 176"
              stroke="currentColor"
              strokeWidth="0.8"
              fill="none"
            />
            {/* Secondary Branch Path */}
            <path
              d="M 96 112 L 96 240 L 160 240 L 160 304 L 232 304"
              stroke="currentColor"
              strokeWidth="0.8"
              fill="none"
            />
            {/* Convergence Path */}
            <path
              d="M 314 176 L 368 176 L 368 240 L 404 240"
              stroke="currentColor"
              strokeWidth="0.8"
              fill="none"
            />
            <path
              d="M 302 304 L 368 304 L 368 240"
              stroke="currentColor"
              strokeWidth="0.8"
              fill="none"
            />
            {/* Direct Feedback Loop Track */}
            <path
              d="M 279 204 L 279 276"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeDasharray="2 4"
              fill="none"
            />
          </g>

          {/* Animated Dashed Pulse Traces */}
          <g className="anim-trace-flow" opacity="0.5">
            <path
              d="M 96 112 L 176 112 L 176 176 L 244 176"
              stroke="currentColor"
              strokeWidth="0.9"
              fill="none"
            />
            <path
              d="M 314 176 L 368 176 L 368 240 L 404 240"
              stroke="currentColor"
              strokeWidth="0.9"
              fill="none"
            />
          </g>

          {/* Single Accent Active Segment (Ultra-Restrained) */}
          <line
            x1="176"
            y1="140"
            x2="176"
            y2="176"
            stroke="hsl(var(--primary))"
            strokeWidth="1.2"
            strokeOpacity="0.75"
          />

          {/* Cluster 1: Ingestion / Root Node (Drift Group 1) */}
          <g className="anim-dag-1">
            {/* Node 00: ROOT */}
            <g transform="translate(48, 98)">
              <rect
                x="0"
                y="0"
                width="72"
                height="28"
                rx="2"
                fill="#0b0b0e"
                stroke="currentColor"
                strokeOpacity="0.2"
                strokeWidth="0.8"
              />
              <rect x="0" y="0" width="72" height="28" fill="url(#node-hatch)" />
              {/* Status Pip */}
              <circle cx="8" cy="14" r="1.8" fill="currentColor" fillOpacity="0.4" />
              <text x="16" y="17" fill="currentColor" fillOpacity="0.8" fontSize="7.5" fontFamily="monospace" fontWeight="500">
                00:ROOT
              </text>
              {/* Segmented mini-rail */}
              <line x1="52" y1="12" x2="52" y2="16" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
              <line x1="56" y1="12" x2="56" y2="16" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
              <line x1="60" y1="12" x2="60" y2="16" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
            </g>

            {/* Micro Telemetry Block */}
            <g transform="translate(64, 138)" opacity="0.45">
              <text x="0" y="0" fill="currentColor" fontSize="6" fontFamily="monospace">
                IN: 128 pkts/s
              </text>
            </g>
          </g>

          {/* Cluster 2: Processing Matrix (Drift Group 2) */}
          <g className="anim-dag-2">
            {/* Node 01: RESOLVE (Primary highlighted node) */}
            <g transform="translate(244, 162)">
              <rect
                x="0"
                y="0"
                width="70"
                height="28"
                rx="2"
                fill="#0e0e12"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="0.8"
              />
              {/* Single sparse accent dot on the active node */}
              <circle
                cx="9"
                cy="14"
                r="2"
                fill="hsl(var(--primary))"
                className="anim-state-pulse"
              />
              <text x="18" y="17" fill="currentColor" fillOpacity="0.9" fontSize="7.5" fontFamily="monospace" fontWeight="600">
                01:RESOLVE
              </text>
            </g>

            {/* Central Interlocking Geometric Structure (Subtle Core) */}
            <g transform="translate(279, 240)">
              {/* Outer Wireframe Diamond */}
              <polygon
                points="0,-22 22,0 0,22 -22,0"
                fill="#09090c"
                stroke="currentColor"
                strokeOpacity="0.18"
                strokeWidth="0.8"
              />
              {/* Inner Wireframe Square */}
              <rect
                x="-10"
                y="-10"
                width="20"
                height="20"
                fill="#0f0f14"
                stroke="currentColor"
                strokeOpacity="0.22"
                strokeWidth="0.8"
              />
              {/* Center Crosshair */}
              <line x1="-4" y1="0" x2="4" y2="0" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.8" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.8" />
            </g>

            {/* Node 02: INDEX */}
            <g transform="translate(232, 290)">
              <rect
                x="0"
                y="0"
                width="70"
                height="28"
                rx="2"
                fill="#0b0b0e"
                stroke="currentColor"
                strokeOpacity="0.2"
                strokeWidth="0.8"
              />
              <circle cx="9" cy="14" r="1.8" fill="currentColor" fillOpacity="0.35" />
              <text x="18" y="17" fill="currentColor" fillOpacity="0.75" fontSize="7.5" fontFamily="monospace" fontWeight="500">
                02:INDEX
              </text>
            </g>
          </g>

          {/* Cluster 3: Output & Sink (Drift Group 3) */}
          <g className="anim-dag-3">
            {/* Node 03: SINK / APPLIED */}
            <g transform="translate(372, 226)">
              <rect
                x="0"
                y="0"
                width="64"
                height="28"
                rx="2"
                fill="#0b0b0e"
                stroke="currentColor"
                strokeOpacity="0.2"
                strokeWidth="0.8"
              />
              <rect x="0" y="0" width="64" height="28" fill="url(#node-hatch)" />
              <circle cx="8" cy="14" r="1.8" fill="currentColor" fillOpacity="0.5" />
              <text x="16" y="17" fill="currentColor" fillOpacity="0.8" fontSize="7.5" fontFamily="monospace" fontWeight="500">
                03:APPLY
              </text>
            </g>

            {/* Micro Telemetry Block */}
            <g transform="translate(374, 268)" opacity="0.4">
              <text x="0" y="0" fill="currentColor" fontSize="6" fontFamily="monospace">
                LAT: 1.2ms
              </text>
            </g>
          </g>

          {/* Ultra-Slow Orbiting Satellite Axis Node */}
          <g className="anim-satellite">
            <g transform="translate(320, 186)">
              <circle cx="0" cy="0" r="1.5" fill="currentColor" fillOpacity="0.4" />
              <circle cx="0" cy="0" r="4" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.6" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
