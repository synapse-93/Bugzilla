import React, { useEffect } from 'react'
import { Project, Issue, ProjectMember } from '../types'
import {
  Layers,
  PlusCircle,
  CheckSquare,
  BarChart2,
  Settings,
  Users,
  FolderPlus,
  ArrowRight,
  Sparkles,
  Target,
  User as UserIcon,
} from 'lucide-react'
import { getIssueDisplayIdentifier } from '../utils/helpers'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from './ui/command'
import { ActiveView } from './Sidebar'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  currentProject: Project | null
  issues: Issue[]
  members: ProjectMember[]
  onSelectProject: (project: Project) => void
  onSelectIssue: (issue: Issue) => void
  onChangeView: (view: ActiveView) => void
  onOpenCreateIssue: () => void
  onOpenCreateProject: () => void
}

export function CommandPalette({
  isOpen,
  onClose,
  projects,
  currentProject,
  issues,
  members,
  onSelectProject,
  onSelectIssue,
  onChangeView,
  onOpenCreateIssue,
  onOpenCreateProject,
}: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // Trigger open
        }
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [isOpen, onClose])

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <CommandInput placeholder="Search issues, switch projects, or jump to views..." />
      <CommandList>
        <CommandEmpty>No matching actions, issues, or projects found.</CommandEmpty>

        {/* Quick Actions Group */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              onOpenCreateIssue()
              onClose()
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4 text-primary" />
            <span>Create New Issue</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenCreateProject()
              onClose()
            }}
          >
            <FolderPlus className="mr-2 h-4 w-4 text-purple-400" />
            <span>Create New Project</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation Group */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              onChangeView('overview')
              onClose()
            }}
          >
            <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Project Overview</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onChangeView('issues')
              onClose()
            }}
          >
            <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Issues List</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onChangeView('board')
              onClose()
            }}
          >
            <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Kanban Board</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onChangeView('milestones')
              onClose()
            }}
          >
            <Target className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Milestones</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onChangeView('analytics')
              onClose()
            }}
          >
            <BarChart2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Analytics & Metrics</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onChangeView('collaborators')
              onClose()
            }}
          >
            <Sparkles className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Find Collaborators</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onChangeView('settings')
              onClose()
            }}
          >
            <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Team & Settings</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onChangeView('profile')
              onClose()
            }}
          >
            <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>My Profile</span>
          </CommandItem>
        </CommandGroup>

        {/* Recent Issues Group */}
        {issues.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Issues">
              {issues.slice(0, 6).map((i) => (
                <CommandItem
                  key={i.id}
                  onSelect={() => {
                    onSelectIssue(i)
                    onClose()
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[11px] text-primary shrink-0">
                      {getIssueDisplayIdentifier(i.identifier, currentProject?.key)}
                    </span>
                    <span className="truncate">{i.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono ml-2 shrink-0">
                    {i.status}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Projects Group */}
        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  onSelect={() => {
                    onSelectProject(p)
                    onClose()
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                      {p.key}
                    </span>
                    <span className="truncate font-medium">{p.name}</span>
                  </div>
                  {currentProject?.id === p.id && (
                    <span className="text-[10px] text-primary font-medium">Active</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
