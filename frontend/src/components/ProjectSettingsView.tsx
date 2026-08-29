import React, { useState } from 'react'
import { Project, ProjectMember, Label, Milestone } from '../types'
import { api } from '../api/client'
import { Settings, Users, Tag, AlertTriangle, Plus, Trash2, Shield, X, Check, Target } from 'lucide-react'
import { getDisplayProjectKey, formatDate } from '../utils/helpers'
import { toast } from 'sonner'

interface ProjectSettingsViewProps {
  project: Project
  members: ProjectMember[]
  labels: Label[]
  milestones?: Milestone[]
  onProjectUpdated: (updated: Project) => void
  onMembersUpdated: () => void
  onLabelsUpdated: () => void
  onProjectDeleted: () => void
}

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
]

export function ProjectSettingsView({
  project,
  members,
  labels,
  milestones = [],
  onProjectUpdated,
  onMembersUpdated,
  onLabelsUpdated,
  onProjectDeleted,
}: ProjectSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'labels' | 'danger'>('general')

  // General tab states
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [savingGeneral, setSavingGeneral] = useState(false)

  // Add Member Modal states
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [memberIdentifier, setMemberIdentifier] = useState('')
  const [memberRole, setMemberRole] = useState<'ADMIN' | 'MAINTAINER' | 'DEVELOPER' | 'VIEWER'>('DEVELOPER')
  const [addingMember, setAddingMember] = useState(false)

  // Add Label states
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6')
  const [addingLabel, setAddingLabel] = useState(false)

  // Delete Project states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [deletingProject, setDeletingProject] = useState(false)

  // Handle General Settings Update
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingGeneral(true)
    try {
      const res = await api.projects.update(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onProjectUpdated(res.project)
      toast.success('Project details saved')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project')
    } finally {
      setSavingGeneral(false)
    }
  }

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberIdentifier.trim()) return

    setAddingMember(true)
    try {
      const isEmail = memberIdentifier.includes('@')
      await api.projects.addMember(project.id, {
        [isEmail ? 'email' : 'username']: memberIdentifier.trim(),
        role: memberRole,
      })
      toast.success(`Member added as ${memberRole}`)
      setMemberIdentifier('')
      setIsAddMemberOpen(false)
      onMembersUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  // Handle Update Role
  const handleUpdateRole = async (userId: number, newRole: string) => {
    try {
      await api.projects.updateMemberRole(project.id, userId, newRole)
      toast.success('Member role updated')
      onMembersUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role')
    }
  }

  // Handle Remove Member
  const handleRemoveMember = async (userId: number) => {
    try {
      await api.projects.removeMember(project.id, userId)
      toast.success('Member removed from project')
      onMembersUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member')
    }
  }

  // Handle Create Label
  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabelName.trim()) return

    setAddingLabel(true)
    try {
      await api.labels.create(project.id, {
        name: newLabelName.trim().toLowerCase(),
        color: newLabelColor,
      })
      toast.success(`Label "${newLabelName}" created`)
      setNewLabelName('')
      onLabelsUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create label')
    } finally {
      setAddingLabel(false)
    }
  }

  // Handle Delete Label
  const handleDeleteLabel = async (labelId: number) => {
    try {
      await api.labels.delete(project.id, labelId)
      toast.success('Label deleted')
      onLabelsUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete label')
    }
  }

  // Handle Delete Project
  const handleDeleteProject = async () => {
    if (deleteConfirmInput !== project.name) return

    setDeletingProject(true)
    try {
      await api.projects.delete(project.id)
      toast.success(`Project "${project.name}" deleted`)
      onProjectDeleted()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete project')
      setDeletingProject(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '840px' }}>
      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: '16px' }}>
        <button
          className={`btn btn-ghost ${activeTab === 'general' ? 'active' : ''}`}
          style={{
            borderRadius: 0,
            borderBottom: activeTab === 'general' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'general' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '8px 4px',
          }}
          onClick={() => setActiveTab('general')}
        >
          <Settings size={15} />
          <span>General</span>
        </button>

        <button
          className={`btn btn-ghost ${activeTab === 'members' ? 'active' : ''}`}
          style={{
            borderRadius: 0,
            borderBottom: activeTab === 'members' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'members' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '8px 4px',
          }}
          onClick={() => setActiveTab('members')}
        >
          <Users size={15} />
          <span>Team Members ({members.length})</span>
        </button>

        <button
          className={`btn btn-ghost ${activeTab === 'labels' ? 'active' : ''}`}
          style={{
            borderRadius: 0,
            borderBottom: activeTab === 'labels' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'labels' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '8px 4px',
          }}
          onClick={() => setActiveTab('labels')}
        >
          <Tag size={15} />
          <span>Labels ({labels.length})</span>
        </button>

        <button
          className={`btn btn-ghost ${activeTab === 'danger' ? 'active' : ''}`}
          style={{
            borderRadius: 0,
            borderBottom: activeTab === 'danger' ? '2px solid var(--color-danger)' : '2px solid transparent',
            color: activeTab === 'danger' ? 'var(--color-danger)' : 'var(--text-muted)',
            padding: '8px 4px',
            marginLeft: 'auto',
          }}
          onClick={() => setActiveTab('danger')}
        >
          <AlertTriangle size={15} />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* Tab 1: General Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Project Display Key</label>
            <input
              type="text"
              className="form-input"
              value={getDisplayProjectKey(project.key)}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Project key is permanently locked to preserve valid issue identifier semantics (e.g. {getDisplayProjectKey(project.key)}-1).
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" type="submit" disabled={savingGeneral || !name.trim()}>
              {savingGeneral ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Members & Roles */}
      {activeTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Team Members</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manage project access roles and permissions.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setIsAddMemberOpen(true)}>
              <Plus size={14} />
              <span>Add Member</span>
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {members.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="user-avatar">
                    {m.user?.username ? m.user.username.substring(0, 2) : 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.user?.username || `User ${m.user_id}`}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {m.user?.email || `Joined ${formatDate(m.joined_at)}`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    className="form-select"
                    style={{ width: '130px', padding: '4px 8px', fontSize: '12px' }}
                    value={m.role}
                    onChange={(e) => handleUpdateRole(m.user_id, e.target.value)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MAINTAINER">Maintainer</option>
                    <option value="DEVELOPER">Developer</option>
                    <option value="VIEWER">Viewer</option>
                  </select>

                  <button
                    className="btn-ghost btn-icon text-danger"
                    title="Remove from project"
                    onClick={() => handleRemoveMember(m.user_id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Member Modal */}
          {isAddMemberOpen && (
            <div className="modal-overlay" onClick={() => setIsAddMemberOpen(false)}>
              <div className="modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Add Member to Project</h3>
                  <button className="btn-ghost btn-icon" onClick={() => setIsAddMemberOpen(false)}>
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddMember}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Username or Email *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. devtest or user@example.com"
                        value={memberIdentifier}
                        onChange={(e) => setMemberIdentifier(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select
                        className="form-select"
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value as any)}
                      >
                        <option value="ADMIN">Admin (Full management)</option>
                        <option value="MAINTAINER">Maintainer (Manage issues & labels)</option>
                        <option value="DEVELOPER">Developer (Edit & comment)</option>
                        <option value="VIEWER">Viewer (Read-only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button className="btn btn-secondary" type="button" onClick={() => setIsAddMemberOpen(false)}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit" disabled={addingMember || !memberIdentifier.trim()}>
                      {addingMember ? 'Adding...' : 'Add Member'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Labels */}
      {activeTab === 'labels' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Create Label Form */}
          <form onSubmit={handleCreateLabel} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Create New Label</h4>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                <label className="form-label">Label Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. frontend, high-priority, bug"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '9999px',
                        backgroundColor: c,
                        border: newLabelColor === c ? '2px solid #fff' : 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => setNewLabelColor(c)}
                    />
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" type="submit" disabled={addingLabel || !newLabelName.trim()}>
                <Plus size={14} />
                <span>Add Label</span>
              </button>
            </div>
          </form>

          {/* Labels List */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Existing Project Labels</h4>
            {labels.map((lbl) => (
              <div
                key={lbl.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--bg-surface-raised)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span
                  className="label-chip"
                  style={{
                    backgroundColor: `${lbl.color}25`,
                    color: lbl.color,
                    border: `1px solid ${lbl.color}50`,
                    fontSize: '12px',
                    padding: '3px 8px',
                  }}
                >
                  {lbl.name}
                </span>

                <button className="btn-ghost btn-icon text-danger" onClick={() => handleDeleteLabel(lbl.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Danger Zone */}
      {activeTab === 'danger' && (
        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)', marginBottom: '8px' }}>
            <AlertTriangle size={18} />
            <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Delete this project</h4>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Once you delete a project, there is no going back. All issues, comments, labels, and activities associated with <strong>{project.name}</strong> will be permanently deleted.
          </p>

          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={14} />
            <span>Delete Project</span>
          </button>
        </div>
      )}

      {/* Delete Project Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 120 }}>
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
                <AlertTriangle size={18} />
                <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Confirm Project Deletion</h3>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Please type <strong style={{ color: 'var(--text-primary)' }}>{project.name}</strong> to confirm deletion:
              </p>
              <input
                type="text"
                className="form-input"
                placeholder={project.name}
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deletingProject}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={deleteConfirmInput !== project.name || deletingProject}
                onClick={handleDeleteProject}
              >
                {deletingProject ? 'Deleting...' : 'I understand, delete this project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
