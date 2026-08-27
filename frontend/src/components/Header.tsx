import React, { useState, useEffect } from 'react'
import { Project } from '../types'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { Plus, Database, CheckCircle2, AlertTriangle, LogOut, User as UserIcon } from 'lucide-react'

interface HeaderProps {
  currentProject: Project | null
  onOpenCreateIssue: () => void
  activeView: string
}

export function Header({ currentProject, onOpenCreateIssue, activeView }: HeaderProps) {
  const { user, logout } = useAuth()
  const [dbStatus, setDbStatus] = useState<'checking' | 'reachable' | 'unavailable'>('checking')

  useEffect(() => {
    let mounted = true
    async function checkDb() {
      try {
        const res = await api.health.checkDb()
        if (mounted) {
          setDbStatus(res.status === 'ok' ? 'reachable' : 'unavailable')
        }
      } catch {
        if (mounted) {
          setDbStatus('unavailable')
        }
      }
    }
    checkDb()
    const timer = setInterval(checkDb, 30000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  const viewTitles: Record<string, string> = {
    issues: 'Issue Tracker',
    board: 'Kanban Board',
    analytics: 'Analytics & Reports',
    settings: 'Project Settings & Team',
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="view-title-group">
          <h1 className="view-title">{viewTitles[activeView] || 'Issues'}</h1>
          {currentProject && (
            <span className="project-badge">
              {currentProject.key} • {currentProject.name}
            </span>
          )}
        </div>
      </div>

      <div className="header-right">
        <div className={`db-health-pill ${dbStatus}`} title={`Database: ${dbStatus}`}>
          <Database size={13} />
          <span>{dbStatus === 'reachable' ? 'Postgres Live' : dbStatus === 'checking' ? 'Connecting...' : 'DB Offline'}</span>
          {dbStatus === 'reachable' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
        </div>

        {currentProject && (
          <button className="btn-primary btn-sm" onClick={onOpenCreateIssue}>
            <Plus size={15} />
            <span>New Issue</span>
          </button>
        )}

        <div className="user-menu">
          <div className="user-avatar" title={user?.email}>
            {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon size={14} />}
          </div>
          <span className="username">{user?.username}</span>
          <button className="btn-icon" onClick={logout} title="Sign Out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}
