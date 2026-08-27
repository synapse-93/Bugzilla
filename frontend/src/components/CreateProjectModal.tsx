import React, { useState } from 'react'
import { Project } from '../types'
import { api } from '../api/client'
import { X, FolderPlus, AlertCircle } from 'lucide-react'

interface CreateProjectModalProps {
  onClose: () => void
  onProjectCreated: (project: Project) => void
}

export function CreateProjectModal({ onClose, onProjectCreated }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNameChange = (val: string) => {
    setName(val)
    if (!key || key.length === 0) {
      const generatedKey = val
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 4)
        .toUpperCase()
      setKey(generatedKey)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !key.trim()) {
      setError('Project name and key are required')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const res = await api.projects.create({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
      })
      onProjectCreated(res.project)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content standard-modal">
        <div className="modal-header">
          <div className="flex-row gap-2 items-center">
            <FolderPlus size={18} />
            <h2>Create New Project</h2>
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

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              placeholder="e.g. Bugzilla Core"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Project Key (Prefix) *</label>
            <input
              type="text"
              placeholder="e.g. BUG, CORE, API"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              required
              minLength={2}
              maxLength={10}
              className="font-mono uppercase"
            />
            <small className="form-hint">Used as the prefix for issue identifiers (e.g. {key || 'PROJ'}-123)</small>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={3}
              placeholder="Describe the purpose, repository, or scope of this project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
