import React, { useState } from 'react'
import { Milestone, Issue } from '../types'
import { api } from '../api/client'
import { Target, Plus, Calendar, CheckCircle2, Clock, Trash2, Loader2 } from 'lucide-react'
import { formatDate } from '../utils/helpers'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { cn } from '@/lib/utils'

interface MilestonesViewProps {
  projectId: number
  milestones: Milestone[]
  issues: Issue[]
  onAddMilestone: (milestone: Milestone) => void
  onDeleteMilestone: (id: number | string) => void
}

export function MilestonesView({
  projectId,
  milestones,
  issues,
  onAddMilestone,
  onDeleteMilestone,
}: MilestonesViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const res = await api.milestones.create(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
      })
      onAddMilestone(res.milestone)
      setName('')
      setDescription('')
      setDueDate('')
      setIsCreateModalOpen(false)
      toast.success(`Milestone "${res.milestone.name}" created`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create milestone')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number | string) => {
    try {
      await api.milestones.delete(projectId, id)
      onDeleteMilestone(id)
      toast.success('Milestone removed')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete milestone')
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] w-full min-w-0">
      {/* Top Banner */}
      <Card className="border-border/80 bg-card p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Project Milestones</h2>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            Track sprints, version releases, and deliverable completion targets.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-1.5 text-[12px] h-8 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Milestone</span>
        </Button>
      </Card>

      {/* Grid of Milestones */}
      {milestones.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Target className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No milestones created</h3>
          <p className="text-[12px] text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Group issues into sprints or releases to measure velocity and milestone health.
          </p>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="gap-1 text-[12px]">
            <Plus className="h-3.5 w-3.5" />
            <span>Create Milestone</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((m) => {
            const milestoneIssues = issues.filter((i) => String(i.milestone_id) === String(m.id))
            const total = milestoneIssues.length > 0 ? milestoneIssues.length : (m.total_issues || 0)
            const closed = milestoneIssues.length > 0
              ? milestoneIssues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length
              : (m.closed_issues || 0)
            const progress = total > 0 ? Math.round((closed / total) * 100) : (m.progress || 0)
            const isCompleted = progress === 100 || m.status === 'COMPLETED'

            return (
              <Card key={m.id} className="border-border/80 bg-card p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Target className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <h3 className="font-semibold text-[13.5px] text-foreground truncate">{m.name}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleDelete(m.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-6 w-6 shrink-0"
                      title="Delete milestone"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {m.description && (
                    <p className="text-[12px] text-muted-foreground line-clamp-2">{m.description}</p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Progress</span>
                    <span className="font-mono font-semibold text-foreground">{closed}/{total} issues ({progress}%)</span>
                  </div>

                  <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isCompleted ? 'bg-emerald-500' : 'bg-primary'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {m.due_date && (
                    <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground pt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due {formatDate(m.due_date)}</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Milestone Modal */}
      {isCreateModalOpen && (
        <Dialog open onOpenChange={(open) => !open && setIsCreateModalOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Target className="h-4 w-4" />
                <DialogTitle>New Milestone</DialogTitle>
              </div>
              <DialogDescription>
                Define a sprint iteration or release target.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-foreground">Name *</label>
                <Input
                  type="text"
                  placeholder="e.g. v1.2 Release, Sprint 4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-medium text-foreground">Description</label>
                <Textarea
                  placeholder="Goals and scope for this milestone..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-medium text-foreground">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading || !name.trim()}>
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create Milestone'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
