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
  IssueRelationship,
  Attachment,
} from '../types'
import { api } from '../api/client'
import {
  X,
  Trash2,
  Send,
  Edit2,
  Check,
  Paperclip,
  Activity as ActivityIcon,
  MessageSquare,
  Link as LinkIcon,
  AlertTriangle,
  Clock,
  User as UserIcon,
} from 'lucide-react'
import {
  getIssueDisplayIdentifier,
  formatDate,
  formatRelativeTime,
  getStatusColor,
  getPriorityColor,
  getStatusLabel,
} from '../utils/helpers'
import { toast } from 'sonner'

interface IssueDetailModalProps {
  issue: Issue
  projectId: number
  labels: Label[]
  members: ProjectMember[]
  allIssues?: Issue[]
  onClose: () => void
  onIssueUpdated: (updatedIssue: Issue) => void
  onIssueDeleted: (issueId: number) => void
}

export function IssueDetailModal({
  issue,
  projectId,
  labels,
  members,
  allIssues = [],
  onClose,
  onIssueUpdated,
  onIssueDeleted,
}: IssueDetailModalProps) {
  // Local active tab
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'relationships' | 'attachments'>('comments')

  // Form edit states
  const [title, setTitle] = useState(issue.title)
  const [description, setDescription] = useState(issue.description || '')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [savingField, setSavingField] = useState(false)

  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newCommentBody, setNewCommentBody] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentBody, setEditingCommentBody] = useState('')

  // Activity state
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  // Relationships state (client-stored per project/issue context)
  const [relationships, setRelationships] = useState<IssueRelationship[]>([])
  const [isAddingRel, setIsAddingRel] = useState(false)
  const [relTargetIssueId, setRelTargetIssueId] = useState<string>('')
  const [relType, setRelType] = useState<'BLOCKS' | 'BLOCKED_BY' | 'RELATED' | 'DUPLICATE'>('RELATED')

  // Attachments state (modular client model)
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingIssue, setDeletingIssue] = useState(false)

  // Load comments, activities, and relationships on mount
  useEffect(() => {
    loadComments()
    loadActivities()
    loadRelationships()
  }, [issue.id, projectId])

  const loadComments = async () => {
    setLoadingComments(true)
    try {
      const res = await api.comments.list(projectId, issue.id)
      setComments(res.comments)
    } catch (err) {
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
    } catch (err) {
      console.error('Failed to load activities:', err)
    } finally {
      setLoadingActivities(false)
    }
  }

  const loadRelationships = async () => {
    try {
      const res = await api.relationships.list(projectId, issue.id)
      setRelationships(res.relationships)
    } catch (err) {
      console.error('Failed to load relationships:', err)
    }
  }

  // Update single field handler
  const handleUpdateField = async (fields: Partial<Issue> & { label_ids?: number[] }) => {
    setSavingField(true)
    try {
      const res = await api.issues.update(projectId, issue.id, fields)
      onIssueUpdated(res.issue)
      toast.success('Issue updated')
      loadActivities()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update issue')
    } finally {
      setSavingField(false)
    }
  }

  // Handle label toggle
  const handleToggleLabel = async (labelId: number) => {
    const currentLabelIds = (issue.labels || []).map((l) => l.id)
    const newLabelIds = currentLabelIds.includes(labelId)
      ? currentLabelIds.filter((id) => id !== labelId)
      : [...currentLabelIds, labelId]

    await handleUpdateField({ label_ids: newLabelIds })
  }

  // Handle Comment Submission
  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommentBody.trim()) return

    setSubmittingComment(true)
    try {
      const res = await api.comments.create(projectId, issue.id, newCommentBody.trim())
      setComments([...comments, res.comment])
      setNewCommentBody('')
      toast.success('Comment posted')
      loadActivities()
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  // Handle Comment Edit
  const handleSaveCommentEdit = async (commentId: number) => {
    if (!editingCommentBody.trim()) return
    try {
      const res = await api.comments.update(projectId, issue.id, commentId, editingCommentBody.trim())
      setComments(comments.map((c) => (c.id === commentId ? res.comment : c)))
      setEditingCommentId(null)
      toast.success('Comment updated')
      loadActivities()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update comment')
    }
  }

  // Handle Comment Delete
  const handleDeleteComment = async (commentId: number) => {
    try {
      await api.comments.delete(projectId, issue.id, commentId)
      setComments(comments.filter((c) => c.id !== commentId))
      toast.success('Comment removed')
      loadActivities()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete comment')
    }
  }

  // Handle Add Relationship
  const handleAddRelationship = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!relTargetIssueId) return

    try {
      const res = await api.relationships.create(projectId, issue.id, {
        target_issue_id: Number(relTargetIssueId),
        relationship_type: relType,
      })
      setRelationships([...relationships, res.relationship])
      setIsAddingRel(false)
      setRelTargetIssueId('')
      toast.success('Relationship linked')
      loadActivities()
    } catch (err: any) {
      toast.error(err.message || 'Failed to link relationship')
    }
  }

  // Handle Delete Relationship
  const handleDeleteRelationship = async (relationshipId: number) => {
    try {
      await api.relationships.delete(projectId, issue.id, relationshipId)
      setRelationships(relationships.filter((r) => r.id !== relationshipId))
      toast.success('Relationship removed')
      loadActivities()
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove relationship')
    }
  }

  // Handle Delete Issue
  const handleDeleteIssue = async () => {
    setDeletingIssue(true)
    try {
      await api.issues.delete(projectId, issue.id)
      toast.success('Issue deleted')
      onIssueDeleted(issue.id)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete issue')
      setDeletingIssue(false)
    }
  }

  const statusStyles = getStatusColor(issue.status)
  const priorityStyles = getPriorityColor(issue.priority)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '900px', width: '95vw', height: '85vh', maxHeight: '850px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="issue-identifier-tag" style={{ fontSize: '13px' }}>
              {getIssueDisplayIdentifier(issue.identifier)}
            </span>
            <span
              className="badge-pill"
              style={{
                backgroundColor: statusStyles.bg,
                color: statusStyles.text,
                borderColor: statusStyles.border,
              }}
            >
              <span className="badge-dot" style={{ backgroundColor: statusStyles.dot }} />
              <span>{getStatusLabel(issue.status)}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-ghost btn-icon text-danger"
              title="Delete Issue"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} />
            </button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Main Body: 2 Columns */}
        <div className="modal-body" style={{ display: 'flex', gap: '24px', padding: '20px', flex: 1, overflow: 'hidden' }}>
          {/* Left Column: Title, Description, Tabs */}
          <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '6px' }}>
            {/* Title Header */}
            <div>
              {isEditingTitle ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary"
                    disabled={savingField}
                    onClick={() => {
                      setIsEditingTitle(false)
                      if (title.trim() && title !== issue.title) {
                        handleUpdateField({ title: title.trim() })
                      }
                    }}
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div
                  style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => setIsEditingTitle(true)}
                >
                  <span>{issue.title}</span>
                  <Edit2 size={13} className="text-muted" />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="card" style={{ background: 'var(--bg-surface-raised)', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Description
                </span>
                {!isEditingDesc && (
                  <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: '11px' }} onClick={() => setIsEditingDesc(true)}>
                    Edit
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => setIsEditingDesc(false)}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={savingField}
                      onClick={() => {
                        setIsEditingDesc(false)
                        handleUpdateField({ description: description.trim() })
                      }}
                    >
                      Save Description
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: description ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                  {description || 'No description provided.'}
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: '16px' }}>
              <button
                className={`btn btn-ghost ${activeTab === 'comments' ? 'active' : ''}`}
                style={{
                  borderRadius: 0,
                  borderBottom: activeTab === 'comments' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: activeTab === 'comments' ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '8px 4px',
                }}
                onClick={() => setActiveTab('comments')}
              >
                <MessageSquare size={14} />
                <span>Comments ({comments.length})</span>
              </button>

              <button
                className={`btn btn-ghost ${activeTab === 'activity' ? 'active' : ''}`}
                style={{
                  borderRadius: 0,
                  borderBottom: activeTab === 'activity' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: activeTab === 'activity' ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '8px 4px',
                }}
                onClick={() => setActiveTab('activity')}
              >
                <ActivityIcon size={14} />
                <span>Activity Timeline</span>
              </button>

              <button
                className={`btn btn-ghost ${activeTab === 'relationships' ? 'active' : ''}`}
                style={{
                  borderRadius: 0,
                  borderBottom: activeTab === 'relationships' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: activeTab === 'relationships' ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '8px 4px',
                }}
                onClick={() => setActiveTab('relationships')}
              >
                <LinkIcon size={14} />
                <span>Relationships ({relationships.length})</span>
              </button>

              <button
                className={`btn btn-ghost ${activeTab === 'attachments' ? 'active' : ''}`}
                style={{
                  borderRadius: 0,
                  borderBottom: activeTab === 'attachments' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: activeTab === 'attachments' ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '8px 4px',
                }}
                onClick={() => setActiveTab('attachments')}
              >
                <Paperclip size={14} />
                <span>Attachments</span>
              </button>
            </div>

            {/* Tab 1: Comments */}
            {activeTab === 'comments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Comments List */}
                {loadingComments ? (
                  <div className="text-muted text-xs py-4 text-center">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="text-muted text-xs py-4 text-center">No comments yet. Be the first to reply!</div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="card" style={{ padding: '12px', background: 'var(--bg-surface-raised)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="user-avatar" style={{ width: '20px', height: '20px', fontSize: '10px' }}>
                            {c.author?.username ? c.author.username.substring(0, 2) : 'U'}
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {c.author?.username || 'User'}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {formatRelativeTime(c.created_at)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn-ghost btn-icon"
                            title="Edit Comment"
                            onClick={() => {
                              setEditingCommentId(c.id)
                              setEditingCommentBody(c.content || (c as any).body || '')
                            }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="btn-ghost btn-icon text-danger"
                            title="Delete Comment"
                            onClick={() => handleDeleteComment(c.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {editingCommentId === c.id ? (
                        <div style={{ marginTop: '8px' }}>
                          <textarea
                            className="form-textarea"
                            rows={2}
                            value={editingCommentBody}
                            onChange={(e) => setEditingCommentBody(e.target.value)}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditingCommentId(null)}>
                              Cancel
                            </button>
                            <button className="btn btn-sm btn-primary" onClick={() => handleSaveCommentEdit(c.id)}>
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                          {c.content || (c as any).body}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Comment Input Box */}
                <form onSubmit={handleCreateComment} style={{ marginTop: '8px' }}>
                  <textarea
                    className="form-textarea"
                    placeholder="Write a comment... (Supports markdown text)"
                    rows={3}
                    value={newCommentBody}
                    onChange={(e) => setNewCommentBody(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button className="btn btn-primary" type="submit" disabled={submittingComment || !newCommentBody.trim()}>
                      <Send size={14} />
                      <span>Post Comment</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Activity Timeline */}
            {activeTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {loadingActivities ? (
                  <div className="text-muted text-xs py-4 text-center">Loading activity timeline...</div>
                ) : activities.length === 0 ? (
                  <div className="text-muted text-xs py-4 text-center">No history recorded for this issue.</div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div className="user-avatar" style={{ width: '22px', height: '22px', fontSize: '10px' }}>
                        {act.actor?.username ? act.actor.username.substring(0, 2) : 'A'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                          <span style={{ fontWeight: 600 }}>{act.actor?.username || 'User'}</span>{' '}
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {(act.action || (act as any).action_type || 'updated').toLowerCase().replace('_', ' ')}
                          </span>
                          {act.old_value && act.new_value && (
                            <span style={{ color: 'var(--accent-primary)' }}>
                              {' '}from {act.old_value} to {act.new_value}
                            </span>
                          )}
                          {!act.old_value && act.new_value && (
                            <span style={{ color: 'var(--accent-primary)' }}>: "{act.new_value}"</span>
                          )}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {formatRelativeTime(act.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Relationships */}
            {activeTab === 'relationships' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Linked & Dependent Issues
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsAddingRel(!isAddingRel)}>
                    + Link Issue
                  </button>
                </div>

                {isAddingRel && (
                  <form onSubmit={handleAddRelationship} className="card" style={{ background: 'var(--bg-surface-raised)', padding: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
                      <select
                        className="form-select"
                        value={relType}
                        onChange={(e) => setRelType(e.target.value as any)}
                      >
                        <option value="BLOCKS">Blocks</option>
                        <option value="BLOCKED_BY">Blocked By</option>
                        <option value="RELATED">Related To</option>
                        <option value="DUPLICATE">Duplicate Of</option>
                      </select>

                      <select
                        className="form-select"
                        value={relTargetIssueId}
                        onChange={(e) => setRelTargetIssueId(e.target.value)}
                        required
                      >
                        <option value="">Select target issue...</option>
                        {allIssues
                          .filter((i) => i.id !== issue.id)
                          .map((i) => (
                            <option key={i.id} value={String(i.id)}>
                              {i.identifier}: {i.title}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" type="button" onClick={() => setIsAddingRel(false)}>
                        Cancel
                      </button>
                      <button className="btn btn-primary btn-sm" type="submit" disabled={!relTargetIssueId}>
                        Link
                      </button>
                    </div>
                  </form>
                )}

                {relationships.length === 0 ? (
                  <div className="text-muted text-xs py-4 text-center">No linked relationships yet.</div>
                ) : (
                  relationships.map((rel) => (
                    <div key={rel.id} className="card" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="badge-pill" style={{ background: 'var(--bg-surface-hover)', marginRight: '8px' }}>
                          {(rel.relationship_type || (rel as any).type || 'RELATED').replace('_', ' ')}
                        </span>
                        <span style={{ fontWeight: 500, fontSize: '13px' }}>
                          {rel.target_identifier || (rel as any).target_issue_identifier || `Issue #${rel.target_issue_id}`}: {rel.target_title || (rel as any).target_issue_title || ''}
                        </span>
                      </div>
                      <button
                        className="btn-ghost btn-icon text-danger"
                        onClick={() => handleDeleteRelationship(rel.id)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 4: Attachments */}
            {activeTab === 'attachments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="card" style={{ padding: '24px', borderStyle: 'dashed', textAlign: 'center' }}>
                  <Paperclip size={28} className="text-muted mb-2" />
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Drop files here or click to attach
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Screenshots, logs, and trace documents
                  </div>
                </div>

                {attachments.length === 0 ? (
                  <div className="text-muted text-xs py-2 text-center">No attachments uploaded.</div>
                ) : (
                  attachments.map((att) => (
                    <div key={att.id} className="card" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Paperclip size={14} className="text-muted" />
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{att.name || (att as any).filename}</span>
                      </div>
                      <button className="btn-ghost btn-icon text-danger" onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Column: Properties & Metadata */}
          <div style={{ flex: '1 1 40%', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '20px' }}>
            {/* Status Select */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={issue.status}
                disabled={savingField}
                onChange={(e) => handleUpdateField({ status: e.target.value as IssueStatus })}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Resolution (for Resolved / Closed) */}
            {(issue.status === 'RESOLVED' || issue.status === 'CLOSED') && (
              <div className="form-group">
                <label className="form-label">Resolution</label>
                <select
                  className="form-select"
                  value={issue.resolution || ''}
                  disabled={savingField}
                  onChange={(e) => handleUpdateField({ resolution: (e.target.value || null) as ResolutionType | null })}
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

            {/* Priority Select */}
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={issue.priority}
                disabled={savingField}
                onChange={(e) => handleUpdateField({ priority: e.target.value as PriorityLevel })}
              >
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Severity Select */}
            <div className="form-group">
              <label className="form-label">Severity</label>
              <select
                className="form-select"
                value={issue.severity}
                disabled={savingField}
                onChange={(e) => handleUpdateField({ severity: e.target.value as SeverityLevel })}
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Assignee Select */}
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select
                className="form-select"
                value={issue.assignee_id ? String(issue.assignee_id) : ''}
                disabled={savingField}
                onChange={(e) => handleUpdateField({ assignee_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={String(m.user_id)}>
                    {m.user?.username || `User ${m.user_id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Labels Multi-Chip Toggle */}
            <div className="form-group">
              <label className="form-label">Labels</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {labels.map((lbl) => {
                  const isSelected = (issue.labels || []).some((l) => l.id === lbl.id)
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      className="label-chip"
                      style={{
                        backgroundColor: isSelected ? `${lbl.color}30` : 'var(--bg-surface-raised)',
                        color: isSelected ? lbl.color : 'var(--text-muted)',
                        border: isSelected ? `1px solid ${lbl.color}` : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleToggleLabel(lbl.id)}
                    >
                      {lbl.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Metadata Footer */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <div>Created: {formatDate(issue.created_at)}</div>
              <div>Updated: {formatRelativeTime(issue.updated_at)}</div>
              {issue.creator && <div>Creator: {issue.creator.username}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 120 }}>
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
                <AlertTriangle size={18} />
                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Delete Issue</h3>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Are you sure you want to permanently delete <strong>{getIssueDisplayIdentifier(issue.identifier)}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deletingIssue}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteIssue} disabled={deletingIssue}>
                {deletingIssue ? 'Deleting...' : 'Delete Issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
