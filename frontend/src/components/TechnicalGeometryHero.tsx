import React from 'react'

export function TechnicalGeometryHero({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative w-full max-w-[460px] lg:max-w-[500px] aspect-square flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes workflow-drift-1 {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-4px) translateX(2px);
          }
        }

        @keyframes workflow-drift-2 {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(3px) translateX(-3px);
          }
        }

        @keyframes workflow-drift-3 {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-5px) translateX(-2px);
          }
        }

        @keyframes signal-travel {
          0% {
            stroke-dashoffset: 240;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes signal-pulse-node {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.95;
          }
        }

        @keyframes micro-pivot-rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .anim-node-1 {
          animation: workflow-drift-1 20s ease-in-out infinite;
        }

        .anim-node-2 {
          animation: workflow-drift-2 26s ease-in-out infinite;
        }

        .anim-node-3 {
          animation: workflow-drift-3 32s ease-in-out infinite;
        }

        .anim-signal-path {
          stroke-dasharray: 8 16;
          animation: signal-travel 18s linear infinite;
        }

        .anim-active-pulse {
          animation: signal-pulse-node 6s ease-in-out infinite;
        }

        .anim-micro-pivot {
          animation: micro-pivot-rotate 80s linear infinite;
          transform-origin: 240px 240px;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-node-1,
          .anim-node-2,
          .anim-node-3,
          .anim-signal-path,
          .anim-active-pulse,
          .anim-micro-pivot {
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
          {/* Subtle grid texture */}
          <pattern id="wf-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.04" />
            <circle cx="0" cy="0" r="0.6" fill="currentColor" fillOpacity="0.1" />
          </pattern>

          {/* Micro line hatch pattern for node fills */}
          <pattern id="wf-hatch" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.08" />
          </pattern>

          {/* Vignette mask to fade outer edges seamlessly */}
          <radialGradient id="wf-edge-fade" cx="50%" cy="50%" r="50%">
            <stop offset="65%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <mask id="wf-mask">
            <rect width="480" height="480" fill="url(#wf-edge-fade)" />
          </mask>
        </defs>

        <g mask="url(#wf-mask)">
          {/* Background Technical Grid */}
          <rect width="480" height="480" fill="url(#wf-grid)" />

          {/* System Coordinate Header & Telemetry Marks */}
          <g opacity="0.35">
            <path d="M 36 32 L 36 40 M 32 36 L 40 36" stroke="currentColor" strokeWidth="0.8" />
            <text x="46" y="39" fill="currentColor" fontSize="6.5" fontFamily="monospace" letterSpacing="0.06em">KAIZEN:PIPELINE</text>

            <path d="M 444 32 L 444 40 M 440 36 L 448 36" stroke="currentColor" strokeWidth="0.8" />
            <text x="395" y="39" fill="currentColor" fontSize="6.5" fontFamily="monospace" letterSpacing="0.06em">STATUS:SYNCED</text>

            <path d="M 36 444 L 36 452 M 32 448 L 40 448" stroke="currentColor" strokeWidth="0.8" />
            <text x="46" y="451" fill="currentColor" fontSize="6.5" fontFamily="monospace" letterSpacing="0.06em">CYCLE:0.2s</text>

            <path d="M 444 444 L 444 452 M 440 448 L 448 448" stroke="currentColor" strokeWidth="0.8" />
            <text x="408" y="451" fill="currentColor" fontSize="6.5" fontFamily="monospace" letterSpacing="0.06em">FLOW:ACID</text>
          </g>

          {/* Coordinate Scale Marks */}
          <g opacity="0.2">
            <line x1="28" y1="140" x2="28" y2="340" stroke="currentColor" strokeWidth="0.6" />
            {[140, 180, 220, 260, 300, 340].map((y) => (
              <line key={y} x1="25" y1={y} x2="28" y2={y} stroke="currentColor" strokeWidth="0.6" />
            ))}

            <line x1="140" y1="452" x2="340" y2="452" stroke="currentColor" strokeWidth="0.6" />
            {[140, 180, 220, 260, 300, 340].map((x) => (
              <line key={x} x1={x} y1="449" x2={x} y2="452" stroke="currentColor" strokeWidth="0.6" />
            ))}
          </g>

          {/* Connecting Infrastructure Traces: issue -> triage -> resolve -> deploy */}
          <g opacity="0.35">
            {/* Trunk: 01:ISSUE -> 02:TRIAGE */}
            <path
              d="M 126 128 L 196 128 L 196 196 L 244 196"
              stroke="currentColor"
              strokeWidth="0.8"
              fill="none"
            />
            {/* Trunk: 02:TRIAGE -> 03:RESOLVE */}
            <path
              d="M 314 196 L 356 196 L 356 284 L 298 284"
              stroke="currentColor"
              strokeWidth="0.8"
              fill="none"
            />
            {/* Trunk: 03:RESOLVE -> 04:DEPLOY */}
            <path
              d="M 226 284 L 160 284 L 160 356 L 340 356 L 380 356"
              stroke="currentColor"
              strokeWidth="0.8"
              fill="none"
            />
            {/* Feedback / Dependency link */}
            <path
              d="M 279 210 L 279 270"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeDasharray="2 4"
              fill="none"
            />
          </g>

          {/* Animated Signal Traveling Through Workflow */}
          <g className="anim-signal-path" opacity="0.65">
            <path
              d="M 126 128 L 196 128 L 196 196 L 244 196"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M 314 196 L 356 196 L 356 284 L 298 284"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M 226 284 L 160 284 L 160 356 L 340 356 L 380 356"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
          </g>

          {/* Single Accent Active Trace Segment */}
          <line
            x1="196"
            y1="156"
            x2="196"
            y2="196"
            stroke="hsl(var(--primary))"
            strokeWidth="1.2"
            strokeOpacity="0.8"
          />

          {/* Node 01: ISSUE (Drift Group 1) */}
          <g className="anim-node-1">
            <g transform="translate(54, 114)">
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
              <rect x="0" y="0" width="72" height="28" fill="url(#wf-hatch)" />
              <circle cx="8" cy="14" r="1.8" fill="currentColor" fillOpacity="0.4" />
              <text x="16" y="17" fill="currentColor" fillOpacity="0.8" fontSize="7.5" fontFamily="monospace" fontWeight="500">
                01:ISSUE
              </text>
              {/* Segmented rail */}
              <line x1="52" y1="12" x2="52" y2="16" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
              <line x1="56" y1="12" x2="56" y2="16" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
              <line x1="60" y1="12" x2="60" y2="16" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
            </g>
          </g>

          {/* Node 02: TRIAGE (Drift Group 2 - Active status) */}
          <g className="anim-node-2">
            <g transform="translate(244, 182)">
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
              {/* Single sparse primary accent dot */}
              <circle
                cx="9"
                cy="14"
                r="2"
                fill="hsl(var(--primary))"
                className="anim-active-pulse"
              />
              <text x="18" y="17" fill="currentColor" fillOpacity="0.9" fontSize="7.5" fontFamily="monospace" fontWeight="600">
                02:TRIAGE
              </text>
            </g>

            {/* Central Micro Coordinate Pivot */}
            <g transform="translate(279, 240)">
              <polygon
                points="0,-16 16,0 0,16 -16,0"
                fill="#09090c"
                stroke="currentColor"
                strokeOpacity="0.18"
                strokeWidth="0.8"
              />
              <rect
                x="-7"
                y="-7"
                width="14"
                height="14"
                fill="#0f0f14"
                stroke="currentColor"
                strokeOpacity="0.22"
                strokeWidth="0.8"
              />
              <line x1="-3" y1="0" x2="3" y2="0" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.8" />
              <line x1="0" y1="-3" x2="0" y2="3" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.8" />
            </g>
          </g>

          {/* Node 03: RESOLVE (Drift Group 2) */}
          <g className="anim-node-2">
            <g transform="translate(226, 270)">
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
              <circle cx="9" cy="14" r="1.8" fill="currentColor" fillOpacity="0.35" />
              <text x="18" y="17" fill="currentColor" fillOpacity="0.75" fontSize="7.5" fontFamily="monospace" fontWeight="500">
                03:RESOLVE
              </text>
            </g>
          </g>

          {/* Node 04: DEPLOY (Drift Group 3) */}
          <g className="anim-node-3">
            <g transform="translate(366, 342)">
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
              <rect x="0" y="0" width="70" height="28" fill="url(#wf-hatch)" />
              <circle cx="8" cy="14" r="1.8" fill="currentColor" fillOpacity="0.5" />
              <text x="16" y="17" fill="currentColor" fillOpacity="0.8" fontSize="7.5" fontFamily="monospace" fontWeight="500">
                04:DEPLOY
              </text>
            </g>

            {/* Micro Latency Tag */}
            <g transform="translate(372, 384)" opacity="0.4">
              <text x="0" y="0" fill="currentColor" fontSize="6" fontFamily="monospace">
                LAT: 1.2ms
              </text>
            </g>
          </g>

          {/* Ultra-Slow Orbiting Satellite Axis Node */}
          <g className="anim-micro-pivot">
            <g transform="translate(240, 150)">
              <circle cx="0" cy="0" r="1.2" fill="currentColor" fillOpacity="0.4" />
              <circle cx="0" cy="0" r="3.5" stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.5" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
