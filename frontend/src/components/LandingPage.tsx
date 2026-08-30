import React from 'react'
import { StackedLogo } from './StackedLogo'
import { EditorialHeroArt, WorkflowTrajectoryArt, SectionCrosshair } from './AbstractGeometry'
import { Button } from './ui/button'
import { ArrowRight, Sparkles, Command, Shield, Zap, GitPullRequest } from 'lucide-react'

interface LandingPageProps {
  onOpenAuth: (mode?: 'LOGIN' | 'REGISTER' | 'GUEST') => void
}

export function LandingPage({ onOpenAuth }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 flex flex-col items-center">
      {/* Editorial Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/10 border border-primary/30 text-primary">
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
              className="text-[12.5px] text-muted-foreground hover:text-foreground h-8 px-3"
            >
              Sign in
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenAuth('REGISTER')}
              className="text-[12.5px] h-8 px-3.5 font-medium rounded-md"
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Main Long-Scroll Container */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col space-y-28 sm:space-y-36 py-12 sm:py-20">
        
        {/* SECTION 1: HERO */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-4 sm:pt-10">
          <div className="lg:col-span-7 flex flex-col space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/80 bg-card/40 w-fit text-[11px] font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Issue tracking, refined.</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.08]">
              Issue tracking,<br />
              <span className="text-muted-foreground/90">refined.</span>
            </h1>

            <p className="text-[14.5px] sm:text-[15.5px] text-muted-foreground leading-relaxed max-w-lg">
              A fast, minimalist workspace for engineering teams to track issues, coordinate workflows, and ship software with absolute clarity.
            </p>

            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <Button
                size="lg"
                onClick={() => onOpenAuth('REGISTER')}
                className="text-[13px] h-10 px-5 font-medium gap-2 rounded-md"
              >
                <span>Get started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onOpenAuth('LOGIN')}
                className="text-[13px] h-10 px-4 text-muted-foreground hover:text-foreground rounded-md"
              >
                Sign in
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onOpenAuth('GUEST')}
                className="text-[12px] h-10 px-3 text-muted-foreground/80 hover:text-foreground font-mono gap-1.5 rounded-md"
              >
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>Instant guest sandbox</span>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 flex items-center justify-center relative">
            <EditorialHeroArt className="w-full" />
          </div>
        </section>

        {/* SECTION 2: WHAT KAIZEN DOES */}
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

        {/* SECTION 3: WORKFLOW */}
        <section className="flex flex-col space-y-8 border-t border-border/50 pt-16 sm:pt-20">
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
            <SectionCrosshair />
            <span>01 • Workflow Engine</span>
          </div>

          <div className="space-y-4">
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

        {/* SECTION 4: CAPABILITIES */}
        <section className="flex flex-col space-y-10 border-t border-border/50 pt-16 sm:pt-20">
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
            <SectionCrosshair />
            <span>02 • Capabilities</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-12">
            {/* Capability 01 */}
            <div className="space-y-2.5 pb-6 border-b border-border/40">
              <span className="font-mono text-[12px] font-semibold text-primary">01  ISSUES</span>
              <h3 className="text-lg font-bold tracking-tight text-foreground">Track, prioritize and organize work.</h3>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                Structured canonical project keys, multi-field filters, instant search, and custom priority flags for complete issue triage.
              </p>
            </div>

            {/* Capability 02 */}
            <div className="space-y-2.5 pb-6 border-b border-border/40">
              <span className="font-mono text-[12px] font-semibold text-primary">02  WORKFLOW</span>
              <h3 className="text-lg font-bold tracking-tight text-foreground">Move issues from open to resolution.</h3>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                Interactive Kanban board with drag-and-drop state progression, optimistic updates, and instant status rollback guards.
              </p>
            </div>

            {/* Capability 03 */}
            <div className="space-y-2.5 pb-6 border-b border-border/40">
              <span className="font-mono text-[12px] font-semibold text-primary">03  COLLABORATION</span>
              <h3 className="text-lg font-bold tracking-tight text-foreground">Comments, teams, invitations and profiles.</h3>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                Full discussion threads with Markdown editing, role-based project permissions, and in-app developer talent discovery.
              </p>
            </div>

            {/* Capability 04 */}
            <div className="space-y-2.5 pb-6 border-b border-border/40">
              <span className="font-mono text-[12px] font-semibold text-primary">04  INSIGHT</span>
              <h3 className="text-lg font-bold tracking-tight text-foreground">Analytics, activity and project visibility.</h3>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                Live audit streams, real resolution velocity, milestone target deadlines, and complete team visibility.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: DEVELOPER-FOCUSED */}
        <section className="flex flex-col space-y-8 border-t border-border/50 pt-16 sm:pt-20">
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
            <SectionCrosshair />
            <span>03 • Engineering Primitives</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-lg border border-border/60 bg-card/30 space-y-2.5">
              <div className="flex items-center gap-2 text-primary">
                <Command className="h-4 w-4" />
                <span className="font-mono text-[11px] font-bold">KEYBOARD FIRST</span>
              </div>
              <h4 className="text-[14px] font-semibold text-foreground">Command Palette & Shortcuts</h4>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                Global <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10.5px] font-mono border border-border">⌘K</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10.5px] font-mono border border-border">/</kbd> search and <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10.5px] font-mono border border-border">C</kbd> quick issue creation without touching the mouse.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-border/60 bg-card/30 space-y-2.5">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="h-4 w-4" />
                <span className="font-mono text-[11px] font-bold">ZERO LATENCY</span>
              </div>
              <h4 className="text-[14px] font-semibold text-foreground">Authoritative REST API</h4>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                PostgreSQL persistence with SQLAlchemy and Flask, providing strict transaction isolation and sub-millisecond response times.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-border/60 bg-card/30 space-y-2.5">
              <div className="flex items-center gap-2 text-primary">
                <Shield className="h-4 w-4" />
                <span className="font-mono text-[11px] font-bold">SECURE SESSIONS</span>
              </div>
              <h4 className="text-[14px] font-semibold text-foreground">OAuth 2.0 & JWT Security</h4>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                Google & GitHub OAuth integration alongside Argon2-hashed password authentication with isolated guest sandboxes.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: FINAL CTA */}
        <section className="flex flex-col items-center justify-center text-center space-y-6 border-t border-border/50 pt-20 pb-8">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 text-primary">
            <StackedLogo size={20} color="currentColor" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Experience issue tracking, refined.
          </h2>

          <p className="text-[14.5px] text-muted-foreground max-w-md">
            Start organizing bugs, features, and releases with the speed and focus your team deserves.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={() => onOpenAuth('REGISTER')}
              className="text-[13px] h-10 px-6 font-medium rounded-md gap-2"
            >
              <span>Get started with Kaizen</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </section>
      </main>

      {/* Editorial Minimal Footer */}
      <footer className="w-full border-t border-border/50 py-8 bg-background">
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
