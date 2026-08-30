import React, { useState } from 'react'
import { Milestone, Issue } from '../types'
import { api } from '../api/client'
import { Target, Plus, Calendar, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { formatDate } from '../utils/helpers'
import { toast } from 'sonner'
import { Button } from './ui/button'
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
    <div className="space-y-5 max-w-[1400px] w-full min-w-0">
      {/* Top Banner */}
      <div className="rounded-lg border border-border/60 bg-card/40 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-400" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">Project Milestones</h2>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Group issues into iterations, version releases, and deliverable targets.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-1.5 text-[12px] h-8 shrink-0 shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Milestone</span>
        </Button>
      </div>

      {/* Grid of Milestones */}
      {milestones.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-card/20 p-12 text-center">
          <Target className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground">No milestones created yet</h3>
          <p className="text-[12px] text-muted-foreground max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            Milestones allow your team to organize issues into sprints or releases and monitor velocity in real time.
          </p>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="gap-1.5 text-[12px]">
            <Plus className="h-3.5 w-3.5" />
            <span>Create First Milestone</span>
          </Button>
        </div>
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

            // Due Date Calculation
            let isOverdue = false
            let daysRemainingText = ''
            if (m.due_date && !isCompleted) {
              const due = new Date(m.due_date).getTime()
              const now = new Date().getTime()
              const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
              if (diffDays < 0) {
                isOverdue = true
                daysRemainingText = `${Math.abs(diffDays)}d overdue`
              } else if (diffDays === 0) {
                daysRemainingText = 'Due today'
              } else {
                daysRemainingText = `${diffDays}d remaining`
              }
            }

            return (
              <div key={m.id} className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <h3 className="font-semibold text-[13px] text-foreground truncate">{m.name}</h3>
                      </div>

                      {/* Status Tag */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isCompleted ? (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Completed
                          </span>
                        ) : isOverdue ? (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-medium bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                            <AlertCircle className="h-2.5 w-2.5" />
                            {daysRemainingText}
                          </span>
                        ) : total > 0 ? (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-medium bg-primary/15 text-primary border border-primary/30">
                            In Progress
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-medium bg-muted text-muted-foreground border border-border/40">
                            Planned
                          </span>
                        )}

                        {m.due_date && !isOverdue && daysRemainingText && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {daysRemainingText}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleDelete(m.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 h-6 w-6"
                      title="Delete Milestone"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {m.description && (
                    <p className="text-[11.5px] text-muted-foreground line-clamp-2">
                      {m.description}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground">{closed}/{total} issues</span>
                    <span className="font-semibold text-foreground">{progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {m.due_date && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground pt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due {formatDate(m.due_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Milestone Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md border-border/80 bg-popover">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Create New Milestone
            </DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">
              Define a sprint goal, feature milestone, or upcoming version release.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-foreground">
                Milestone Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., v1.0.0 MVP Release or Sprint 4"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-[12.5px] h-8.5"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-medium text-foreground">Target Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-[12.5px] h-8.5"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-medium text-foreground">Description</label>
              <Textarea
                placeholder="Describe the scope, deliverables, or objectives for this milestone..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-[12.5px] min-h-[75px] resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[12px] h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !name.trim()}
                className="text-[12px] h-8 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Milestone</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
