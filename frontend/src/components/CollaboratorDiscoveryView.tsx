import React, { useState, useEffect } from 'react'
import { PublicProfile, Project, ProjectRole } from '../types'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Search, UserPlus, Globe, Briefcase, Sparkles, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'

interface CollaboratorDiscoveryViewProps {
  currentProject: Project | null
  projects: Project[]
}

export function CollaboratorDiscoveryView({ currentProject, projects }: CollaboratorDiscoveryViewProps) {
  const { user } = useAuth()
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

  // Self-discovery filtering: exclude currently authenticated user by ID, username, or email
  const isCurrentUser = (c: PublicProfile) => {
    if (!user) return false
    if (user.id !== undefined && c.id !== undefined && String(user.id) === String(c.id)) {
      return true
    }
    if (user.username && c.username && user.username.trim().toLowerCase() === c.username.trim().toLowerCase()) {
      return true
    }
    if (user.email && c.email && user.email.trim().toLowerCase() === c.email.trim().toLowerCase()) {
      return true
    }
    return false
  }

  const filteredCollaborators = collaborators.filter((c) => !isCurrentUser(c))

  return (
    <div className="space-y-5 max-w-[1400px] w-full min-w-0">
      {/* Top Banner */}
      <div className="rounded-lg border border-border/60 bg-card/40 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Collaborator Discovery
            </h2>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Find and invite skilled developers and engineers open to collaborating on Kaizen projects.
          </p>
        </div>

        {/* Search by Skill */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto min-w-[260px]">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search skill (e.g. React, Python)..."
              value={searchSkill}
              onChange={(e) => setSearchSkill(e.target.value)}
              className="pl-8 h-8 text-[12px] bg-background/50 border-border/70"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-8 text-[12px] shadow-xs">
            Search
          </Button>
        </form>
      </div>

      {/* Collaborators Grid */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-[12px] font-mono">
          Searching available collaborators...
        </div>
      ) : filteredCollaborators.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-card/20 p-12 text-center">
          <Globe className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground">No other collaborators found</h3>
          <p className="text-[12px] text-muted-foreground max-w-sm mx-auto mt-1">
            {searchSkill
              ? `No other developers found matching skill "${searchSkill}". Try a broader term.`
              : 'No other developers are currently open to collaborate. Teammates who enable "Open to Collaborate" will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCollaborators.map((c) => {
            const displayName = c.display_name || c.username
            const initials = displayName.substring(0, 2).toUpperCase()
            const rawSkills = c.skills
            const skillsList: string[] = Array.isArray(rawSkills)
              ? rawSkills
              : typeof rawSkills === 'string'
              ? (rawSkills as string).split(',').map((s: string) => s.trim()).filter(Boolean)
              : []

            return (
              <div key={c.id} className="rounded-lg border border-border/60 bg-card/40 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0 border border-border/60">
                        {c.avatar_url && <AvatarImage src={c.avatar_url} alt={displayName} />}
                        <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-mono font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[13px] text-foreground truncate">{displayName}</h3>
                        <p className="text-[10.5px] text-muted-foreground font-mono truncate">@{c.username}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shrink-0">
                      Open to Work
                    </span>
                  </div>

                  {c.bio && (
                    <p className="text-[11.5px] text-muted-foreground line-clamp-2">
                      {c.bio}
                    </p>
                  )}

                  {skillsList.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {skillsList.slice(0, 5).map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-muted/40 text-foreground border border-border/60"
                        >
                          {sk}
                        </span>
                      ))}
                      {skillsList.length > 5 && (
                        <span className="text-[9.5px] text-muted-foreground font-mono">
                          +{skillsList.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-border/40 flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>Developer</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedCollaborator(c)
                      setTargetProjectId(currentProject?.id || (projects[0]?.id ?? 0))
                    }}
                    className="h-7 text-[11px] gap-1.5 font-medium shadow-xs"
                  >
                    <UserPlus className="h-3 w-3" />
                    <span>Invite</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* In-app Invite Modal Dialog */}
      {selectedCollaborator && (
        <Dialog open onOpenChange={(open) => !open && setSelectedCollaborator(null)}>
          <DialogContent className="max-w-md border-border/80 bg-popover">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Mail className="h-4 w-4" />
                <DialogTitle>Invite @{selectedCollaborator.username}</DialogTitle>
              </div>
              <DialogDescription className="text-[12px] text-muted-foreground">
                Invite this developer to join and contribute to a project workspace.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSendInvite} className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <label className="text-[11.5px] font-medium text-muted-foreground">Target Project</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(Number(e.target.value))}
                  className="w-full h-8 rounded-md border border-border/70 bg-background/50 px-2.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-medium text-muted-foreground">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                  className="w-full h-8 rounded-md border border-border/70 bg-background/50 px-2.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="DEVELOPER">Developer (Report & work on issues)</option>
                  <option value="ADMIN">Admin (Full project management)</option>
                  <option value="REPORTER">Reporter (Read & file issues only)</option>
                </select>
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCollaborator(null)}
                  className="text-[12px] h-8"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={inviting || !targetProjectId} className="text-[12px] h-8 font-medium">
                  {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send Invite'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

