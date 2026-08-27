import React, { useState } from 'react'
import { Project, ProjectMember, Label } from '../types'
import { api } from '../api/client'
import {
  Users,
  Tag,
  Shield,
  Trash2,
  Plus,
  Save,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface ProjectSettingsViewProps {
  project: Project
  members: ProjectMember[]
  labels: Label[]
  onProjectUpdated: (project: Project) => void
  onMembersUpdated: () => void
  onLabelsUpdated: () => void
  onProjectDeleted: () => void
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b',
]

export function ProjectSettingsView({
  project,
  members,
  labels,
  onProjectUpdated,
  onMembersUpdated,
  onLabelsUpdated,
  onProjectDeleted,
}: ProjectSettingsViewProps) {
  // Project Info
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoSuccess, setInfoSuccess] = useState(false)

  // Member Management
  const [newMemberIdentifier, setNewMemberIdentifier] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'ADMIN' | 'MAINTAINER' | 'DEVELOPER' | 'VIEWER'>('DEVELOPER')
  const [addingMember, setAddingMember] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)

  // Label Management
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6')
  const [creatingLabel, setCreatingLabel] = useState(false)
  const [labelError, setLabelError] = useState<string | null>(null)

  // General Error
  const [error, setError] = useState<string | null>(null)

  const handleUpdateProjectInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingInfo(true)
    setError(null)
    setInfoSuccess(false)

    try {
      const res = await api.projects.update(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onProjectUpdated(res.project)
      setInfoSuccess(true)
      setTimeout(() => setInfoSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update project info')
    } finally {
      setSavingInfo(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberIdentifier.trim()) return

    setAddingMember(true)
    setMemberError(null)

    try {
      await api.projects.addMember(project.id, {
        username: newMemberIdentifier.trim(),
        role: newMemberRole,
      })
      setNewMemberIdentifier('')
      onMembersUpdated()
    } catch (err: any) {
      setMemberError(err.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await api.projects.updateMemberRole(project.id, userId, role)
      onMembersUpdated()
    } catch (err: any) {
      setMemberError(err.message || 'Failed to update member role')
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) return
    try {
      await api.projects.removeMember(project.id, userId)
      onMembersUpdated()
    } catch (err: any) {
      setMemberError(err.message || 'Failed to remove member')
    }
  }

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabelName.trim()) return

    setCreatingLabel(true)
    setLabelError(null)

    try {
      await api.labels.create(project.id, {
        name: newLabelName.trim().toLowerCase(),
        color: newLabelColor,
      })
      setNewLabelName('')
      onLabelsUpdated()
    } catch (err: any) {
      setLabelError(err.message || 'Failed to create label')
    } finally {
      setCreatingLabel(false)
    }
  }

  const handleDeleteLabel = async (labelId: number) => {
    try {
      await api.labels.delete(project.id, labelId)
      onLabelsUpdated()
    } catch (err: any) {
      setLabelError(err.message || 'Failed to delete label')
    }
  }

  const handleDeleteProject = async () => {
    const promptKey = prompt(
      `To permanently delete project "${project.name}", please type the project key "${project.key}":`
    )
    if (promptKey !== project.key) {
      alert('Project key did not match. Deletion cancelled.')
      return
    }

    try {
      await api.projects.delete(project.id)
      onProjectDeleted()
    } catch (err: any) {
      setError(err.message || 'Failed to delete project')
    }
  }

  return (
    <div className="settings-container">
      {error && (
        <div className="error-banner mb-4">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* General Settings */}
      <div className="settings-card">
        <div className="card-header-row">
          <h3>Project Details</h3>
          <span className="font-mono text-xs text-muted">KEY: {project.key}</span>
        </div>

        <form onSubmit={handleUpdateProjectInfo} className="settings-form">
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project building or tracking?"
            />
          </div>

          <div className="flex-row items-center gap-3">
            <button type="submit" className="btn-primary btn-sm" disabled={savingInfo}>
              <Save size={14} />
              <span>{savingInfo ? 'Saving...' : 'Save Changes'}</span>
            </button>
            {infoSuccess && (
              <span className="text-success text-sm flex-row items-center gap-1">
                <CheckCircle2 size={14} /> Saved successfully
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Team Members */}
      <div className="settings-card">
        <div className="card-header-row">
          <div className="flex-row gap-2 items-center">
            <Users size={16} />
            <h3>Team Members ({members.length})</h3>
          </div>
        </div>

        {memberError && (
          <div className="error-banner mb-3">
            <AlertCircle size={14} />
            <span>{memberError}</span>
          </div>
        )}

        <div className="members-table-wrapper">
          <table className="members-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th style={{ width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-xs">
                        {m.user?.username ? m.user.username.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="user-text">
                        <strong>{m.user?.username || `User #${m.user_id}`}</strong>
                        {m.user?.email && <span className="text-xs text-muted">{m.user.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="role-select"
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MAINTAINER">MAINTAINER</option>
                      <option value="DEVELOPER">DEVELOPER</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </td>
                  <td className="text-xs text-muted">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn-icon-xs text-muted hover-danger"
                      onClick={() => handleRemoveMember(m.user_id)}
                      title="Remove Member"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Member Form */}
        <form onSubmit={handleAddMember} className="add-inline-form mt-4">
          <input
            type="text"
            placeholder="Username or email of user..."
            value={newMemberIdentifier}
            onChange={(e) => setNewMemberIdentifier(e.target.value)}
          />
          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value as any)}
          >
            <option value="ADMIN">Admin</option>
            <option value="MAINTAINER">Maintainer</option>
            <option value="DEVELOPER">Developer</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <button type="submit" className="btn-secondary btn-sm" disabled={addingMember}>
            <Plus size={14} />
            <span>{addingMember ? 'Adding...' : 'Add Member'}</span>
          </button>
        </form>
      </div>

      {/* Label Management */}
      <div className="settings-card">
        <div className="card-header-row">
          <div className="flex-row gap-2 items-center">
            <Tag size={16} />
            <h3>Project Labels ({labels.length})</h3>
          </div>
        </div>

        {labelError && (
          <div className="error-banner mb-3">
            <AlertCircle size={14} />
            <span>{labelError}</span>
          </div>
        )}

        <div className="labels-badge-grid">
          {labels.map((lbl) => (
            <div
              key={lbl.id}
              className="label-manage-chip"
              style={{
                backgroundColor: `${lbl.color}22`,
                borderColor: `${lbl.color}44`,
                color: lbl.color,
              }}
            >
              <span>{lbl.name}</span>
              <button
                className="btn-delete-chip"
                onClick={() => handleDeleteLabel(lbl.id)}
                title="Delete Label"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Create Label Form */}
        <form onSubmit={handleCreateLabel} className="add-inline-form mt-4">
          <input
            type="text"
            placeholder="New label name (e.g. regression)..."
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
          />
          <div className="color-picker-row">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-dot-btn ${newLabelColor === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setNewLabelColor(c)}
              />
            ))}
          </div>
          <button type="submit" className="btn-secondary btn-sm" disabled={creatingLabel}>
            <Plus size={14} />
            <span>{creatingLabel ? 'Creating...' : 'Add Label'}</span>
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="settings-card border-danger-tint">
        <div className="card-header-row">
          <div className="flex-row gap-2 items-center text-red">
            <AlertTriangle size={16} />
            <h3 className="text-red">Danger Zone</h3>
          </div>
        </div>
        <p className="text-muted text-sm mb-3">
          Permanently delete this project and all associated issues, comments, labels, and activity history. This action cannot be undone.
        </p>
        <button className="btn-danger" onClick={handleDeleteProject}>
          <Trash2 size={14} />
          <span>Delete Project</span>
        </button>
      </div>
    </div>
  )
}
