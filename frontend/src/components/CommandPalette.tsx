import React, { useState, useEffect, useRef } from 'react'
import { Project, Issue, ProjectMember } from '../types'
import { Search, X, Layers, PlusCircle, CheckSquare, BarChart2, Settings, Users, FolderPlus, ArrowRight } from 'lucide-react'
import { getIssueDisplayIdentifier } from '../utils/helpers'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  currentProject: Project | null
  issues: Issue[]
  members: ProjectMember[]
  onSelectProject: (project: Project) => void
  onSelectIssue: (issue: Issue) => void
  onChangeView: (view: 'overview' | 'issues' | 'board' | 'milestones' | 'analytics' | 'settings') => void
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
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Build searchable items
  const cleanQuery = query.toLowerCase().trim()

  // Actions
  const actions = [
    {
      id: 'action-create-issue',
      category: 'Actions',
      label: 'Create New Issue',
      sublabel: 'Shortcut: C',
      icon: <PlusCircle size={15} className="text-blue-400" />,
      run: () => {
        onOpenCreateIssue()
        onClose()
      },
    },
    {
      id: 'action-create-project',
      category: 'Actions',
      label: 'Create New Project',
      sublabel: 'Set up a new workspace',
      icon: <FolderPlus size={15} className="text-purple-400" />,
      run: () => {
        onOpenCreateProject()
        onClose()
      },
    },
    {
      id: 'action-view-overview',
      category: 'Navigation',
      label: 'Go to Project Overview',
      sublabel: 'KPIs & Activity',
      icon: <Layers size={15} />,
      run: () => {
        onChangeView('overview')
        onClose()
      },
    },
    {
      id: 'action-view-issues',
      category: 'Navigation',
      label: 'Go to Issues List',
      sublabel: 'Browse all project issues',
      icon: <CheckSquare size={15} />,
      run: () => {
        onChangeView('issues')
        onClose()
      },
    },
    {
      id: 'action-view-board',
      category: 'Navigation',
      label: 'Go to Kanban Board',
      sublabel: 'Visual status workflow',
      icon: <Layers size={15} />,
      run: () => {
        onChangeView('board')
        onClose()
      },
    },
    {
      id: 'action-view-analytics',
      category: 'Navigation',
      label: 'Go to Analytics',
      sublabel: 'Reports & charts',
      icon: <BarChart2 size={15} />,
      run: () => {
        onChangeView('analytics')
        onClose()
      },
    },
    {
      id: 'action-view-settings',
      category: 'Navigation',
      label: 'Go to Project Settings',
      sublabel: 'Configure project & team',
      icon: <Settings size={15} />,
      run: () => {
        onChangeView('settings')
        onClose()
      },
    },
  ].filter((a) => a.label.toLowerCase().includes(cleanQuery) || a.sublabel.toLowerCase().includes(cleanQuery))

  // Filter Issues
  const filteredIssues = issues
    .filter(
      (i) =>
        i.title.toLowerCase().includes(cleanQuery) ||
        i.identifier.toLowerCase().includes(cleanQuery) ||
        (i.description && i.description.toLowerCase().includes(cleanQuery))
    )
    .slice(0, 5)
    .map((i) => ({
      id: `issue-${i.id}`,
      category: 'Issues',
      label: `${getIssueDisplayIdentifier(i.identifier, currentProject?.key)}: ${i.title}`,
      sublabel: `Status: ${i.status} • Priority: ${i.priority}`,
      icon: <CheckSquare size={15} className="text-emerald-400" />,
      run: () => {
        onSelectIssue(i)
        onClose()
      },
    }))

  // Filter Projects
  const filteredProjects = projects
    .filter(
      (p) =>
        p.name.toLowerCase().includes(cleanQuery) ||
        p.key.toLowerCase().includes(cleanQuery)
    )
    .slice(0, 4)
    .map((p) => ({
      id: `project-${p.id}`,
      category: 'Projects',
      label: p.name,
      sublabel: `Key: ${p.key}`,
      icon: <Layers size={15} className="text-blue-400" />,
      run: () => {
        onSelectProject(p)
        onClose()
      },
    }))

  // Filter Members
  const filteredMembers = members
    .filter(
      (m) =>
        m.user?.username.toLowerCase().includes(cleanQuery) ||
        m.user?.email?.toLowerCase().includes(cleanQuery)
    )
    .slice(0, 3)
    .map((m) => ({
      id: `member-${m.id}`,
      category: 'People',
      label: m.user?.username || 'User',
      sublabel: `Role: ${m.role} • ${m.user?.email || ''}`,
      icon: <Users size={15} className="text-amber-400" />,
      run: () => {
        onChangeView('settings')
        onClose()
      },
    }))

  const allItems = [...actions, ...filteredIssues, ...filteredProjects, ...filteredMembers]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1 < allItems.length ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : allItems.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].run()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card cmd-palette-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="cmd-palette-input-box">
          <Search size={18} className="text-muted" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-palette-input"
            placeholder="Type a command or search issues, projects, people..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
          />
          {query && (
            <button className="btn-ghost btn-icon" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
          <span className="cmd-key">ESC</span>
        </div>

        <div className="cmd-palette-list">
          {allItems.length === 0 ? (
            <div className="empty-state py-6">
              <p className="text-muted text-xs">No matching commands or resources found.</p>
            </div>
          ) : (
            allItems.map((item, idx) => (
              <div
                key={item.id}
                className={`cmd-palette-item ${idx === selectedIndex ? 'active' : ''}`}
                onClick={() => item.run()}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.icon}
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.sublabel}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {item.category}
                  </span>
                  <ArrowRight size={12} className="text-muted" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
