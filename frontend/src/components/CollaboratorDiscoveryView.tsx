import React, { useState, useEffect } from 'react'
import { PublicProfile, Project, ProjectRole } from '../types'
import { api } from '../api/client'
import { Search, UserPlus, Globe, Briefcase, Sparkles, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
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
    <div className="space-y-6 max-w-[1400px] w-full min-w-0">
      {/* Top Banner */}
      <Card className="border-border/80 bg-card p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Collaborator Discovery
            </h2>
          </div>
          <p className="text-[12.5px] text-muted-foreground">
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
              className="pl-8 h-8 text-[12.5px]"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-8 text-[12px]">
            Search
          </Button>
        </form>
      </Card>

      {/* Collaborators Grid */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-[13px]">
          Searching available collaborators...
        </div>
      ) : collaborators.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Globe className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No collaborators found</h3>
          <p className="text-[12px] text-muted-foreground max-w-sm mx-auto mt-1">
            {searchSkill
              ? `No developers found matching skill "${searchSkill}". Try a broader term.`
              : 'Enable "Open to Collaborate" in your profile to be discoverable!'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collaborators.map((c) => {
            const displayName = c.display_name || c.username
            const initials = displayName.substring(0, 2).toUpperCase()
            const rawSkills = c.skills
            const skillsList: string[] = Array.isArray(rawSkills)
              ? rawSkills
              : typeof rawSkills === 'string'
              ? (rawSkills as string).split(',').map((s: string) => s.trim()).filter(Boolean)
              : []

            return (
              <Card key={c.id} className="border-border/80 bg-card p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        {c.avatar_url && <AvatarImage src={c.avatar_url} alt={displayName} />}
                        <AvatarFallback className="bg-primary/20 text-primary text-[11px] font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[13px] text-foreground truncate">{displayName}</h3>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">@{c.username}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      Open to Work
                    </span>
                  </div>

                  {c.bio && (
                    <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {c.bio}
                    </p>
                  )}

                  {skillsList.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {skillsList.slice(0, 5).map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-muted/40 text-foreground border border-border/60"
                        >
                          {sk}
                        </span>
                      ))}
                      {skillsList.length > 5 && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          +{skillsList.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
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
                    className="h-7 text-[11.5px] gap-1.5 font-medium"
                  >
                    <UserPlus className="h-3 w-3" />
                    <span>Invite</span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Invite Modal */}
      {selectedCollaborator && (
        <Dialog open onOpenChange={(open) => !open && setSelectedCollaborator(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Mail className="h-4 w-4" />
                <DialogTitle>Invite @{selectedCollaborator.username}</DialogTitle>
              </div>
              <DialogDescription>
                Invite this developer to join and contribute to a project.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Target Project</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(Number(e.target.value))}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-[12.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-[12.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
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
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={inviting || !targetProjectId}>
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
