import React from 'react'
import { Project } from '../types'
import { Plus, Bell, Search, Menu } from 'lucide-react'
import { Button } from './ui/button'
import { ActiveView } from './Sidebar'
import { StackedLogo } from './StackedLogo'
import { getDisplayProjectKey } from '../utils/helpers'

interface HeaderProps {
  currentProject: Project | null
  activeView: ActiveView
  onOpenCreateIssue: () => void
  onOpenCommandPalette: () => void
  onOpenNotifications: () => void
  onOpenMobileMenu?: () => void
  unreadNotificationsCount?: number
}

const viewLabels: Record<ActiveView, string> = {
  overview: 'Dashboard Overview',
  issues: 'All Issues',
  board: 'Kanban Workflow',
  milestones: 'Project Milestones',
  analytics: 'Metrics & Analytics',
  collaborators: 'Collaborator Discovery',
  settings: 'Team & Project Settings',
  profile: 'My Developer Profile',
}

export function Header({
  currentProject,
  activeView,
  onOpenCreateIssue,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenMobileMenu,
  unreadNotificationsCount = 0,
}: HeaderProps) {
  const isMac = typeof window !== 'undefined' && navigator.userAgent.toUpperCase().indexOf('MAC') >= 0
  const cmdKey = isMac ? '⌘K' : 'Ctrl+K'

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 lg:px-8 border-b border-border/60 bg-background/80 backdrop-blur-md shrink-0 transition-colors">
      {/* Left side: Mobile Menu Button & View Title / Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onOpenMobileMenu}
            className="md:hidden text-muted-foreground hover:text-foreground shrink-0 h-8 w-8"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}

        {/* Mobile Mini Logo */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/10 border border-primary/30 text-primary">
            <StackedLogo size={13} color="currentColor" />
          </div>
          <span className="font-bold text-[12.5px] tracking-tight text-foreground">KAIZEN</span>
        </div>

        {/* Breadcrumb / Title */}
        <div className="hidden sm:flex items-center gap-2 text-[12.5px] min-w-0">
          {currentProject ? (
            <>
              <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-mono font-semibold border border-primary/25 shrink-0">
                {getDisplayProjectKey(currentProject.key)}
              </span>
              <span className="text-foreground font-medium truncate max-w-[140px] md:max-w-[220px]">
                {currentProject.name}
              </span>
              <span className="text-muted-foreground/40 font-mono">/</span>
            </>
          ) : null}
          <span className="text-muted-foreground truncate">
            {viewLabels[activeView] || 'Kaizen'}
          </span>
        </div>
      </div>

      {/* Right side: Coherent Control Group (Search, Notifications, Create Issue) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden sm:inline-flex items-center gap-2 h-8 px-3 rounded-md border border-border/70 bg-card/40 hover:bg-card/80 hover:border-border text-muted-foreground hover:text-foreground text-[12px] transition-all cursor-pointer"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search or jump to...</span>
          <kbd className="pointer-events-none inline-flex h-4.5 items-center px-1.5 font-mono text-[9.5px] text-muted-foreground bg-background rounded border border-border/70 ml-1">
            {cmdKey}
          </kbd>
        </button>

        {/* Mobile Search Icon */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="sm:hidden h-8 w-8 inline-flex items-center justify-center rounded-md border border-border/70 bg-card/40 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/70 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card/80 hover:border-border transition-colors cursor-pointer"
          title="Notifications & Activity"
        >
          <Bell className="h-3.5 w-3.5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
        </button>

        {/* Quick New Issue Action (+ C) */}
        <button
          type="button"
          onClick={onOpenCreateIssue}
          disabled={!currentProject}
          className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-[12px] font-medium shadow-sm transition-all hover:translate-y-[-0.5px] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          title="Create New Issue (C)"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">New Issue</span>
          <kbd className="hidden md:inline-flex pointer-events-none h-4 items-center px-1 font-mono text-[9px] bg-primary-foreground/20 text-primary-foreground rounded">
            C
          </kbd>
        </button>
      </div>
    </header>
  )
}

