import React, { useState } from 'react'
import { Project } from '../types'
import { useAuth } from '../context/AuthContext'
import {
  Layers,
  CheckSquare,
  BarChart2,
  Users,
  Plus,
  ChevronDown,
  LogOut,
  Target,
  LayoutDashboard,
  Sparkles,
  User as UserIcon,
  Mail,
} from 'lucide-react'
import { getDisplayProjectKey } from '../utils/helpers'
import { StackedLogo } from './StackedLogo'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

export type ActiveView =
  | 'overview'
  | 'issues'
  | 'board'
  | 'milestones'
  | 'analytics'
  | 'collaborators'
  | 'profile'
  | 'settings'

interface SidebarProps {
  projects: Project[]
  currentProject: Project | null
  onSelectProject: (proj: Project) => void
  onOpenCreateProject: () => void
  activeView: ActiveView
  onChangeView: (view: ActiveView) => void
  issueCount?: number
  memberCount?: number
  labelCount?: number
  pendingInvitationsCount?: number
  onOpenInvitations?: () => void
  onNavigateMobile?: () => void
}

export function SidebarContent({
  projects,
  currentProject,
  onSelectProject,
  onOpenCreateProject,
  activeView,
  onChangeView,
  issueCount = 0,
  memberCount = 0,
  pendingInvitationsCount = 0,
  onOpenInvitations,
  onNavigateMobile,
}: SidebarProps) {
  const { user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleNav = (view: ActiveView) => {
    onChangeView(view)
    if (onNavigateMobile) onNavigateMobile()
  }

  const initials = user?.display_name
    ? user.display_name.substring(0, 2).toUpperCase()
    : user?.username
    ? user.username.substring(0, 2).toUpperCase()
    : 'KZ'

  return (
    <div className="flex flex-col h-full bg-sidebar select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3.5 h-12 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/10 border border-primary/30 text-primary">
            <StackedLogo size={14} color="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-[13px] text-foreground leading-tight">
              KAIZEN
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
              Issue tracking, refined.
            </span>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <div className="p-2 border-b border-sidebar-border/60 relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent hover:border-sidebar-border text-[12px] text-foreground transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-mono font-semibold shrink-0 border border-primary/30">
              {currentProject ? getDisplayProjectKey(currentProject.key) : 'NONE'}
            </span>
            <span className="truncate font-medium">
              {currentProject ? currentProject.name : 'Select Project'}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
        </button>

        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute left-2 right-2 top-full mt-1 z-50 rounded-md border border-border bg-popover p-1 shadow-xl animate-in fade-in-0 zoom-in-95 max-h-64 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Projects ({projects.length})
              </div>
              {projects.map((proj) => {
                const isSelected = currentProject?.id === proj.id
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => {
                      onSelectProject(proj)
                      setIsDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-2 py-1.5 rounded text-[12px] text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary/15 text-primary font-medium'
                        : 'text-popover-foreground hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-1 py-0.2 rounded bg-muted text-[10px] font-mono text-muted-foreground shrink-0">
                        {getDisplayProjectKey(proj.key)}
                      </span>
                      <span className="truncate">{proj.name}</span>
                    </div>
                  </button>
                )
              })}
              <div className="pt-1 mt-1 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false)
                    onOpenCreateProject()
                  }}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-[12px] text-primary hover:bg-primary/10 transition-colors cursor-pointer font-medium"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create New Project</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Workspace Section */}
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Workspace
          </div>

          <button
            type="button"
            onClick={() => handleNav('overview')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors cursor-pointer',
              activeView === 'overview'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>Overview</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNav('issues')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors cursor-pointer',
              activeView === 'issues'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>Issues</span>
            </div>
            {issueCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted/60 text-muted-foreground">
                {issueCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNav('board')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors cursor-pointer',
              activeView === 'board'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>Kanban Board</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleNav('analytics')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors cursor-pointer',
              activeView === 'analytics'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <div className="flex items-center gap-2.5">
              <BarChart2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>Analytics</span>
            </div>
          </button>
        </div>

        {/* Collaboration */}
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Collaboration
          </div>

          <button
            type="button"
            onClick={() => handleNav('collaborators')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors cursor-pointer',
              activeView === 'collaborators'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>Find Collaborators</span>
            </div>
          </button>

          {onOpenInvitations && (
            <button
              type="button"
              onClick={() => {
                onOpenInvitations()
                if (onNavigateMobile) onNavigateMobile()
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12.5px] text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span>Invitations</span>
              </div>
              {pendingInvitationsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary text-primary-foreground animate-pulse">
                  {pendingInvitationsCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Project Section */}
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Project
          </div>

          <button
            type="button"
            onClick={() => handleNav('milestones')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors cursor-pointer',
              activeView === 'milestones'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Target className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>Milestones</span>
            </div>
          </button>
        </div>

        {/* Management */}
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Management
          </div>

          <button
            type="button"
            onClick={() => handleNav('settings')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors cursor-pointer',
              activeView === 'settings'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>Team & Settings</span>
            </div>
            {memberCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted/60 text-muted-foreground">
                {memberCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleNav('profile')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors cursor-pointer',
              activeView === 'profile'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <div className="flex items-center gap-2.5">
              <UserIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>My Profile</span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer User Tile */}
      <div className="p-2 border-t border-sidebar-border flex items-center justify-between gap-1.5 shrink-0 bg-sidebar-background">
        <button
          type="button"
          onClick={() => handleNav('profile')}
          title="View & edit your profile"
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer text-left min-w-0 flex-1',
            activeView === 'profile'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'hover:bg-sidebar-accent/60 text-sidebar-foreground'
          )}
        >
          <Avatar className="h-6 w-6 shrink-0">
            {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.username} />}
            <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="text-[12px] font-medium text-foreground truncate leading-tight">
              {user?.display_name || user?.username || 'Developer'}
            </div>
            <div className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">
              {user?.email || `@${user?.username}`}
            </div>
          </div>
        </button>

        <Button
          variant="ghost"
          size="iconSm"
          title="Sign Out"
          onClick={() => logout()}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function Sidebar(props: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0 w-56 shrink-0 z-30">
      <SidebarContent {...props} />
    </aside>
  )
}
