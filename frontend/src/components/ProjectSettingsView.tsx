import React, { useState } from 'react'
import { Project, ProjectMember, Label, Milestone, ProjectRole } from '../types'
import { api } from '../api/client'
import { Settings, Users, Tag, AlertTriangle, Plus, Trash2, Shield, Loader2, Check } from 'lucide-react'
import { getDisplayProjectKey, formatDate } from '../utils/helpers'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { cn } from '@/lib/utils'

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

  React.useEffect(() => {
    setName(project.name)
    setDescription(project.description || '')
  }, [project.id, project.name, project.description])

  // Add Member Modal states
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [memberIdentifier, setMemberIdentifier] = useState('')
  const [memberRole, setMemberRole] = useState<ProjectRole>('DEVELOPER')
  const [addingMember, setAddingMember] = useState(false)

  // Add Label states
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6')
  const [addingLabel, setAddingLabel] = useState(false)

  // Delete Project states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [deletingProject, setDeletingProject] = useState(false)

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingGeneral(true)
    try {
      const res = await api.projects.update(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onProjectUpdated(res.project)
      toast.success('Project details updated')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project')
    } finally {
      setSavingGeneral(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberIdentifier.trim()) return

    setAddingMember(true)
    try {
      await api.invitations.invite(project.id, {
        username: memberIdentifier.trim(),
        role: memberRole,
      })
      toast.success(`Invitation sent to ${memberIdentifier.trim()}!`)
      setMemberIdentifier('')
      setIsAddMemberOpen(false)
      onMembersUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation')
    } finally {
      setAddingMember(false)
    }
  }

  const handleUpdateRole = async (userId: number, newRole: ProjectRole) => {
    try {
      await api.projects.updateMemberRole(project.id, userId, newRole)
      toast.success('Member role updated')
      onMembersUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role')
    }
  }

  const handleRemoveMember = async (userId: number) => {
    try {
      await api.projects.removeMember(project.id, userId)
      toast.success('Member removed from project')
      onMembersUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member')
    }
  }

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

  const handleDeleteLabel = async (labelId: number) => {
    try {
      await api.labels.delete(project.id, labelId)
      toast.success('Label deleted')
      onLabelsUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete label')
    }
  }

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
    <div className="space-y-6 max-w-4xl w-full min-w-0">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <TabsList className="grid grid-cols-4 h-9">
          <TabsTrigger value="general" className="text-[12px] gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="text-[12px] gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>Team ({members.length})</span>
          </TabsTrigger>
          <TabsTrigger value="labels" className="text-[12px] gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            <span>Labels ({labels.length})</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="text-[12px] gap-1.5 text-destructive hover:text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Danger Zone</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: General */}
        <TabsContent value="general" className="pt-4">
          <Card className="border-border/80 bg-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-bold text-foreground">Project Details</CardTitle>
              <CardDescription className="text-[12px] text-muted-foreground">
                Manage basic settings, display key, and description.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <form onSubmit={handleSaveGeneral} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-foreground">Project Name *</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="text-[13px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-foreground">Project Key (Identifier Prefix)</label>
                  <Input
                    type="text"
                    value={getDisplayProjectKey(project.key)}
                    disabled
                    className="text-[13px] font-mono opacity-60 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Project key is permanently locked to preserve issue identifiers (e.g.{' '}
                    {getDisplayProjectKey(project.key)}-1).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-foreground">Description</label>
                  <Textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe what this project is building..."
                    className="text-[13px]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" disabled={savingGeneral || !name.trim()} className="text-[12px]">
                    {savingGeneral ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    <span>Save Changes</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Members */}
        <TabsContent value="members" className="pt-4 space-y-4">
          <Card className="border-border/80 bg-card">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Team Members</CardTitle>
                <CardDescription className="text-[12px] text-muted-foreground">
                  Collaborators with assigned permissions on this project.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddMemberOpen(true)} className="gap-1 text-[12px] h-8">
                <Plus className="h-3.5 w-3.5" />
                <span>Invite Member</span>
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="divide-y divide-border/60">
                {members.map((m) => {
                  const displayName = m.user?.display_name || m.user?.username || `User ${m.user_id}`
                  const initials = displayName.substring(0, 2).toUpperCase()
                  return (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          {m.user?.avatar_url && <AvatarImage src={m.user.avatar_url} alt={displayName} />}
                          <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-foreground truncate">{displayName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{m.user?.email || `@${m.user?.username}`}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m.user_id, e.target.value as ProjectRole)}
                          className="h-7 rounded-md border border-input bg-background px-2 text-[11.5px] text-foreground focus:outline-none cursor-pointer"
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="DEVELOPER">Developer</option>
                          <option value="REPORTER">Reporter</option>
                          <option value="VIEWER">Viewer</option>
                        </select>

                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7"
                          title="Remove Member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Labels */}
        <TabsContent value="labels" className="pt-4 space-y-4">
          <Card className="border-border/80 bg-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-bold text-foreground">Project Labels</CardTitle>
              <CardDescription className="text-[12px] text-muted-foreground">
                Categorize issues with colored taxonomy chips.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
              {/* Create Label Form */}
              <form onSubmit={handleCreateLabel} className="p-3 rounded-md border border-border/70 bg-muted/20 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Label Name</label>
                    <Input
                      type="text"
                      placeholder="e.g. backend, ui, critical-path"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      required
                      className="text-[12.5px] h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Color</label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {PRESET_COLORS.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setNewLabelColor(col)}
                          className={cn(
                            'h-5 w-5 rounded-full transition-transform cursor-pointer',
                            newLabelColor === col && 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                          )}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button type="submit" size="sm" disabled={addingLabel || !newLabelName.trim()} className="h-7 text-[11.5px]">
                    {addingLabel ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                    <span>Add Label</span>
                  </Button>
                </div>
              </form>

              {/* Labels List */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {labels.map((lbl) => (
                  <div
                    key={lbl.id}
                    className="flex items-center justify-between p-2 rounded-md border border-border/60 bg-muted/10"
                  >
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-medium border"
                      style={{
                        backgroundColor: `${lbl.color}20`,
                        color: lbl.color,
                        borderColor: `${lbl.color}40`,
                      }}
                    >
                      {lbl.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleDeleteLabel(lbl.id)}
                      className="h-5 w-5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Danger Zone */}
        <TabsContent value="danger" className="pt-4">
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-bold text-destructive">Danger Zone</CardTitle>
              <CardDescription className="text-[12px] text-muted-foreground">
                Irreversible actions regarding this project and all its issues.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Delete this project</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    Permanently delete this project, all associated issues, comments, and milestones.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-[12px] shrink-0"
                >
                  Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Member Dialog */}
      {isAddMemberOpen && (
        <Dialog open onOpenChange={(open) => !open && setIsAddMemberOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Users className="h-4 w-4" />
                <DialogTitle>Invite Project Member</DialogTitle>
              </div>
              <DialogDescription>
                Send an invitation to a Kaizen developer by handle or email.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddMember} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Username or Email *</label>
                <Input
                  type="text"
                  placeholder="developer or dev@domain.com"
                  value={memberIdentifier}
                  onChange={(e) => setMemberIdentifier(e.target.value)}
                  required
                  autoFocus
                  className="text-[13px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Role</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as ProjectRole)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-[12.5px] text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="DEVELOPER">Developer (Work on and create issues)</option>
                  <option value="ADMIN">Admin (Full project configuration)</option>
                  <option value="REPORTER">Reporter (File issues only)</option>
                  <option value="VIEWER">Viewer (Read-only)</option>
                </select>
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddMemberOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={addingMember || !memberIdentifier.trim()}>
                  {addingMember ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  <span>Send Invitation</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Project Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog open onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <DialogTitle>Delete Project "{project.name}"</DialogTitle>
              </div>
              <DialogDescription>
                This action is permanent and cannot be undone. To confirm, please type{' '}
                <strong className="text-foreground">{project.name}</strong> below:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <Input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={project.name}
                className="text-[13px]"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingProject}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteProject}
                disabled={deletingProject || deleteConfirmInput !== project.name}
              >
                {deletingProject ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
