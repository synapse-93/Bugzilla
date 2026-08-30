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
  Loader2,
  X,
} from 'lucide-react'
import {
  getIssueDisplayIdentifier,
  formatDate,
  formatRelativeTime,
} from '../utils/helpers'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { StatusBadge } from './StatusBadge'
import { SeverityBadge } from './SeverityBadge'
import { PriorityBadge } from './PriorityBadge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Card, CardContent } from './ui/card'
import { cn } from '@/lib/utils'

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

  // Relationships state
  const [relationships, setRelationships] = useState<IssueRelationship[]>([])
  const [isAddingRel, setIsAddingRel] = useState(false)
  const [relTargetIssueId, setRelTargetIssueId] = useState<string>('')
  const [relType, setRelType] = useState<'BLOCKS' | 'BLOCKED_BY' | 'RELATED' | 'DUPLICATE'>('RELATED')

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingIssue, setDeletingIssue] = useState(false)

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

  const handleToggleLabel = async (labelId: number) => {
    const currentLabelIds = (issue.labels || []).map((l) => l.id)
    const newLabelIds = currentLabelIds.includes(labelId)
      ? currentLabelIds.filter((id) => id !== labelId)
      : [...currentLabelIds, labelId]

    await handleUpdateField({ label_ids: newLabelIds })
  }

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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl border-border/80 bg-popover">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-mono text-[11px] font-semibold border border-primary/25">
              {getIssueDisplayIdentifier(issue.identifier)}
            </span>
            <StatusBadge status={issue.status} />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7"
              title="Delete Issue"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* 2-Column Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column (2 cols wide) */}
          <div className="lg:col-span-2 space-y-5 min-w-0">
            {/* Title Section */}
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                    className="text-[14px] font-semibold h-8.5"
                  />
                  <Button
                    size="sm"
                    disabled={savingField}
                    onClick={() => {
                      setIsEditingTitle(false)
                      if (title.trim() && title !== issue.title) {
                        handleUpdateField({ title: title.trim() })
                      }
                    }}
                    className="h-8.5 px-3"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingTitle(true)}
                  className="group flex items-start gap-2 cursor-pointer"
                >
                  <h2 className="text-lg font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {issue.title}
                  </h2>
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="rounded-lg border border-border/60 bg-muted/15 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  Description
                </span>
                {!isEditingDesc && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingDesc(true)}
                    className="h-6 px-2 text-[10.5px] font-mono text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </Button>
                )}
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <Textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-[12.5px]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingDesc(false)}
                      className="h-7 text-[11px]"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={savingField}
                      onClick={() => {
                        setIsEditingDesc(false)
                        handleUpdateField({ description: description.trim() })
                      }}
                      className="h-7 text-[11px]"
                    >
                      Save Description
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-[12.5px] text-foreground whitespace-pre-wrap leading-relaxed">
                  {description || 'No description provided.'}
                </p>
              )}
            </div>

            {/* Activity / Comments / Relationships Tabs */}
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
              <TabsList className="grid grid-cols-4 h-8 bg-muted/40 p-0.5 border border-border/40">
                <TabsTrigger value="comments" className="text-[11px] font-mono gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>Comments ({comments.length})</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-[11px] font-mono gap-1">
                  <ActivityIcon className="h-3 w-3" />
                  <span>Activity</span>
                </TabsTrigger>
                <TabsTrigger value="relationships" className="text-[11px] font-mono gap-1">
                  <LinkIcon className="h-3 w-3" />
                  <span>Links ({relationships.length})</span>
                </TabsTrigger>
                <TabsTrigger value="attachments" className="text-[11px] font-mono gap-1">
                  <Paperclip className="h-3 w-3" />
                  <span>Files</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab: Comments */}
              <TabsContent value="comments" className="space-y-3.5 pt-3">
                {loadingComments ? (
                  <div className="py-6 text-center text-muted-foreground text-[11.5px] font-mono">
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground text-[11.5px] font-mono">
                    No comments yet. Be the first to start the discussion!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {comments.map((c) => {
                      const authorName = c.author?.display_name || c.author?.username || 'User'
                      const authorInitials = authorName.substring(0, 2).toUpperCase()
                      return (
                        <div key={c.id} className="p-3 rounded-lg border border-border/60 bg-card/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5 border border-border/60">
                                {c.author?.avatar_url && (
                                  <AvatarImage src={c.author.avatar_url} alt={authorName} />
                                )}
                                <AvatarFallback className="bg-primary/15 text-primary text-[8px] font-mono font-semibold">
                                  {authorInitials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[12px] font-semibold text-foreground">
                                {authorName}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground/70">
                                {formatRelativeTime(c.created_at)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="iconSm"
                                onClick={() => {
                                  setEditingCommentId(c.id)
                                  setEditingCommentBody(c.content || (c as any).body || '')
                                }}
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="iconSm"
                                onClick={() => handleDeleteComment(c.id)}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {editingCommentId === c.id ? (
                            <div className="space-y-2 pt-1">
                              <Textarea
                                rows={2}
                                value={editingCommentBody}
                                onChange={(e) => setEditingCommentBody(e.target.value)}
                                className="text-[12.5px]"
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingCommentId(null)}
                                  className="h-6 px-2 text-[11px]"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveCommentEdit(c.id)}
                                  className="h-6 px-2 text-[11px]"
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[12px] text-foreground whitespace-pre-wrap pl-7 leading-relaxed">
                              {c.content || (c as any).body}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Post New Comment */}
                <form onSubmit={handleCreateComment} className="space-y-2 pt-2">
                  <Textarea
                    placeholder="Write a comment..."
                    rows={3}
                    value={newCommentBody}
                    onChange={(e) => setNewCommentBody(e.target.value)}
                    className="text-[12.5px] bg-background/50 border-border/70"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submittingComment || !newCommentBody.trim()}
                      className="h-7 text-[11px] gap-1.5 font-medium shadow-xs"
                    >
                      {submittingComment ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      <span>Post Comment</span>
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Tab: Activity */}
              <TabsContent value="activity" className="space-y-3 pt-3">
                {loadingActivities ? (
                  <div className="py-6 text-center text-muted-foreground text-[11.5px] font-mono">
                    Loading activity timeline...
                  </div>
                ) : activities.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground text-[11.5px] font-mono">
                    No audit records recorded.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activities.map((act) => {
                      const actorName = act.actor?.display_name || act.actor?.username || 'Team Member'
                      return (
                        <div
                          key={act.id}
                          className="flex items-start gap-2.5 pb-2 border-b border-border/40 text-[12px]"
                        >
                          <Avatar className="h-5 w-5 mt-0.5 border border-border/60">
                            {act.actor?.avatar_url && (
                              <AvatarImage src={act.actor.avatar_url} alt={actorName} />
                            )}
                            <AvatarFallback className="bg-primary/15 text-primary text-[8px] font-mono font-semibold">
                              {actorName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground">
                              <span className="font-semibold">{actorName}</span>{' '}
                              <span className="text-muted-foreground">
                                {(act.action || (act as any).action_type || 'updated').toLowerCase().replace('_', ' ')}
                              </span>
                              {act.old_value && act.new_value && (
                                <span className="text-primary font-mono ml-1">
                                  {act.old_value} → {act.new_value}
                                </span>
                              )}
                              {!act.old_value && act.new_value && (
                                <span className="text-primary font-mono ml-1">"{act.new_value}"</span>
                              )}
                            </p>
                            <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">
                              {formatRelativeTime(act.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Relationships */}
              <TabsContent value="relationships" className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Dependencies & Related Issues
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingRel(!isAddingRel)}
                    className="h-7 text-[11px]"
                  >
                    + Link Issue
                  </Button>
                </div>

                {isAddingRel && (
                  <form
                    onSubmit={handleAddRelationship}
                    className="p-3 rounded-md border border-border/60 bg-card/70 space-y-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={relType}
                        onChange={(e) => setRelType(e.target.value as any)}
                        className="h-8 rounded border border-border/70 bg-background px-2 text-[12px] text-foreground focus:outline-none"
                      >
                        <option value="BLOCKS">Blocks</option>
                        <option value="BLOCKED_BY">Blocked By</option>
                        <option value="RELATED">Related To</option>
                        <option value="DUPLICATE">Duplicate Of</option>
                      </select>

                      <select
                        value={relTargetIssueId}
                        onChange={(e) => setRelTargetIssueId(e.target.value)}
                        required
                        className="h-8 rounded border border-border/70 bg-background px-2 text-[12px] text-foreground focus:outline-none"
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

                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => setIsAddingRel(false)}
                        className="h-6 px-2 text-[11px]"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        type="submit"
                        disabled={!relTargetIssueId}
                        className="h-6 px-2 text-[11px]"
                      >
                        Link
                      </Button>
                    </div>
                  </form>
                )}

                {relationships.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground text-[11.5px] font-mono">
                    No linked relationships.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relationships.map((rel) => (
                      <div
                        key={rel.id}
                        className="flex items-center justify-between p-2.5 rounded-md border border-border/60 bg-card/60"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-medium bg-muted text-muted-foreground border border-border/50">
                            {(rel.relationship_type || (rel as any).type || 'RELATED').replace('_', ' ')}
                          </span>
                          <span className="text-[12px] font-medium text-foreground">
                            {rel.target_identifier || (rel as any).target_issue_identifier || `Issue #${rel.target_issue_id}`}:{' '}
                            {rel.target_title || (rel as any).target_issue_title || ''}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => handleDeleteRelationship(rel.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Attachments */}
              <TabsContent value="attachments" className="space-y-3 pt-3">
                <div className="p-6 border border-dashed border-border/60 rounded-md text-center bg-muted/10 space-y-1">
                  <Paperclip className="h-5 w-5 text-muted-foreground/60 mx-auto mb-1" />
                  <p className="text-[12px] font-medium text-foreground">Drop files or click to attach</p>
                  <p className="text-[10px] font-mono text-muted-foreground/70">Screenshots, log files, or reproduction traces</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Properties & Metadata */}
          <div className="space-y-3.5 border-t lg:border-t-0 lg:border-l border-border/60 pt-4 lg:pt-0 lg:pl-6">
            {/* Status Select */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-mono font-medium text-muted-foreground uppercase tracking-wider">Status</label>
              <select
                value={issue.status}
                disabled={savingField}
                onChange={(e) => handleUpdateField({ status: e.target.value as IssueStatus })}
                className="w-full h-8 rounded-md border border-border/70 bg-background/50 px-2.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Resolution (When Resolved or Closed) */}
            {(issue.status === 'RESOLVED' || issue.status === 'CLOSED') && (
              <div className="space-y-1">
                <label className="text-[10.5px] font-mono font-medium text-muted-foreground uppercase tracking-wider">Resolution</label>
                <select
                  value={issue.resolution || ''}
                  disabled={savingField}
                  onChange={(e) => handleUpdateField({ resolution: (e.target.value || null) as ResolutionType | null })}
                  className="w-full h-8 rounded-md border border-border/70 bg-background/50 px-2.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
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
            <div className="space-y-1">
              <label className="text-[10.5px] font-mono font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
              <select
                value={issue.priority}
                disabled={savingField}
                onChange={(e) => handleUpdateField({ priority: e.target.value as PriorityLevel })}
                className="w-full h-8 rounded-md border border-border/70 bg-background/50 px-2.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Severity Select */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-mono font-medium text-muted-foreground uppercase tracking-wider">Severity</label>
              <select
                value={issue.severity}
                disabled={savingField}
                onChange={(e) => handleUpdateField({ severity: e.target.value as SeverityLevel })}
                className="w-full h-8 rounded-md border border-border/70 bg-background/50 px-2.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* Assignee Select */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-mono font-medium text-muted-foreground uppercase tracking-wider">Assignee</label>
              <select
                value={issue.assignee_id ? String(issue.assignee_id) : ''}
                disabled={savingField}
                onChange={(e) => handleUpdateField({ assignee_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full h-8 rounded-md border border-border/70 bg-background/50 px-2.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={String(m.user_id)}>
                    {m.user?.display_name || m.user?.username || `User ${m.user_id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Labels Selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10.5px] font-mono font-medium text-muted-foreground uppercase tracking-wider">Labels</label>
              <div className="flex gap-1.5 flex-wrap">
                {labels.map((lbl) => {
                  const isSelected = (issue.labels || []).some((l) => l.id === lbl.id)
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => handleToggleLabel(lbl.id)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all border cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/20 text-primary shadow-xs'
                          : 'border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60'
                      )}
                      style={isSelected ? { borderColor: lbl.color, color: lbl.color, backgroundColor: `${lbl.color}20` } : {}}
                    >
                      {lbl.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Metadata Timestamps */}
            <div className="pt-3 border-t border-border/40 space-y-1 text-[10.5px] font-mono text-muted-foreground/70">
              <div>Created: {formatDate(issue.created_at)}</div>
              <div>Updated: {formatRelativeTime(issue.updated_at || issue.created_at)}</div>
              {issue.creator && <div>Reporter: {issue.creator.display_name || issue.creator.username}</div>}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Sub-Dialog */}
      {showDeleteConfirm && (
        <Dialog open onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
          <DialogContent className="max-w-md border-border/80 bg-popover">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <DialogTitle>Delete Issue</DialogTitle>
              </div>
              <DialogDescription className="text-[12px] text-muted-foreground">
                Are you sure you want to permanently delete{' '}
                <strong className="text-foreground font-mono">{getIssueDisplayIdentifier(issue.identifier)}</strong>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingIssue}
                className="text-[12px] h-8"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteIssue}
                disabled={deletingIssue}
                className="text-[12px] h-8 font-medium"
              >
                {deletingIssue ? 'Deleting...' : 'Delete Issue'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>

  )
}
