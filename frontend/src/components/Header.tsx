import React, { useState, useEffect } from 'react'
import { Project } from '../types'
import { Plus, Search, Bell, Database } from 'lucide-react'
import { api } from '../api/client'
import { getDisplayProjectKey } from '../utils/helpers'

interface HeaderProps {
  currentProject: Project | null
  activeView: string
  onOpenCreateIssue: () => void
  onOpenCommandPalette: () => void
  onOpenNotifications: () => void
  unreadNotificationsCount?: number
}

export function Header({
  currentProject,
  activeView,
  onOpenCreateIssue,
  onOpenCommandPalette,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: HeaderProps) {
  const [dbStatus, setDbStatus] = useState<'reachable' | 'degraded' | 'checking'>('checking')

  useEffect(() => {
    let mounted = true
    async function checkDb() {
      try {
        const res = await api.health.checkDb()
        if (mounted) {
          setDbStatus(res.status === 'ok' && res.database === 'reachable' ? 'reachable' : 'degraded')
        }
      } catch {
        if (mounted) setDbStatus('degraded')
      }
    }
    checkDb()
    const interval = setInterval(checkDb, 45000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <header className="app-header">
      {/* Breadcrumbs */}
      <div className="header-left">
        <div className="breadcrumbs">
          <span className="breadcrumb-project">
            {currentProject ? `${currentProject.name} (${getDisplayProjectKey(currentProject.key)})` : 'Bugzilla'}
          </span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">
            {activeView === 'overview'
              ? 'Overview'
              : activeView === 'issues'
              ? 'Issues'
              : activeView === 'board'
              ? 'Kanban Board'
              : activeView === 'milestones'
              ? 'Milestones'
              : activeView === 'analytics'
              ? 'Analytics'
              : 'Settings'}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="header-right">
        {/* Command Palette Button */}
        <button
          className="cmd-palette-trigger"
          onClick={onOpenCommandPalette}
          title="Search or jump to (Cmd+K)"
        >
          <Search size={14} />
          <span>Search or jump to...</span>
          <span className="cmd-key">⌘K</span>
        </button>

        {/* Database Status Dot */}
        <div
          className="db-status-pill"
          title={`Database Connection: ${dbStatus === 'reachable' ? 'PostgreSQL Neon Online' : 'Checking/Degraded'}`}
        >
          <span className={`db-status-dot ${dbStatus}`} />
          <Database size={12} className="text-muted" />
          <span style={{ fontSize: '11px' }}>{dbStatus === 'reachable' ? 'DB Online' : 'Connecting'}</span>
        </div>

        {/* Notifications Bell */}
        <button
          className="btn-secondary btn-icon"
          onClick={onOpenNotifications}
          title="Recent Activity Notifications"
          style={{ position: 'relative' }}
        >
          <Bell size={15} />
          {unreadNotificationsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '9999px',
                backgroundColor: 'var(--accent-primary)',
              }}
            />
          )}
        </button>

        {/* New Issue Button */}
        {currentProject && (
          <button
            className="btn btn-primary"
            onClick={onOpenCreateIssue}
            title="Create new issue (Shortcut: C)"
          >
            <Plus size={15} />
            <span>New Issue</span>
          </button>
        )}
      </div>
    </header>
  )
}
