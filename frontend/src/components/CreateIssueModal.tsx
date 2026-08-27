import React, { useState } from 'react'
import {
  Issue,
  Label,
  ProjectMember,
  IssueType,
  PriorityLevel,
  SeverityLevel,
} from '../types'
import { api } from '../api/client'
import { X, Plus, AlertCircle } from 'lucide-react'

interface CreateIssueModalProps {
  projectId: number
  labels: Label[]
  members: ProjectMember[]
  onClose: () => void
  onIssueCreated: (newIssue: Issue) => void
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
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined)
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const res = await api.issues.create(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        issue_type: issueType,
        priority,
        severity,
        assignee_id: assigneeId,
        label_ids: selectedLabelIds,
      })
      onIssueCreated(res.issue)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create issue')
    } finally {
      setSubmitting(false)
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
      <div className="modal-content standard-modal">
        <div className="modal-header">
          <h2>Create New Issue</h2>
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

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="e.g. Unhandled exception on project checkout"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
              >
                <option value="BUG">Bug</option>
                <option value="FEATURE">Feature</option>
                <option value="TASK">Task</option>
                <option value="IMPROVEMENT">Improvement</option>
              </select>
            </div>

            <div className="form-group">
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

            <div className="form-group">
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
          </div>

          <div className="form-group">
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

          {labels.length > 0 && (
            <div className="form-group">
              <label>Labels</label>
              <div className="labels-toggle-list">
                {labels.map((lbl) => {
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
                })}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={4}
              placeholder="Describe the defect, steps to reproduce, environment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
