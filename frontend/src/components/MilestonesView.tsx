import React, { useState } from 'react'
import { Milestone, Issue } from '../types'
import { Target, Plus, Calendar, CheckCircle, Clock, Trash2, X } from 'lucide-react'
import { formatDate } from '../utils/helpers'
import { toast } from 'sonner'

interface MilestonesViewProps {
  projectId: number
  milestones: Milestone[]
  issues: Issue[]
  onAddMilestone: (milestone: Milestone) => void
  onDeleteMilestone: (id: string) => void
}

export function MilestonesView({
  projectId,
  milestones,
  issues,
  onAddMilestone,
  onDeleteMilestone,
}: MilestonesViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const newMilestone: Milestone = {
      id: Math.random().toString(36).substring(2, 9),
      project_id: projectId,
      name: name.trim(),
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
      status: 'OPEN',
      created_at: new Date().toISOString(),
    }

    onAddMilestone(newMilestone)
    setName('')
    setDescription('')
    setDueDate('')
    setIsCreateModalOpen(false)
    toast.success(`Milestone "${newMilestone.name}" created`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Project Milestones</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Track project deliverables, releases, and completion goals.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={15} />
          <span>New Milestone</span>
        </button>
      </div>

      {/* Milestones Grid */}
      {milestones.length === 0 ? (
        <div className="card empty-state py-12">
          <Target size={40} className="text-muted mb-2" />
          <div className="empty-state-title">No milestones set</div>
          <p className="empty-state-desc">
            Define version targets (e.g. v1.0, Sprint 1) to track group deliverables.
          </p>
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={15} />
            <span>Create First Milestone</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {milestones.map((m) => {
            const milestoneIssues = issues.filter((i) => i.milestone_id === m.id)
            const total = milestoneIssues.length
            const closed = milestoneIssues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length
            const progress = total > 0 ? Math.round((closed / total) * 100) : 0

            return (
              <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Target size={16} className="text-blue-400" />
                      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</span>
                    </div>
                    <button className="btn-ghost btn-icon text-danger" onClick={() => onDeleteMilestone(m.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {m.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                      {m.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Progress</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-surface-raised)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--accent-primary)', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    <span>Due: {m.due_date ? formatDate(m.due_date) : 'No due date'}</span>
                  </div>
                  <div>
                    {closed}/{total} issues closed
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Milestone Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Create New Milestone</h3>
              <button className="btn-ghost btn-icon" onClick={() => setIsCreateModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Milestone Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. v1.0.0 or Q3 Sprint"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Key objectives and deliverable targets..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={!name.trim()}>
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
