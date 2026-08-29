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
  Sparkles,
  User,
  Mail,
} from 'lucide-react'
import { getDisplayProjectKey } from '../utils/helpers'

interface SidebarProps {
  projects: Project[]
  currentProject: Project | null
  onSelectProject: (proj: Project) => void
  onOpenCreateProject: () => void
  activeView: 'overview' | 'issues' | 'board' | 'milestones' | 'analytics' | 'collaborators' | 'profile' | 'settings'
  onChangeView: (view: 'overview' | 'issues' | 'board' | 'milestones' | 'analytics' | 'collaborators' | 'profile' | 'settings') => void
  issueCount?: number
  memberCount?: number
  labelCount?: number
  pendingInvitationsCount?: number
  onOpenInvitations?: () => void
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
  pendingInvitationsCount = 0,
  onOpenInvitations,
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

        {/* Collaboration & Discovery */}
        <div className="nav-section">
          <div className="nav-section-title">Collaboration</div>
          <div
            className={`nav-item ${activeView === 'collaborators' ? 'active' : ''}`}
            onClick={() => onChangeView('collaborators')}
          >
            <div className="nav-item-left">
              <Sparkles size={15} className="text-emerald-400" />
              <span>Find Collaborators</span>
            </div>
          </div>

          {onOpenInvitations && (
            <div
              className="nav-item"
              onClick={onOpenInvitations}
            >
              <div className="nav-item-left">
                <Mail size={15} className="text-blue-400" />
                <span>Invitations</span>
              </div>
              {pendingInvitationsCount > 0 && (
                <span className="nav-badge" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
                  {pendingInvitationsCount}
                </span>
              )}
            </div>
          )}
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

        {/* Management & Settings Section */}
        <div className="nav-section">
          <div className="nav-section-title">Management</div>
          <div
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => onChangeView('settings')}
          >
            <div className="nav-item-left">
              <Users size={15} />
              <span>Team & Settings</span>
            </div>
            <span className="nav-badge">{memberCount}</span>
          </div>

          <div
            className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
            onClick={() => onChangeView('profile')}
          >
            <div className="nav-item-left">
              <User size={15} />
              <span>My Profile</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => onChangeView('profile')}
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div className="user-avatar">
              {user?.username ? user.username.substring(0, 2) : 'U'}
            </div>
          )}
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.display_name || user?.username || 'Guest'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || `@${user?.username}`}
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
