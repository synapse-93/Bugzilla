import React, { useState } from 'react'
import { Project } from '../types'
import { useAuth } from '../context/AuthContext'
import {
  Layers,
  CheckSquare,
  BarChart2,
  Settings,
  Users,
  Tag,
  Plus,
  ChevronDown,
  LogOut,
  Target,
  Bug,
  LayoutDashboard,
} from 'lucide-react'
import { getDisplayProjectKey } from '../utils/helpers'

interface SidebarProps {
  projects: Project[]
  currentProject: Project | null
  onSelectProject: (proj: Project) => void
  onOpenCreateProject: () => void
  activeView: 'overview' | 'issues' | 'board' | 'milestones' | 'analytics' | 'settings'
  onChangeView: (view: 'overview' | 'issues' | 'board' | 'milestones' | 'analytics' | 'settings') => void
  issueCount?: number
  memberCount?: number
  labelCount?: number
}

export function Sidebar({
  projects,
  currentProject,
  onSelectProject,
  onOpenCreateProject,
  activeView,
  onChangeView,
  issueCount = 0,
  memberCount = 0,
  labelCount = 0,
}: SidebarProps) {
  const { user, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <div className="brand-icon">
            <Bug size={16} />
          </div>
          <span>Bugzilla</span>
        </div>
      </div>

      {/* Project Selector */}
      <div className="project-selector-container">
        <button
          className="project-selector-btn"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <span className="project-key-pill">
              {currentProject ? getDisplayProjectKey(currentProject.key) : 'NONE'}
            </span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentProject ? currentProject.name : 'Select Project'}
            </span>
          </div>
          <ChevronDown size={14} className="text-muted" />
        </button>

        {isDropdownOpen && (
          <div className="project-dropdown-menu">
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
              Projects
            </div>
            {projects.map((proj) => (
              <div
                key={proj.id}
                className={`project-dropdown-item ${currentProject?.id === proj.id ? 'active' : ''}`}
                onClick={() => {
                  onSelectProject(proj)
                  setIsDropdownOpen(false)
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="project-key-pill">{getDisplayProjectKey(proj.key)}</span>
                  <span>{proj.name}</span>
                </div>
              </div>
            ))}
            <div
              className="project-dropdown-item"
              style={{ color: 'var(--accent-primary)', marginTop: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}
              onClick={() => {
                setIsDropdownOpen(false)
                onOpenCreateProject()
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={14} />
                <span>Create New Project</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="sidebar-nav">
        {/* Workspace Section */}
        <div className="nav-section">
          <div className="nav-section-title">Workspace</div>
          <div
            className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => onChangeView('overview')}
          >
            <div className="nav-item-left">
              <LayoutDashboard size={15} />
              <span>Overview</span>
            </div>
          </div>

          <div
            className={`nav-item ${activeView === 'issues' ? 'active' : ''}`}
            onClick={() => onChangeView('issues')}
          >
            <div className="nav-item-left">
              <CheckSquare size={15} />
              <span>Issues</span>
            </div>
            <span className="nav-badge">{issueCount}</span>
          </div>

          <div
            className={`nav-item ${activeView === 'board' ? 'active' : ''}`}
            onClick={() => onChangeView('board')}
          >
            <div className="nav-item-left">
              <Layers size={15} />
              <span>Kanban Board</span>
            </div>
          </div>

          <div
            className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`}
            onClick={() => onChangeView('analytics')}
          >
            <div className="nav-item-left">
              <BarChart2 size={15} />
              <span>Analytics</span>
            </div>
          </div>
        </div>

        {/* Project Section */}
        <div className="nav-section">
          <div className="nav-section-title">Project</div>
          <div
            className={`nav-item ${activeView === 'milestones' ? 'active' : ''}`}
            onClick={() => onChangeView('milestones')}
          >
            <div className="nav-item-left">
              <Target size={15} />
              <span>Milestones</span>
            </div>
          </div>
        </div>

        {/* Management Section */}
        <div className="nav-section">
          <div className="nav-section-title">Management</div>
          <div
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => onChangeView('settings')}
          >
            <div className="nav-item-left">
              <Users size={15} />
              <span>Team Members</span>
            </div>
            <span className="nav-badge">{memberCount}</span>
          </div>

          <div
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => onChangeView('settings')}
          >
            <div className="nav-item-left">
              <Tag size={15} />
              <span>Labels</span>
            </div>
            <span className="nav-badge">{labelCount}</span>
          </div>

          <div
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => onChangeView('settings')}
          >
            <div className="nav-item-left">
              <Settings size={15} />
              <span>Settings</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div className="user-avatar">
            {user?.username ? user.username.substring(0, 2) : 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.username || 'Guest'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || ''}
            </div>
          </div>
        </div>

        <button
          className="btn-ghost btn-icon"
          title="Sign Out"
          onClick={() => logout()}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
