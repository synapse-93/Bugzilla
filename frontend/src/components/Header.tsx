import React from 'react'
import { Project } from '../types'
import { Plus, Bell, Search, Menu, Command as CommandIcon } from 'lucide-react'
import { Button } from './ui/button'
import { ActiveView } from './Sidebar'
import { StackedLogo } from './StackedLogo'

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
    <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-3 md:px-6 border-b border-border bg-background/95 backdrop-blur-sm shrink-0">
      {/* Left side: Mobile Menu Button & View Title / Breadcrumbs */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onOpenMobileMenu && (
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onOpenMobileMenu}
            className="md:hidden text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}

        {/* Mobile Mini Logo */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <div className="flex items-center justify-center h-5 w-5 rounded bg-primary/15 text-primary">
            <StackedLogo size={12} color="currentColor" />
          </div>
          <span className="font-bold text-[12px] tracking-tight">KAIZEN</span>
        </div>

        {/* Breadcrumb / Title */}
        <div className="hidden sm:flex items-center gap-1.5 text-[12px] min-w-0">
          {currentProject ? (
            <>
              <span className="text-muted-foreground truncate max-w-[120px] md:max-w-[200px]">
                {currentProject.name}
              </span>
              <span className="text-muted-foreground/50">/</span>
            </>
          ) : null}
          <span className="font-medium text-foreground truncate">
            {viewLabels[activeView] || 'Kaizen'}
          </span>
        </div>
      </div>

      {/* Right side: Command Palette, Notifications, Create Issue */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md border border-border/80 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground text-[12px] transition-colors cursor-pointer"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search or jump to...</span>
          <kbd className="ml-2 pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground border border-border">
            {cmdKey}
          </kbd>
        </button>

        {/* Mobile Search Icon */}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={onOpenCommandPalette}
          className="sm:hidden text-muted-foreground hover:text-foreground"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          title="Notifications & Activity"
        >
          <Bell className="h-3.5 w-3.5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
        </button>

        {/* Quick New Issue Action */}
        <Button
          size="sm"
          onClick={onOpenCreateIssue}
          disabled={!currentProject}
          className="gap-1.5 h-7 text-[12px] font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">New Issue</span>
        </Button>
      </div>
    </header>
  )
}
