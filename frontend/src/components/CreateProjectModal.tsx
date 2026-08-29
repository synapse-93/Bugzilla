import React, { useState } from 'react'
import { Project } from '../types'
import { api } from '../api/client'
import { X, FolderPlus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface CreateProjectModalProps {
  onClose: () => void
  onProjectCreated: (project: Project) => void
}

export function CreateProjectModal({ onClose, onProjectCreated }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false)

  const handleNameChange = (val: string) => {
    setName(val)
    if (!isKeyManuallyEdited && val.trim().length >= 2) {
      const words = val.trim().split(/\s+/)
      let suggestedKey = ''
      if (words.length === 1) {
        suggestedKey = words[0].substring(0, 4).toUpperCase()
      } else {
        suggestedKey = words
          .slice(0, 4)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
      }
      setKey(suggestedKey.replace(/[^A-Z0-9]/g, ''))
    }
  }

  const handleKeyChange = (val: string) => {
    setIsKeyManuallyEdited(true)
    setKey(val.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !key.trim()) return

    setLoading(true)
    try {
      const res = await api.projects.createWithFallbackKey({
        name: name.trim(),
        key: key.trim(),
        description: description.trim() || undefined,
      })
      toast.success(`Project "${res.project.name}" created successfully!`)
      onProjectCreated(res.project)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderPlus size={18} className="text-purple-400" />
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Create New Project</h3>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Bugzilla Frontend, Core API"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Project Key *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. TEST, PROJ"
                  value={key}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Used as the prefix for all issue identifiers, e.g. <strong>{key || 'KEY'}-1</strong>, <strong>{key || 'KEY'}-42</strong>.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="What is the goal of this project?"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || !name.trim() || key.trim().length < 2}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
