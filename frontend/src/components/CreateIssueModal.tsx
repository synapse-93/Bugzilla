import React, { useState } from 'react'
import { Issue, Label, ProjectMember, IssueType, PriorityLevel, SeverityLevel } from '../types'
import { api } from '../api/client'
import { PlusCircle, Loader2 } from 'lucide-react'
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
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { cn } from '@/lib/utils'

interface CreateIssueModalProps {
  projectId: number
  labels: Label[]
  members: ProjectMember[]
  onClose: () => void
  onIssueCreated: (issue: Issue) => void
}

export function CreateIssueModal({
  projectId,
  labels,
  members,
  onClose,
  onIssueCreated,
}: CreateIssueModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [issueType, setIssueType] = useState<IssueType>('BUG')
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM')
  const [severity, setSeverity] = useState<SeverityLevel>('MEDIUM')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  const handleToggleLabel = (labelId: number) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const res = await api.issues.create(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        issue_type: issueType,
        priority,
        severity,
        assignee_id: assigneeId ? Number(assigneeId) : null,
        label_ids: selectedLabelIds,
      })
      toast.success(`Issue ${res.issue.identifier} created!`)
      onIssueCreated(res.issue)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create issue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold">
            <PlusCircle className="h-4 w-4" />
            <DialogTitle>Create New Issue</DialogTitle>
          </div>
          <DialogDescription>
            Report a bug, submit a feature request, or create a development task.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Fix auth redirect on expired JWT token"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="text-[13px]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">
              Description
            </label>
            <Textarea
              placeholder="Steps to reproduce, expected vs actual behavior, logs or context..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-[13px] resize-y"
            />
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Issue Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                className="w-full h-8 rounded-md border border-input bg-background/50 px-2.5 text-[12.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="BUG">Bug</option>
                <option value="FEATURE">Feature</option>
                <option value="TASK">Task</option>
                <option value="IMPROVEMENT">Improvement</option>
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background/50 px-2.5 text-[12.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={String(m.user_id)}>
                    {m.user?.display_name || m.user?.username || `User ${m.user_id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full h-8 rounded-md border border-input bg-background/50 px-2.5 text-[12.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Severity */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full h-8 rounded-md border border-input bg-background/50 px-2.5 text-[12.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* Labels Selection */}
          {labels.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-medium text-muted-foreground">Labels</label>
              <div className="flex gap-1.5 flex-wrap">
                {labels.map((lbl) => {
                  const isSelected = selectedLabelIds.includes(lbl.id)
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => handleToggleLabel(lbl.id)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium transition-all border cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/20 text-primary shadow-xs'
                          : 'border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60'
                      )}
                      style={isSelected ? { borderColor: lbl.color, color: lbl.color, backgroundColor: `${lbl.color}20` } : {}}
                    >
                      {lbl.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-[12px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !title.trim()}
              className="text-[12px] gap-1.5 font-medium"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Create Issue</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
