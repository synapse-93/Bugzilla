import React, { useState } from 'react'
import { Issue, Label, ProjectMember, IssueType, PriorityLevel, SeverityLevel } from '../types'
import { api } from '../api/client'
import { X, PlusCircle, Bug, Sparkles, CheckSquare, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface CreateIssueModalProps {
  projectId: number
  labels: Label[]
  members: ProjectMember[]
  onClose: () => void
  onIssueCreated: (issue: Issue) => void
}

export function CreateIssueModal({
  projectId,
  labels,
  members,
  onClose,
  onIssueCreated,
}: CreateIssueModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [issueType, setIssueType] = useState<IssueType>('BUG')
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM')
  const [severity, setSeverity] = useState<SeverityLevel>('MEDIUM')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  const handleToggleLabel = (labelId: number) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const res = await api.issues.create(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        issue_type: issueType,
        priority,
        severity,
        assignee_id: assigneeId ? Number(assigneeId) : null,
        label_ids: selectedLabelIds,
      })
      toast.success(`Issue ${res.issue.identifier} created!`)
      onIssueCreated(res.issue)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create issue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={18} className="text-blue-400" />
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Create New Issue</h3>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Issue Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Fix authentication redirect on expired token"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Steps to reproduce, expected behavior, logs..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Properties Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Issue Type</label>
                <select
                  className="form-select"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as IssueType)}
                >
                  <option value="BUG">Bug</option>
                  <option value="FEATURE">Feature</option>
                  <option value="TASK">Task</option>
                  <option value="IMPROVEMENT">Improvement</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assignee</label>
                <select
                  className="form-select"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={String(m.user_id)}>
                      {m.user?.username || `User ${m.user_id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Severity</label>
                <select
                  className="form-select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            {/* Labels Selection */}
            {labels.length > 0 && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Labels</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {labels.map((lbl) => {
                    const isSelected = selectedLabelIds.includes(lbl.id)
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
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
