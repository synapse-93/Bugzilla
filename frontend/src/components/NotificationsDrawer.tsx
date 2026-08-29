import React, { useState, useEffect } from 'react'
import { Activity, Issue, Notification } from '../types'
import { api } from '../api/client'
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  Tag,
  UserCheck,
  X,
  Mail,
  Activity as ActivityIcon,
} from 'lucide-react'
import { formatRelativeTime } from '../utils/helpers'
import { toast } from 'sonner'

interface NotificationsDrawerProps {
  isOpen: boolean
  onClose: () => void
  activities: Activity[]
  issues: Issue[]
  onSelectIssue: (issue: Issue) => void
  onOpenInvitations?: () => void
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  activities,
  issues,
  onSelectIssue,
  onOpenInvitations,
}: NotificationsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'NOTIFICATIONS' | 'ACTIVITY'>('NOTIFICATIONS')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await api.notifications.list()
      setNotifications(res.notifications)
      setUnreadCount(res.unread_count)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id: number) => {
    try {
      await api.notifications.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (err) {
      console.error(err)
    }
  }

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
      case 'INVITATION':
      case 'INVITATION_ACCEPTED':
        return <Mail size={14} className="text-emerald-400" />
      default:
        return <Bell size={14} className="text-muted" />
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '400px',
          maxWidth: '100vw',
          height: '100vh',
          maxHeight: '100vh',
          borderRadius: 0,
          borderLeft: '1px solid var(--border-muted)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} className="text-blue-400" />
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Notifications & Activity</h3>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              padding: '8px',
              fontSize: '12px',
              borderBottom: activeTab === 'NOTIFICATIONS' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'NOTIFICATIONS' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
            }}
            onClick={() => setActiveTab('NOTIFICATIONS')}
          >
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              padding: '8px',
              fontSize: '12px',
              borderBottom: activeTab === 'ACTIVITY' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'ACTIVITY' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
            }}
            onClick={() => setActiveTab('ACTIVITY')}
          >
            Project Feed
          </button>
        </div>

        {/* Action sub-bar */}
        {activeTab === 'NOTIFICATIONS' && notifications.length > 0 && unreadCount > 0 && (
          <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '11px', padding: '2px 6px', color: 'var(--accent-primary)' }}
              onClick={handleMarkAllRead}
            >
              <CheckCheck size={12} /> Mark all read
            </button>
          </div>
        )}

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {activeTab === 'NOTIFICATIONS' ? (
            notifications.length === 0 ? (
              <div className="empty-state py-8">
                <Bell size={32} className="text-muted mb-2" />
                <p className="text-xs text-muted">No notifications yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="card"
                    style={{
                      padding: '10px 12px',
                      background: notif.is_read ? 'var(--bg-surface)' : 'rgba(59, 130, 246, 0.08)',
                      borderLeft: notif.is_read ? '1px solid var(--border-subtle)' : '3px solid var(--accent-primary)',
                      cursor: notif.notification_type === 'INVITATION' ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (!notif.is_read) handleMarkRead(notif.id)
                      if (notif.notification_type === 'INVITATION' && onOpenInvitations) {
                        onOpenInvitations()
                        onClose()
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ marginTop: '2px' }}>{getActionIcon(notif.notification_type)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {formatRelativeTime(notif.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Activity Feed Tab */
            activities.length === 0 ? (
              <div className="empty-state py-8">
                <ActivityIcon size={32} className="text-muted mb-2" />
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
                      }}
                      onClick={() => {
                        if (relatedIssue) {
                          onSelectIssue(relatedIssue)
                          onClose()
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ marginTop: '2px' }}>{getActionIcon(act.action)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            <strong>{act.actor?.username || 'Member'}</strong> {act.action.replace('_', ' ').toLowerCase()}
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
            )
          )}
        </div>
      </div>
    </div>
  )
}
