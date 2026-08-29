import React from 'react'
import { Project, Issue, Activity, Milestone } from '../types'
import { CheckSquare, AlertCircle, Clock, CheckCircle2, TrendingUp, Layers, Target, Activity as ActivityIcon, ArrowRight } from 'lucide-react'
import { getDisplayProjectKey, getIssueDisplayIdentifier, formatRelativeTime, getStatusColor, getPriorityColor } from '../utils/helpers'

interface ProjectOverviewProps {
  project: Project
  issues: Issue[]
  activities: Activity[]
  milestones: Milestone[]
  onSelectIssue: (issue: Issue) => void
  onChangeView: (view: 'overview' | 'issues' | 'board' | 'milestones' | 'analytics' | 'settings') => void
  onOpenCreateIssue: () => void
}

export function ProjectOverview({
  project,
  issues,
  activities,
  milestones,
  onSelectIssue,
  onChangeView,
  onOpenCreateIssue,
}: ProjectOverviewProps) {
  // Compute metric metrics
  const total = issues.length
  const openCount = issues.filter((i) => i.status === 'OPEN').length
  const inProgressCount = issues.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'IN_REVIEW').length
  const resolvedCount = issues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length
  const completionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0

  const highPriorityIssues = issues.filter((i) => (i.priority === 'HIGH' || i.priority === 'URGENT') && (i.status === 'OPEN' || i.status === 'IN_PROGRESS'))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Project Header Banner */}
      <div className="card" style={{ background: 'linear-gradient(180deg, var(--bg-surface-raised) 0%, var(--bg-surface) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="project-key-pill" style={{ fontSize: '12px', padding: '3px 8px' }}>
                {getDisplayProjectKey(project.key)}
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{project.name}</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '600px' }}>
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => onChangeView('board')}>
              <Layers size={14} />
              <span>Kanban Board</span>
            </button>
            <button className="btn btn-primary" onClick={onOpenCreateIssue}>
              <span>+ New Issue</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Total Issues
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{total}</div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', marginBottom: '6px' }}>
            Open
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#60a5fa' }}>{openCount}</div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#facc15', textTransform: 'uppercase', marginBottom: '6px' }}>
            In Progress / Review
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#facc15' }}>{inProgressCount}</div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#4ade80', textTransform: 'uppercase', marginBottom: '6px' }}>
            Resolved & Closed
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#4ade80' }}>{resolvedCount}</div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Completion Rate
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)' }}>{completionRate}%</div>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-surface-raised)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${completionRate}%`, height: '100%', backgroundColor: 'var(--accent-primary)', borderRadius: '2px' }} />
          </div>
        </div>
      </div>

      {/* Main Content Grid: High Priority & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* High Priority Issues */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} className="text-red-400" />
              <span className="card-title">Urgent & High Priority</span>
            </div>
            <button className="btn-ghost btn-icon" onClick={() => onChangeView('issues')} title="View all issues">
              <ArrowRight size={14} />
            </button>
          </div>

          {highPriorityIssues.length === 0 ? (
            <div className="empty-state py-6">
              <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
              <p className="text-xs text-muted">No pending urgent or high priority issues!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {highPriorityIssues.slice(0, 5).map((issue) => {
                const priorityStyles = getPriorityColor(issue.priority)
                return (
                  <div
                    key={issue.id}
                    className="card"
                    style={{
                      padding: '10px 12px',
                      background: 'var(--bg-surface-raised)',
                      cursor: 'pointer',
                    }}
                    onClick={() => onSelectIssue(issue)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span className="issue-identifier-tag">
                        {getIssueDisplayIdentifier(issue.identifier, project.key)}
                      </span>
                      <span
                        className="badge-pill"
                        style={{
                          backgroundColor: priorityStyles.bg,
                          color: priorityStyles.text,
                          borderColor: priorityStyles.border,
                        }}
                      >
                        {issue.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{issue.title}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Project Activity */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ActivityIcon size={16} className="text-blue-400" />
              <span className="card-title">Recent Project Activity</span>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="empty-state py-6">
              <p className="text-xs text-muted">No activity events recorded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activities.slice(0, 5).map((act) => {
                const actorName = act.actor?.username || 'Team Member'
                return (
                  <div
                    key={act.id}
                    style={{
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <div className="user-avatar" style={{ width: '22px', height: '22px', fontSize: '10px' }}>
                      {actorName.substring(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                        <span style={{ fontWeight: 600 }}>{actorName}</span>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {act.action_type.toLowerCase().replace('_', ' ')}
                        </span>
                        {act.new_value && <span style={{ color: 'var(--accent-primary)' }}> "{act.new_value}"</span>}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {formatRelativeTime(act.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
