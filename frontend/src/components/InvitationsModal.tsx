import React, { useState, useEffect } from 'react'
import { Invitation, Project } from '../types'
import { api } from '../api/client'
import { Mail, Check, Ban, FolderGit2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Card } from './ui/card'

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Mail className="h-4 w-4" />
            <DialogTitle>Project Invitations</DialogTitle>
          </div>
          <DialogDescription>
            Collaborations and team invites sent to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[360px] overflow-y-auto space-y-2.5 py-2">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-[12px]">
              Checking for pending invitations...
            </div>
          ) : invitations.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-[13px] font-semibold text-foreground">No Pending Invitations</p>
              <p className="text-[11.5px] text-muted-foreground mt-0.5">
                You're all caught up! New invites from teammates will appear here.
              </p>
            </div>
          ) : (
            invitations.map((inv) => (
              <Card key={inv.id} className="p-3.5 border-border/80 bg-card space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 border border-primary/20 text-primary shrink-0">
                    <FolderGit2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-foreground truncate">
                      {inv.project_name}{' '}
                      <span className="text-[11px] font-mono text-muted-foreground font-normal">
                        ({inv.project_key})
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Invited by <strong className="text-foreground">@{inv.inviter_username}</strong> as{' '}
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-primary/15 text-primary border border-primary/20">
                        {inv.role}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={processingId === inv.id}
                    onClick={() => handleDecline(inv.id)}
                    className="h-7 text-[11px]"
                  >
                    <Ban className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span>Decline</span>
                  </Button>
                  <Button
                    size="sm"
                    disabled={processingId === inv.id}
                    onClick={() => handleAccept(inv.id)}
                    className="h-7 text-[11px] font-medium"
                  >
                    {processingId === inv.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    <span>Accept & Join</span>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-[12px]">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
