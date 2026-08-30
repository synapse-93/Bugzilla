import React, { useState, useEffect, useRef } from 'react'
import { StackedLogo } from './StackedLogo'
import {
  EditorialHeroArt,
  DynamicCapabilityArt,
  WorkflowTrajectoryArt,
  FinalResolutionArt,
  SectionCrosshair,
} from './AbstractGeometry'
import { Button } from './ui/button'
import { ArrowRight, Sparkles, Command, Shield, Zap, CheckCircle2 } from 'lucide-react'

interface LandingPageProps {
  onOpenAuth: (mode?: 'LOGIN' | 'REGISTER' | 'GUEST') => void
}

const CAPABILITIES = [
  {
    id: 0,
    tag: '01 / ISSUES',
    title: 'Capture, prioritize and organize work.',
    description:
      'Structured canonical project keys, multi-field filters, instant search, and custom priority flags for complete issue triage and rapid bug classification.',
    detail: 'Canonical Keys • Instant Filter • Severity Triage',
    bullets: ['Canonical keys', 'Multi-field filter', 'Severity triage'],
  },
  {
    id: 1,
    tag: '02 / WORKFLOW',
    title: 'Move issues from open to resolution.',
    description:
      'Interactive Kanban board with drag-and-drop state progression, optimistic UI updates, and instant status rollback guards that keep engineering teams in flow.',
    detail: 'Drag & Drop • Optimistic Sync • Rollback Safety',
    bullets: ['Interactive Kanban', 'Optimistic updates', 'Rollback guards'],
  },
  {
    id: 2,
    tag: '03 / COLLABORATION',
    title: 'Comments, teams, invitations and profiles.',
    description:
      'Full discussion threads with Markdown editing, role-based project permissions, synchronous audit updates, and in-app developer talent discovery.',
    detail: 'Markdown Threads • Role Access • Team Discovery',
    bullets: ['Markdown discussions', 'Role-based access', 'Developer discovery'],
  },
  {
    id: 3,
    tag: '04 / INSIGHT',
    title: 'Analytics, activity and project visibility.',
    description:
      'Live audit streams, real resolution velocity, milestone target deadlines, and comprehensive telemetry for complete project execution clarity.',
    detail: 'Velocity Telemetry • Milestone Deadlines • Audit Trail',
    bullets: ['Velocity telemetry', 'Milestone targets', 'Live audit stream'],
  },
]

