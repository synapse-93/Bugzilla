import React, { useState, useEffect } from 'react'
import { Activity, Issue, Notification } from '../types'
import { api } from '../api/client'
import {
  Bell,
  CheckCheck,
  MessageSquare,
  Tag,
  UserCheck,
  Mail,
  Activity as ActivityIcon,
  X,
} from 'lucide-react'
import { formatRelativeTime } from '../utils/helpers'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet'
import { Button } from './ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { cn } from '@/lib/utils'

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

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'COMMENT_ADDED':
      case 'COMMENT_UPDATED':
        return <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
      case 'ASSIGNED':
      case 'UNASSIGNED':
        return <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
      case 'LABEL_ADDED':
      case 'LABEL_REMOVED':
        return <Tag className="h-3.5 w-3.5 text-purple-400" />
      case 'STATUS_CHANGED':
        return <ActivityIcon className="h-3.5 w-3.5 text-amber-400" />
      case 'INVITATION':
      case 'INVITATION_ACCEPTED':
        return <Mail className="h-3.5 w-3.5 text-emerald-400" />
      default:
        return <Bell className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <SheetTitle className="text-base font-bold">Notifications & Feed</SheetTitle>
          </div>
          <SheetDescription className="text-[12px]">
            Real-time updates, issue activity, and project invitations.
          </SheetDescription>
        </SheetHeader>

        {/* Tabs */}
        <div className="p-3 border-b border-border/60 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={cn(
                'px-2.5 py-1 rounded text-[12px] font-medium transition-colors cursor-pointer',
                activeTab === 'NOTIFICATIONS'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ACTIVITY')}
              className={cn(
                'px-2.5 py-1 rounded text-[12px] font-medium transition-colors cursor-pointer',
                activeTab === 'ACTIVITY'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Project Feed
            </button>
          </div>

          {activeTab === 'NOTIFICATIONS' && notifications.length > 0 && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-6 px-2 text-[11px] text-primary"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              <span>Mark all read</span>
            </Button>
          )}
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeTab === 'NOTIFICATIONS' ? (
            loading ? (
              <div className="py-12 text-center text-muted-foreground text-[12px]">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-[12.5px] font-medium text-foreground">All caught up!</p>
                <p className="text-[11px] text-muted-foreground">No new notifications.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) handleMarkRead(notif.id)
                    if (notif.notification_type === 'INVITATION' && onOpenInvitations) {
                      onOpenInvitations()
                      onClose()
                    }
                  }}
                  className={cn(
                    'p-3 rounded-md border text-[12px] transition-colors cursor-pointer space-y-1',
                    notif.is_read
                      ? 'border-border/50 bg-card/40'
                      : 'border-primary/40 bg-primary/10 shadow-xs'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">{getActionIcon(notif.notification_type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground leading-snug">{notif.title}</p>
                      <p className="text-muted-foreground text-[11.5px] mt-0.5 leading-snug">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                        {formatRelativeTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            activities.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <ActivityIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-[12.5px] font-medium text-foreground">No activity recorded</p>
                <p className="text-[11px] text-muted-foreground">Events and audit logs will appear here.</p>
              </div>
            ) : (
              activities.slice(0, 30).map((act) => {
                const relatedIssue = issues.find((i) => i.id === act.issue_id)
                return (
                  <div
                    key={act.id}
                    onClick={() => {
                      if (relatedIssue) {
                        onSelectIssue(relatedIssue)
                        onClose()
                      }
                    }}
                    className={cn(
                      'p-2.5 rounded-md border border-border/60 bg-card/60 text-[12px] space-y-1 transition-colors',
                      relatedIssue && 'hover:bg-muted/40 cursor-pointer'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 shrink-0">{getActionIcon(act.action)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground leading-snug">
                          <span className="font-semibold">{act.actor?.username || 'Member'}</span>{' '}
                          <span className="text-muted-foreground">
                            {act.action.replace('_', ' ').toLowerCase()}
                          </span>
                        </p>
                        {relatedIssue && (
                          <p className="text-primary font-mono text-[11px] truncate mt-0.5">
                            {relatedIssue.identifier}: {relatedIssue.title}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">
                          {formatRelativeTime(act.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
