import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, ShieldCheck, Mail, Globe, Sparkles, UserCheck, Briefcase } from 'lucide-react'
import { toast } from 'sonner'

export function ProfileView() {
  const { user, updateUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [roleTitle, setRoleTitle] = useState(user?.role_title || '')
  const [skills, setSkills] = useState((user?.skills || []).join(', '))
  const [githubUrl, setGithubUrl] = useState(user?.github_url || '')
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || '')
  const [websiteUrl, setWebsiteUrl] = useState(user?.website_url || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [isOpenToWork, setIsOpenToWork] = useState(user?.is_open_to_work || false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '')
      setBio(user.bio || '')
      setRoleTitle(user.role_title || '')
      setSkills((user.skills || []).join(', '))
      setGithubUrl(user.github_url || '')
      setLinkedinUrl(user.linkedin_url || '')
      setWebsiteUrl(user.website_url || '')
      setAvatarUrl(user.avatar_url || '')
      setIsOpenToWork(user.is_open_to_work || false)
    }
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      await updateUser({
        display_name: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        role_title: roleTitle.trim() || undefined,
        skills: skillsArray,
        github_url: githubUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        is_open_to_work: isOpenToWork,
      })
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Profile Card */}
      <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.username}
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-subtle)' }}
            />
          ) : (
            <div
              className="user-avatar"
              style={{ width: '64px', height: '64px', fontSize: '20px', borderRadius: '50%' }}
            >
              {user.username[0].toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {displayName || user.username}
              </h2>
              <span className="badge badge-info" style={{ fontSize: '10px' }}>
                {user.auth_provider}
              </span>
              {user.is_email_verified && (
                <span className="badge badge-success" style={{ fontSize: '10px' }}>
                  Verified
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              @{user.username} {user.email && `• ${user.email}`}
            </div>
            {roleTitle && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Briefcase size={12} /> {roleTitle}
              </div>
            )}
          </div>
        </div>

        {/* Open to Work Toggle Banner */}
        <div
          style={{
            background: isOpenToWork ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-raised)',
            border: isOpenToWork ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: isOpenToWork ? '#34d399' : 'var(--text-primary)' }}>
              Open to Work / Collaboration
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isOpenToWork ? 'Visible to project creators seeking talent' : 'Currently private from discovery'}
            </div>
          </div>
          <button
            type="button"
            className={isOpenToWork ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              background: isOpenToWork ? 'var(--status-resolved-bg)' : undefined,
              color: isOpenToWork ? 'var(--status-resolved-text)' : undefined,
            }}
            onClick={() => setIsOpenToWork(!isOpenToWork)}
          >
            {isOpenToWork ? 'Enabled (ON)' : 'Disabled (OFF)'}
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          Profile Information
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Display Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Alex Johnson"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Professional Role / Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Full Stack Developer, QA Engineer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Bio</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Tell other project members and collaborators about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Skills (Comma-separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. React, TypeScript, Python, Flask, PostgreSQL, Docker"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Avatar Image URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          {/* Social Links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">GitHub URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://github.com/username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">LinkedIn URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Personal / Portfolio Website</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://yourportfolio.dev"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
