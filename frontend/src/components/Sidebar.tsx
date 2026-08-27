import React from 'react'
import { Project } from '../types'
import {
  Layers,
  Kanban,
  BarChart3,
  Settings,
  PlusCircle,
  FolderKanban,
  ChevronDown,
} from 'lucide-react'

interface SidebarProps {
  projects: Project[]
  currentProject: Project | null
  onSelectProject: (project: Project) => void
  onOpenCreateProject: () => void
  activeView: string
  onChangeView: (view: string) => void
}

export function Sidebar({
  projects,
  currentProject,
  onSelectProject,
  onOpenCreateProject,
  activeView,
  onChangeView,
}: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">B</div>
        <div className="brand-text">
          <h2>Bugzilla</h2>
          <span className="brand-version">v2.0 Redux</span>
        </div>
      </div>

      <div className="project-selector-section">
        <div className="section-label">PROJECT</div>
        {projects.length > 0 ? (
          <div className="project-dropdown-wrapper">
            <select
              className="project-select"
              value={currentProject?.id || ''}
              onChange={(e) => {
                const selected = projects.find((p) => p.id === Number(e.target.value))
                if (selected) onSelectProject(selected)
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.key}] {p.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="dropdown-arrow" />
          </div>
        ) : (
          <div className="no-projects-hint">No projects found</div>
        )}

        <button className="btn-secondary btn-sm full-width mt-2" onClick={onOpenCreateProject}>
          <PlusCircle size={14} />
          <span>New Project</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="section-label">WORKSPACE</div>
        <button
          className={`nav-btn ${activeView === 'issues' ? 'active' : ''}`}
          onClick={() => onChangeView('issues')}
          disabled={!currentProject}
        >
          <Layers size={17} />
          <span>Issues</span>
          {currentProject?.issue_count !== undefined && (
            <span className="nav-badge">{currentProject.issue_count}</span>
          )}
        </button>

        <button
          className={`nav-btn ${activeView === 'board' ? 'active' : ''}`}
          onClick={() => onChangeView('board')}
          disabled={!currentProject}
        >
          <Kanban size={17} />
          <span>Board</span>
        </button>

        <button
          className={`nav-btn ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => onChangeView('analytics')}
          disabled={!currentProject}
        >
          <BarChart3 size={17} />
          <span>Analytics</span>
        </button>

        <button
          className={`nav-btn ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => onChangeView('settings')}
          disabled={!currentProject}
        >
          <Settings size={17} />
          <span>Project Settings</span>
        </button>
      </nav>

      {currentProject && (
        <div className="sidebar-footer">
          <div className="project-info-card">
            <div className="info-row">
              <span className="info-label">Role:</span>
              <span className="info-value role-badge">{currentProject.role || 'MEMBER'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Key:</span>
              <span className="info-value font-mono">{currentProject.key}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
