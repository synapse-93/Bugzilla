import React, { useState, useEffect } from 'react'
import { Invitation, Project } from '../types'
import { api } from '../api/client'
import { X, Mail, Check, Ban, FolderGit2 } from 'lucide-react'
import { toast } from 'sonner'

interface InvitationsModalProps {
  isOpen: boolean
  onClose: () => void
  onAccepted: (project: Project) => void
}

export function InvitationsModal({ isOpen, onClose, onAccepted }: InvitationsModalProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadInvitations()
    }
  }, [isOpen])

  const loadInvitations = async () => {
    setLoading(true)
    try {
      const res = await api.invitations.myInvitations()
      setInvitations(res.invitations)
    } catch (err) {
      console.error('Failed to fetch invitations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (invitationId: number) => {
    setProcessingId(invitationId)
    try {
      const res = await api.invitations.accept(invitationId)
      toast.success(`Joined project ${res.project.name}!`)
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId))
      onAccepted(res.project)
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept invitation')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (invitationId: number) => {
    setProcessingId(invitationId)
    try {
      await api.invitations.decline(invitationId)
      toast.info('Invitation declined')
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId))
    } catch (err: any) {
      toast.error(err.message || 'Failed to decline invitation')
    } finally {
      setProcessingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} className="text-blue-400" />
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Project Invitations</h3>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div className="empty-state py-6">
              <p className="text-xs text-muted">Checking for invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="empty-state py-8">
              <Mail size={32} className="text-muted mb-2" />
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                No Pending Invitations
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                You have no pending project collaboration invites.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="card"
                  style={{
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    background: 'var(--bg-surface-raised)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div className="brand-icon" style={{ width: '32px', height: '32px', borderRadius: '6px' }}>
                        <FolderGit2 size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {inv.project_name} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({inv.project_key})</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Invited by <strong>@{inv.inviter_username}</strong> as{' '}
                          <span className="badge badge-info" style={{ fontSize: '9px', padding: '1px 5px' }}>
                            {inv.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      disabled={processingId === inv.id}
                      onClick={() => handleDecline(inv.id)}
                    >
                      <Ban size={12} />
                      Decline
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      disabled={processingId === inv.id}
                      onClick={() => handleAccept(inv.id)}
                    >
                      <Check size={12} />
                      Accept & Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
