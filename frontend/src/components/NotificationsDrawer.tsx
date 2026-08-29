import React from 'react'
import { Activity, Issue } from '../types'
import { Bell, Check, MessageSquare, Tag, UserCheck, X, Activity as ActivityIcon } from 'lucide-react'
import { formatRelativeTime } from '../utils/helpers'

interface NotificationsDrawerProps {
  isOpen: boolean
  onClose: () => void
  activities: Activity[]
  issues: Issue[]
  onSelectIssue: (issue: Issue) => void
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  activities,
  issues,
  onSelectIssue,
}: NotificationsDrawerProps) {
  if (!isOpen) return null

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'COMMENT_ADDED':
      case 'COMMENT_UPDATED':
        return <MessageSquare size={14} className="text-blue-400" />
      case 'ASSIGNED':
      case 'UNASSIGNED':
        return <UserCheck size={14} className="text-emerald-400" />
      case 'LABEL_ADDED':
      case 'LABEL_REMOVED':
        return <Tag size={14} className="text-purple-400" />
      case 'STATUS_CHANGED':
        return <ActivityIcon size={14} className="text-amber-400" />
      default:
        return <Bell size={14} className="text-muted" />
    }
  }

  const getActionText = (act: Activity) => {
    const actorName = act.actor?.username || 'Team Member'
    switch (act.action_type) {
      case 'CREATED':
        return `${actorName} created this issue`
      case 'STATUS_CHANGED':
        return `${actorName} changed status to ${act.new_value}`
      case 'ASSIGNED':
        return `${actorName} was assigned`
      case 'UNASSIGNED':
        return `${actorName} unassigned this issue`
      case 'PRIORITY_CHANGED':
        return `${actorName} changed priority to ${act.new_value}`
      case 'SEVERITY_CHANGED':
        return `${actorName} changed severity to ${act.new_value}`
      case 'LABEL_ADDED':
        return `${actorName} added label "${act.new_value}"`
      case 'LABEL_REMOVED':
        return `${actorName} removed label "${act.old_value}"`
      case 'COMMENT_ADDED':
        return `${actorName} commented: "${act.new_value || ''}"`
      case 'COMMENT_UPDATED':
        return `${actorName} edited a comment`
      case 'RESOLUTION_SET':
        return `${actorName} marked resolution as ${act.new_value}`
      default:
        return `${actorName} updated this issue`
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '380px',
          maxWidth: '100vw',
          height: '100vh',
          maxHeight: '100vh',
          borderRadius: 0,
          borderLeft: '1px solid var(--border-muted)',
        }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} className="text-blue-400" />
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Project Activity</h3>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '8px' }}>
          {activities.length === 0 ? (
            <div className="empty-state py-8">
              <Bell size={32} className="text-muted mb-2" />
              <p className="text-xs text-muted">No recent activity stream in this project yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activities.slice(0, 30).map((act) => {
                const relatedIssue = issues.find((i) => i.id === act.issue_id)
                return (
                  <div
                    key={act.id}
                    className="card"
                    style={{
                      padding: '10px 12px',
                      background: 'var(--bg-surface-raised)',
                      cursor: relatedIssue ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => {
                      if (relatedIssue) {
                        onSelectIssue(relatedIssue)
                        onClose()
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ marginTop: '2px' }}>{getActionIcon(act.action_type)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {getActionText(act)}
                        </div>
                        {relatedIssue && (
                          <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '2px' }}>
                            {relatedIssue.identifier}: {relatedIssue.title}
                          </div>
                        )}
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {formatRelativeTime(act.created_at)}
                        </div>
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
