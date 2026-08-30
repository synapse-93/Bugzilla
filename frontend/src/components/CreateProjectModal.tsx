import React, { useState } from 'react'
import { Project } from '../types'
import { api } from '../api/client'
import { FolderPlus, Loader2 } from 'lucide-react'
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

interface CreateProjectModalProps {
  onClose: () => void
  onProjectCreated: (project: Project) => void
}

export function CreateProjectModal({ onClose, onProjectCreated }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false)

  const handleNameChange = (val: string) => {
    setName(val)
    if (!isKeyManuallyEdited && val.trim().length >= 2) {
      const words = val.trim().split(/\s+/)
      let suggestedKey = ''
      if (words.length === 1) {
        suggestedKey = words[0].substring(0, 4).toUpperCase()
      } else {
        suggestedKey = words
          .slice(0, 4)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
      }
      setKey(suggestedKey.replace(/[^A-Z0-9]/g, ''))
    }
  }

  const handleKeyChange = (val: string) => {
    setIsKeyManuallyEdited(true)
    setKey(val.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !key.trim()) return

    setLoading(true)
    try {
      const res = await api.projects.createWithFallbackKey({
        name: name.trim(),
        key: key.trim(),
        description: description.trim() || undefined,
      })
      toast.success(`Project "${res.project.name}" created!`)
      onProjectCreated(res.project)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold">
            <FolderPlus className="h-4 w-4" />
            <DialogTitle>Create New Project</DialogTitle>
          </div>
          <DialogDescription>
            Initialize a new project workspace for issue tracking and milestones.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">
              Project Name <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Kaizen Mobile, Core Engine"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoFocus
              className="text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">
              Project Key <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. ENG, KZN"
              value={key}
              onChange={(e) => handleKeyChange(e.target.value)}
              maxLength={10}
              required
              className="font-mono text-[13px] uppercase"
            />
            <p className="text-[11px] text-muted-foreground">
              Used as prefix for issues, e.g.{' '}
              <strong className="font-mono text-primary">{key || 'KEY'}-1</strong>,{' '}
              <strong className="font-mono text-primary">{key || 'KEY'}-42</strong>.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">Description</label>
            <Textarea
              placeholder="What are the goals of this project?"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-[13px]"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-[12px]">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !name.trim() || key.trim().length < 2}
              className="text-[12px] gap-1 font-medium"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Create Project</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
