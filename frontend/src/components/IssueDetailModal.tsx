import React, { useState, useEffect } from 'react'
import {
  Issue,
  Label,
  ProjectMember,
  Comment,
  Activity,
  IssueStatus,
  PriorityLevel,
  SeverityLevel,
  ResolutionType,
} from '../types'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import {
  X,
  Send,
  Trash2,
  Edit3,
  Clock,
  MessageSquare,
  History,
  Tag,
  AlertCircle,
  CheckCircle2,
  User,
} from 'lucide-react'

const ALLOWED_STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  OPEN: ['OPEN', 'IN_PROGRESS'],
  IN_PROGRESS: ['IN_PROGRESS', 'IN_REVIEW', 'OPEN'],
  IN_REVIEW: ['IN_REVIEW', 'RESOLVED', 'IN_PROGRESS'],
  RESOLVED: ['RESOLVED', 'CLOSED', 'OPEN', 'IN_PROGRESS'],
  CLOSED: ['CLOSED', 'OPEN'],
}

interface IssueDetailModalProps {
  issue: Issue
  projectId: number
  labels: Label[]
  members: ProjectMember[]
  onClose: () => void
  onIssueUpdated: (updated: Issue) => void
  onIssueDeleted: (issueId: number) => void
}

export function IssueDetailModal({
  issue,
  projectId,
  labels,
  members,
  onClose,
  onIssueUpdated,
  onIssueDeleted,
}: IssueDetailModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments')

  // Form states
  const [title, setTitle] = useState(issue.title)
  const [description, setDescription] = useState(issue.description || '')
  const [status, setStatus] = useState<IssueStatus>(issue.status)
  const [priority, setPriority] = useState<PriorityLevel>(issue.priority)
  const [severity, setSeverity] = useState<SeverityLevel>(issue.severity)
  const [assigneeId, setAssigneeId] = useState<number | undefined>(issue.assignee_id || undefined)
  const [resolution, setResolution] = useState<ResolutionType | undefined>(issue.resolution || undefined)
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(
    issue.labels ? issue.labels.map((l) => l.id) : []
  )

  // Comments and Activity
  const [comments, setComments] = useState<Comment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [newCommentBody, setNewCommentBody] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentBody, setEditingCommentBody] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [savingComment, setSavingComment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadComments()
    loadActivities()
  }, [issue.id])

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const res = await api.comments.list(projectId, issue.id)
      setComments(res.comments)
    } catch (err: any) {
      console.error('Failed to load comments:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const loadActivities = async () => {
    setLoadingActivities(true)
    try {
      const res = await api.activities.listIssue(projectId, issue.id)
      setActivities(res.activities)
    } catch (err: any) {
      console.error('Failed to load activities:', err)
    } finally {
      setLoadingActivities(false)
    }
  }

  const handleStatusChange = (newStatus: IssueStatus) => {
    setStatus(newStatus)
    if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
      if (!resolution) setResolution('FIXED')
    } else {
      setResolution(undefined)
    }
  }

  const handleSaveChanges = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await api.issues.update(projectId, issue.id, {
        title,
        description,
        status,
        priority,
        severity,
        assignee_id: assigneeId || null as any,
        resolution: resolution || null as any,
        label_ids: selectedLabelIds,
      })
      onIssueUpdated(res.issue)
      loadActivities()
    } catch (err: any) {
      setError(err.message || 'Failed to update issue')
    } finally {
      setSaving(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommentBody.trim()) return

    setSubmittingComment(true)
    try {
      const res = await api.comments.create(projectId, issue.id, newCommentBody.trim())
      setComments([...comments, res.comment])
      setNewCommentBody('')
      loadActivities()
    } catch (err: any) {
      setError(err.message || 'Failed to post comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditingCommentBody(comment.body)
  }

  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentBody('')
  }

  const handleSaveEditComment = async (commentId: number) => {
    if (!editingCommentBody.trim()) return
    setSavingComment(true)
    try {
      const res = await api.comments.update(projectId, issue.id, commentId, editingCommentBody.trim())
      setComments(comments.map((c) => (c.id === commentId ? res.comment : c)))
      setEditingCommentId(null)
      setEditingCommentBody('')
      loadActivities()
    } catch (err: any) {
      setError(err.message || 'Failed to update comment')
    } finally {
      setSavingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      await api.comments.delete(projectId, issue.id, commentId)
      setComments(comments.filter((c) => c.id !== commentId))
      loadActivities()
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment')
    }
  }

  const handleDeleteIssue = async () => {
    if (!confirm('Are you sure you want to permanently delete this issue?')) return
    try {
      await api.issues.delete(projectId, issue.id)
      onIssueDeleted(issue.id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to delete issue')
    }
  }

  const toggleLabel = (labelId: number) => {
    if (selectedLabelIds.includes(labelId)) {
      setSelectedLabelIds(selectedLabelIds.filter((id) => id !== labelId))
    } else {
      setSelectedLabelIds([...selectedLabelIds, labelId])
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content issue-detail-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="issue-identifier-group">
            <span className="font-mono issue-badge">{issue.identifier || `#${issue.issue_number}`}</span>
            <span className="issue-type-tag">{issue.issue_type}</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="modal-body-split">
          {/* Main Left Pane: Title, Description, Tabs */}
          <div className="modal-main-pane">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                className="input-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="input-description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add reproduction steps, expected behavior, or stack traces..."
              />
            </div>

            {/* Sub-tabs: Comments & Activity */}
            <div className="tabs-header">
              <button
                className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                onClick={() => setActiveTab('comments')}
              >
                <MessageSquare size={15} />
                <span>Comments ({comments.length})</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                <History size={15} />
                <span>Activity Timeline</span>
              </button>
            </div>

            <div className="tab-pane">
              {activeTab === 'comments' ? (
                <div className="comments-section">
                  <div className="comments-list">
                    {loadingComments ? (
                      <div className="text-muted text-sm py-2">Loading comments...</div>
                    ) : comments.length === 0 ? (
                      <div className="text-muted text-sm py-4 text-center">No comments yet.</div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="comment-bubble">
                          <div className="comment-header">
                            <div className="comment-author">
                              <div className="avatar-xs">
                                {comment.author?.username
                                  ? comment.author.username.charAt(0).toUpperCase()
                                  : 'U'}
                              </div>
                              <strong>{comment.author?.username || 'User'}</strong>
                              <span className="text-xs text-muted">
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                            </div>
                            {user?.id === comment.author_id && (
                              <div className="comment-actions-group">
                                {editingCommentId !== comment.id && (
                                  <button
                                    className="btn-icon-xs text-muted hover-primary"
                                    onClick={() => handleStartEditComment(comment)}
                                    title="Edit Comment"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                )}
                                <button
                                  className="btn-icon-xs text-muted hover-danger"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  title="Delete Comment"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                          {editingCommentId === comment.id ? (
                            <div className="comment-edit-box">
                              <textarea
                                rows={2}
                                value={editingCommentBody}
                                onChange={(e) => setEditingCommentBody(e.target.value)}
                                className="comment-edit-input"
                              />
                              <div className="flex-row gap-2 mt-2">
                                <button
                                  type="button"
                                  className="btn-primary btn-xs"
                                  disabled={savingComment || !editingCommentBody.trim()}
                                  onClick={() => handleSaveEditComment(comment.id)}
                                >
                                  {savingComment ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  className="btn-secondary btn-xs"
                                  disabled={savingComment}
                                  onClick={handleCancelEditComment}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="comment-body">{comment.body}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="add-comment-form">
                    <textarea
                      rows={2}
                      placeholder="Write a reply or status update..."
                      value={newCommentBody}
                      onChange={(e) => setNewCommentBody(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn-primary btn-sm"
                      disabled={submittingComment || !newCommentBody.trim()}
                    >
                      <Send size={13} />
                      <span>{submittingComment ? 'Posting...' : 'Comment'}</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="activity-timeline">
                  {loadingActivities ? (
                    <div className="text-muted text-sm py-2">Loading activity...</div>
                  ) : activities.length === 0 ? (
                    <div className="text-muted text-sm py-4 text-center">No recorded activity.</div>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="activity-item">
                        <div className="activity-dot" />
                        <div className="activity-content">
                          <div className="activity-header">
                            <strong>{act.actor?.username || 'User'}</strong>
                            <span className="activity-action">{act.action_type.replace('_', ' ')}</span>
                            <span className="activity-date">
                              {new Date(act.created_at).toLocaleString()}
                            </span>
                          </div>
                          {(act.old_value || act.new_value) && (
                            <div className="activity-diff">
                              {act.old_value && <span className="diff-old">{act.old_value}</span>}
                              {act.old_value && act.new_value && <span className="diff-arrow">→</span>}
                              {act.new_value && <span className="diff-new">{act.new_value}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Properties */}
          <div className="modal-sidebar-pane">
            <div className="sidebar-field">
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
              >
                {(ALLOWED_STATUS_TRANSITIONS[issue.status] || ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'CLOSED']).map((s) => (
                  <option key={s} value={s}>
                    {s === 'OPEN' ? 'Open' : s === 'IN_PROGRESS' ? 'In Progress' : s === 'IN_REVIEW' ? 'In Review' : s === 'RESOLVED' ? 'Resolved' : 'Closed'}
                  </option>
                ))}
              </select>
            </div>

            <div className="sidebar-field">
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              >
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="sidebar-field">
              <label>Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="sidebar-field">
              <label>Assignee</label>
              <select
                value={assigneeId || ''}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user?.username || `User #${m.user_id}`} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {(status === 'RESOLVED' || status === 'CLOSED') && (
              <div className="sidebar-field">
                <label>Resolution</label>
                <select
                  value={resolution || ''}
                  onChange={(e) => setResolution(e.target.value as ResolutionType || undefined)}
                >
                  <option value="">None</option>
                  <option value="FIXED">Fixed</option>
                  <option value="DUPLICATE">Duplicate</option>
                  <option value="WONT_FIX">Won't Fix</option>
                  <option value="INVALID">Invalid</option>
                  <option value="WORKS_FOR_ME">Works For Me</option>
                </select>
              </div>
            )}

            <div className="sidebar-field">
              <label>Labels</label>
              <div className="labels-toggle-list">
                {labels.length === 0 ? (
                  <span className="text-muted text-xs">No project labels</span>
                ) : (
                  labels.map((lbl) => {
                    const isSelected = selectedLabelIds.includes(lbl.id)
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        className={`label-chip-toggle ${isSelected ? 'selected' : ''}`}
                        style={{
                          borderColor: lbl.color,
                          backgroundColor: isSelected ? `${lbl.color}33` : 'transparent',
                          color: isSelected ? '#fff' : lbl.color,
                        }}
                        onClick={() => toggleLabel(lbl.id)}
                      >
                        {lbl.name}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <div className="modal-actions-sidebar">
              <button
                className="btn-primary full-width"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                className="btn-danger-outline full-width mt-2"
                onClick={handleDeleteIssue}
              >
                <Trash2 size={14} />
                <span>Delete Issue</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