export function LandingPage({ onOpenAuth }: LandingPageProps) {
  const [heroProgress, setHeroProgress] = useState(0)
  const [activeStage, setActiveStage] = useState(0)
  const [capabilitiesScrollProgress, setCapabilitiesScrollProgress] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const capabilitiesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleMotionChange)

    // Passive scroll listener for hero and capabilities choreography
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY
          const heroHeight = Math.max(window.innerHeight * 0.7, 400)
          setHeroProgress(Math.min(1, Math.max(0, scrollY / heroHeight)))

          if (capabilitiesRef.current && window.innerWidth >= 1024) {
            const rect = capabilitiesRef.current.getBoundingClientRect()
            const totalDistance = capabilitiesRef.current.offsetHeight - window.innerHeight
            if (totalDistance > 0) {
              const topOffset = 56 // 56px sticky header
              const currentProgress = (topOffset - rect.top) / totalDistance
              const clamped = Math.max(0, Math.min(1, currentProgress))
              setCapabilitiesScrollProgress(clamped)

              // 4 equal divisions: [0, 0.25), [0.25, 0.50), [0.50, 0.75), [0.75, 1.00]
              const stage = Math.min(3, Math.max(0, Math.floor(clamped * 4)))
              setActiveStage(stage)
            }
          }

          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToStage = (stageIndex: number) => {
    setActiveStage(stageIndex)
    if (capabilitiesRef.current && window.innerWidth >= 1024) {
      const rect = capabilitiesRef.current.getBoundingClientRect()
      const containerDocTop = window.scrollY + rect.top
      const totalDistance = capabilitiesRef.current.offsetHeight - window.innerHeight
      const topOffset = 56
      const stageProgressFraction = (stageIndex + 0.5) / 4
      const targetY = containerDocTop - topOffset + stageProgressFraction * totalDistance
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    }
  }

  // Hero transform styles based on scroll
  const heroTextTransform = prefersReducedMotion
    ? undefined
    : `translate3d(0, ${-heroProgress * 20}px, 0)`
  const heroSubOpacity = prefersReducedMotion ? 1 : Math.max(0.65, 1 - heroProgress * 0.45)

  const activeCap = CAPABILITIES[activeStage] || CAPABILITIES[0]

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 flex flex-col items-center relative overflow-x-hidden">
      {/* Precision Background Guide Rail (Desktop Only) */}
      <div
        className="hidden xl:block absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border/40 to-transparent pointer-events-none z-0"
        aria-hidden="true"
      >
        <div className="sticky top-24 font-mono text-[9px] text-muted-foreground/40 space-y-36 pl-3">
          <div>COORD:00 // HERO</div>
          <div>COORD:01 // PHILOSOPHY</div>
          <div>COORD:02 // WORKFLOW</div>
          <div>COORD:03 // CAPABILITIES</div>
          <div>COORD:04 // PRIMITIVES</div>
          <div>COORD:05 // RESOLVE</div>
        </div>
      </div>

      {/* Editorial Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-border/60 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/10 border border-primary/30 text-primary transition-transform hover:scale-105">
              <StackedLogo size={14} color="currentColor" />
            </div>
            <span className="font-bold tracking-tight text-[13px] text-foreground">
              KAIZEN
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenAuth('LOGIN')}
              className="text-[12.5px] text-muted-foreground hover:text-foreground h-8 px-3 transition-colors"
            >
              Sign in
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenAuth('REGISTER')}
              className="text-[12.5px] h-8 px-3.5 font-medium rounded-md shadow-sm transition-all hover:translate-y-[-1px]"
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Main Long-Scroll Continuous Container */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col space-y-24 sm:space-y-32 py-10 sm:py-16 relative z-10">
        
        {/* SECTION 1: HERO */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center pt-2 sm:pt-8 min-h-[70vh] sm:min-h-[75vh]">
          <div
            className="lg:col-span-7 flex flex-col space-y-6 max-w-xl transition-all duration-300 ease-out"
            style={{ transform: heroTextTransform }}
          >
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/80 bg-card/40 w-fit text-[11px] font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>Issue tracking, refined.</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.08]">
              Issue tracking,<br />
              <span className="text-muted-foreground/90">refined.</span>
            </h1>

            <p
              className="text-[14.5px] sm:text-[15.5px] text-muted-foreground leading-relaxed max-w-lg transition-opacity duration-300"
              style={{ opacity: heroSubOpacity }}
            >
              A fast, minimalist workspace for engineering teams to track issues, coordinate workflows, and ship software with absolute clarity.
            </p>

            <div
              className="flex items-center gap-3 pt-2 flex-wrap transition-opacity duration-300"
              style={{ opacity: heroSubOpacity }}
            >
              <Button
                size="lg"
                onClick={() => onOpenAuth('REGISTER')}
                className="text-[13px] h-10 px-5 font-medium gap-2 rounded-md transition-all hover:translate-y-[-1px]"
              >
                <span>Get started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onOpenAuth('LOGIN')}
                className="text-[13px] h-10 px-4 text-muted-foreground hover:text-foreground rounded-md transition-all"
              >
                Sign in
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onOpenAuth('GUEST')}
                className="text-[12px] h-10 px-3 text-muted-foreground/80 hover:text-foreground font-mono gap-1.5 rounded-md transition-all"
              >
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>Instant guest sandbox</span>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 flex items-center justify-center relative">
            <EditorialHeroArt scrollProgress={heroProgress} className="w-full" />
          </div>
        </section>

        {/* SECTION 2: CORE PHILOSOPHY */}
        <section className="flex flex-col space-y-8 border-t border-border/50 pt-16 sm:pt-20">
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
            <SectionCrosshair />
            <span>00 • Core Philosophy</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <h2 className="md:col-span-5 text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
              Purpose-built for software engineers.
            </h2>
            <div className="md:col-span-7 space-y-4 text-[14.5px] text-muted-foreground leading-relaxed">
              <p>
                Most issue trackers have accumulated decades of enterprise bloat, sluggish interfaces, and decorative distraction.
              </p>
              <p>
                Kaizen strips away the noise. We focused on the essentials: high-density issue discovery, frictionless keyboard workflows, and responsive real-time project management.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: WORKFLOW ENGINE */}
        <section className="flex flex-col space-y-8 border-t border-border/50 pt-16 sm:pt-20">
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
            <SectionCrosshair />
            <span>01 • Workflow Engine</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              From reported to resolved.
            </h2>
            <p className="text-[14px] text-muted-foreground max-w-xl">
              An intuitive progression structure designed to keep developers in flow.
            </p>
          </div>

          <div className="py-6 flex items-center justify-center">
            <WorkflowTrajectoryArt className="w-full" />
          </div>
        </section>

        {/* SECTION 4: PINNED CONTINUOUS STORYTELLING CAPABILITIES */}
        <section
          ref={capabilitiesRef}
          className="relative border-t border-border/50 pt-12 lg:pt-0 lg:h-[260vh]"
        >
          {/* DESKTOP PINNED STORYTELLING (>= 1024px) */}
          <div className="hidden lg:flex sticky top-14 h-[calc(100vh-3.5rem)] flex-col justify-center w-full overflow-hidden py-4">
            {/* Stage Header with live telemetry progress rail */}
            <div className="flex items-center justify-between gap-4 mb-6 shrink-0">
              <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                <SectionCrosshair />
                <span>02 • System Capabilities</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-muted-foreground">PROGRESS</span>
                <div className="w-28 h-1 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${Math.round(capabilitiesScrollProgress * 100)}%` }}
                  />
                </div>
                <span className="text-primary font-bold">0{activeStage + 1} / 04</span>
              </div>
            </div>

            {/* Two-Column Grid: Visual Anchor & Stage Content */}
            <div className="grid grid-cols-12 gap-10 items-center w-full flex-1 min-h-0">
              {/* Left Column: Pinned Dynamic Abstract Geometry & Stage Navigation */}
              <div className="col-span-5 flex flex-col space-y-4">
                {/* Dynamic Architectural Visual Module */}
                <div className="p-5 rounded-xl border border-border/80 bg-card/60 flex flex-col items-center justify-center min-h-[320px] shadow-sm relative overflow-hidden backdrop-blur-sm">
                  <DynamicCapabilityArt activeStage={activeStage} className="w-full max-w-[320px]" />
                  <div className="absolute top-3 left-4 font-mono text-[9.5px] text-muted-foreground/70 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>STATE // 0{activeStage + 1}.ACTIVE</span>
                  </div>
                  <div className="absolute top-3 right-4 font-mono text-[9.5px] text-primary font-semibold">
                    COORD:02.{activeStage + 1}
                  </div>
                </div>

                {/* Anchored Navigation Tabs */}
                <div className="grid grid-cols-4 gap-2">
                  {CAPABILITIES.map((cap) => {
                    const isActive = activeStage === cap.id
                    return (
                      <button
                        key={cap.id}
                        type="button"
                        onClick={() => scrollToStage(cap.id)}
                        className={`py-2 px-2 rounded border text-center font-mono text-[10px] transition-all cursor-pointer select-none ${
                          isActive
                            ? 'border-primary bg-primary/15 text-primary font-bold shadow-sm'
                            : 'border-border/60 bg-card/30 text-muted-foreground hover:border-border hover:text-foreground'
                        }`}
                      >
                        <div className="truncate">{cap.tag.split(' / ')[1]}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right Column: Progressive Active Content Card */}
              <div className="col-span-7 relative min-h-[340px] flex items-center">
                <div
                  key={activeCap.id}
                  className="w-full p-8 rounded-xl border border-primary/40 bg-card/80 shadow-xl space-y-4 transition-all duration-300 ease-out"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-mono text-[12px] font-semibold text-primary">
                      {activeCap.tag}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40">
                      {activeCap.detail}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
                    {activeCap.title}
                  </h3>

                  <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-relaxed">
                    {activeCap.description}
                  </p>

                  {/* Technical Feature Chips */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    {activeCap.bullets.map((b, bIdx) => (
                      <div
                        key={bIdx}
                        className="flex items-center gap-2 p-2 rounded bg-muted/30 border border-border/50 text-[11px] font-mono text-muted-foreground"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE / TABLET INTERACTIVE SHOWCASE (< 1024px) */}
          <div className="block lg:hidden space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                <SectionCrosshair />
                <span>02 • System Capabilities</span>
              </div>
              <span className="text-primary font-mono text-[11px] font-bold">0{activeStage + 1} / 04</span>
            </div>

            {/* Tabs Header */}
            <div className="grid grid-cols-4 gap-1.5">
              {CAPABILITIES.map((cap) => {
                const isActive = activeStage === cap.id
                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => setActiveStage(cap.id)}
                    className={`py-2 px-1 rounded border text-center font-mono text-[10px] transition-all cursor-pointer ${
                      isActive
                        ? 'border-primary bg-primary/15 text-primary font-bold shadow-sm'
                        : 'border-border/60 bg-card/30 text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    <div className="truncate">{cap.tag.split(' / ')[1]}</div>
                  </button>
                )}
              )}
            </div>

            {/* Visual Module */}
            <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex flex-col items-center justify-center min-h-[260px] shadow-sm relative overflow-hidden">
              <DynamicCapabilityArt activeStage={activeStage} className="w-full max-w-[280px]" />
              <div className="absolute top-2.5 left-3 font-mono text-[9px] text-muted-foreground/70 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>STATE // 0{activeStage + 1}.ACTIVE</span>
              </div>
              <div className="absolute top-2.5 right-3 font-mono text-[9px] text-primary font-semibold">
                COORD:02.{activeStage + 1}
              </div>
            </div>

            {/* Content Card */}
            <div className="p-5 sm:p-6 rounded-xl border border-primary/40 bg-card/80 shadow-md space-y-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-mono text-[11.5px] font-semibold text-primary">
                  {activeCap.tag}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40">
                  {activeCap.detail}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
                {activeCap.title}
              </h3>

              <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                {activeCap.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {activeCap.bullets.map((b, bIdx) => (
                  <div
                    key={bIdx}
                    className="flex items-center gap-2 p-2 rounded bg-muted/30 border border-border/50 text-[11px] font-mono text-muted-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: ENGINEERING PRIMITIVES */}
        <section className="flex flex-col space-y-8 border-t border-border/50 pt-16 sm:pt-20">
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
            <SectionCrosshair />
            <span>03 • Engineering Primitives</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 sm:p-6 rounded-lg border border-border/60 bg-card/30 space-y-3 transition-all hover:border-border hover:translate-y-[-2px]">
              <div className="flex items-center gap-2 text-primary">
                <Command className="h-4 w-4" />
                <span className="font-mono text-[11px] font-bold">KEYBOARD FIRST</span>
              </div>
              <h4 className="text-[14.5px] font-semibold text-foreground">Command Palette & Shortcuts</h4>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                Global <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10.5px] font-mono border border-border">⌘K</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10.5px] font-mono border border-border">/</kbd> search and <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10.5px] font-mono border border-border">C</kbd> quick issue creation without touching the mouse.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-lg border border-border/60 bg-card/30 space-y-3 transition-all hover:border-border hover:translate-y-[-2px]">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="h-4 w-4" />
                <span className="font-mono text-[11px] font-bold">ZERO LATENCY</span>
              </div>
              <h4 className="text-[14.5px] font-semibold text-foreground">Authoritative REST API</h4>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                PostgreSQL persistence with SQLAlchemy and Flask, providing strict transaction isolation and sub-millisecond response times.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-lg border border-border/60 bg-card/30 space-y-3 transition-all hover:border-border hover:translate-y-[-2px]">
              <div className="flex items-center gap-2 text-primary">
                <Shield className="h-4 w-4" />
                <span className="font-mono text-[11px] font-bold">SECURE SESSIONS</span>
              </div>
              <h4 className="text-[14.5px] font-semibold text-foreground">OAuth 2.0 & JWT Security</h4>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                GitHub OAuth integration alongside Argon2-hashed password authentication with isolated guest sandboxes.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: FINAL CTA MATHEMATICAL RESOLUTION */}
        <section className="flex flex-col items-center justify-center text-center space-y-6 border-t border-border/50 pt-20 pb-10 relative">
          <div className="flex flex-col items-center justify-center relative">
            <FinalResolutionArt className="mb-2" />
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 text-primary -mt-16 z-10 backdrop-blur-sm">
              <StackedLogo size={20} color="currentColor" />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Experience issue tracking, refined.
          </h2>

          <p className="text-[14.5px] text-muted-foreground max-w-md">
            Start organizing bugs, features, and releases with the speed and focus your team deserves.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
            <Button
              size="lg"
              onClick={() => onOpenAuth('REGISTER')}
              className="text-[13px] h-10 px-6 font-medium rounded-md gap-2 shadow-sm transition-all hover:translate-y-[-1px]"
            >
              <span>Get started with Kaizen</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenAuth('LOGIN')}
              className="text-[13px] h-10 px-5 text-muted-foreground hover:text-foreground rounded-md transition-all"
            >
              Sign in
            </Button>
          </div>
        </section>
      </main>

      {/* Editorial Minimal Footer */}
      <footer className="w-full border-t border-border/50 py-8 bg-background relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">KAIZEN</span>
            <span>•</span>
            <span>Issue tracking, refined.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
              <span>SYSTEMS NORMAL</span>
            </span>
            <span>v2.4.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
