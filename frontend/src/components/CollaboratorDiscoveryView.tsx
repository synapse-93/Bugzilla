import React, { useState, useEffect } from 'react'
import { PublicProfile, Project, ProjectRole } from '../types'
import { api } from '../api/client'
import { Search, UserPlus, Globe, Briefcase, Sparkles, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface CollaboratorDiscoveryViewProps {
  currentProject: Project | null
  projects: Project[]
}

export function CollaboratorDiscoveryView({ currentProject, projects }: CollaboratorDiscoveryViewProps) {
  const [collaborators, setCollaborators] = useState<PublicProfile[]>([])
  const [searchSkill, setSearchSkill] = useState('')
  const [loading, setLoading] = useState(false)

  // Invite Modal state
  const [selectedCollaborator, setSelectedCollaborator] = useState<PublicProfile | null>(null)
  const [targetProjectId, setTargetProjectId] = useState<number>(currentProject?.id || (projects[0]?.id ?? 0))
  const [inviteRole, setInviteRole] = useState<ProjectRole>('DEVELOPER')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    loadCollaborators()
  }, [])

  const loadCollaborators = async (skill?: string) => {
    setLoading(true)
    try {
      const res = await api.auth.listCollaborators(skill)
      setCollaborators(res.collaborators)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load collaborators')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadCollaborators(searchSkill.trim() || undefined)
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCollaborator || !targetProjectId) return

    setInviting(true)
    try {
      await api.invitations.invite(targetProjectId, {
        username: selectedCollaborator.username,
        role: inviteRole,
      })
      toast.success(`Invitation sent to @${selectedCollaborator.username}!`)
      setSelectedCollaborator(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div className="card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} className="text-emerald-400" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Open Collaboration Discovery
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Discover and invite talented developers and engineers who are open to work on Bugzilla projects.
          </p>
        </div>

        {/* Search by Skill */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px' }}
              placeholder="Filter by skill (e.g. React, Python)..."
              value={searchSkill}
              onChange={(e) => setSearchSkill(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Collaborators Grid */}
      {loading ? (
        <div className="empty-state py-12">
          <p className="text-xs text-muted">Searching for open collaborators...</p>
        </div>
      ) : collaborators.length === 0 ? (
        <div className="card empty-state py-12">
          <Briefcase size={40} className="text-muted mb-2" />
          <div className="empty-state-title">No Open Collaborators Found</div>
          <p className="empty-state-desc">
            {searchSkill
              ? `No developers found matching skill "${searchSkill}".`
              : 'Developers can enable "Open to work" in their profile to appear in this discovery directory.'}
          </p>
          {searchSkill && (
            <button
              className="btn btn-secondary mt-2"
              onClick={() => {
                setSearchSkill('')
                loadCollaborators()
              }}
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {collaborators.map((collab) => (
            <div key={collab.id} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {collab.avatar_url ? (
                    <img
                      src={collab.avatar_url}
                      alt={collab.username}
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="user-avatar" style={{ width: '42px', height: '42px', fontSize: '15px', borderRadius: '50%' }}>
                      {collab.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {collab.display_name || collab.username}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{collab.username}</div>
                  </div>
                </div>

                <span className="badge badge-success" style={{ fontSize: '10px' }}>
                  Open to Work
                </span>
              </div>

              {collab.role_title && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Briefcase size={12} /> {collab.role_title}
                </div>
              )}

              {collab.bio && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  {collab.bio}
                </p>
              )}

              {/* Skills */}
              {collab.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {collab.skills.map((skill, idx) => (
                    <span key={idx} className="label-chip" style={{ fontSize: '10px', background: 'var(--bg-surface-raised)' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Links & Invite Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {collab.github_url && (
                    <a href={collab.github_url} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                    </a>
                  )}
                  {collab.linkedin_url && (
                    <a href={collab.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                      </svg>
                    </a>
                  )}
                  {collab.website_url && (
                    <a href={collab.website_url} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-icon">
                      <Globe size={14} />
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => setSelectedCollaborator(collab)}
                >
                  <UserPlus size={13} />
                  <span>Invite to Project</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {selectedCollaborator && (
        <div className="modal-overlay" onClick={() => setSelectedCollaborator(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>
                Invite @{selectedCollaborator.username}
              </h3>
            </div>

            <form onSubmit={handleSendInvite}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Select Project *</label>
                  <select
                    className="form-select"
                    value={targetProjectId}
                    onChange={(e) => setTargetProjectId(Number(e.target.value))}
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.display_key || p.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Project Role *</label>
                  <select
                    className="form-select"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                  >
                    <option value="DEVELOPER">Developer (Create & Edit Issues)</option>
                    <option value="MAINTAINER">Maintainer (Manage Labels, Milestones, Members)</option>
                    <option value="ADMIN">Admin (Full Project Ownership)</option>
                    <option value="VIEWER">Viewer (Read-Only Access)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedCollaborator(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={inviting || !targetProjectId}
                >
                  {inviting ? 'Sending...' : 'Send Project Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
