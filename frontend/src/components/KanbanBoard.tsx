import React, { useState } from 'react'
import { Issue, IssueStatus } from '../types'
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { getIssueDisplayIdentifier } from '../utils/helpers'
import { StatusBadge } from './StatusBadge'
import { SeverityBadge } from './SeverityBadge'
import { PriorityBadge } from './PriorityBadge'
import { TypeBadge } from './TypeBadge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Play, Eye, CheckCircle2, RotateCcw, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KanbanBoardProps {
  issues: Issue[]
  onSelectIssue: (issue: Issue) => void
  onUpdateStatus: (issue: Issue, newStatus: IssueStatus) => Promise<void>
  onOpenCreateIssue?: () => void
}

const COLUMNS: { id: IssueStatus; title: string; color: string; dotClass: string }[] = [
  { id: 'OPEN', title: 'Open', color: '#38bdf8', dotClass: 'bg-sky-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#fbbf24', dotClass: 'bg-amber-400' },
  { id: 'IN_REVIEW', title: 'In Review', color: '#c084fc', dotClass: 'bg-purple-400' },
  { id: 'RESOLVED', title: 'Resolved', color: '#4ade80', dotClass: 'bg-emerald-400' },
  { id: 'CLOSED', title: 'Closed', color: '#71717a', dotClass: 'bg-zinc-500' },
]

function KanbanCard({
  issue,
  onSelectIssue,
  onUpdateStatus,
  isOverlay = false,
}: {
  issue: Issue
  onSelectIssue: (issue: Issue) => void
  onUpdateStatus?: (issue: Issue, newStatus: IssueStatus) => Promise<void>
  isOverlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${issue.id}`,
    data: { issue },
    disabled: isOverlay,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const renderQuickAction = () => {
    if (!onUpdateStatus) return null
    if (issue.status === 'OPEN') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(issue, 'IN_PROGRESS')
          }}
          className="flex items-center gap-1 text-[10px] text-amber-400 hover:bg-amber-400/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
          title="Move to In Progress"
        >
          <Play className="h-2.5 w-2.5" />
          <span>Start</span>
        </button>
      )
    }
    if (issue.status === 'IN_PROGRESS') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(issue, 'IN_REVIEW')
          }}
          className="flex items-center gap-1 text-[10px] text-purple-400 hover:bg-purple-400/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
          title="Move to In Review"
        >
          <Eye className="h-2.5 w-2.5" />
          <span>Review</span>
        </button>
      )
    }
    if (issue.status === 'IN_REVIEW') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(issue, 'RESOLVED')
          }}
          className="flex items-center gap-1 text-[10px] text-emerald-400 hover:bg-emerald-400/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
          title="Mark as Resolved"
        >
          <CheckCircle2 className="h-2.5 w-2.5" />
          <span>Resolve</span>
        </button>
      )
    }
    if (issue.status === 'RESOLVED') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(issue, 'CLOSED')
          }}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:bg-zinc-400/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
          title="Close Issue"
        >
          <Check className="h-2.5 w-2.5" />
          <span>Close</span>
        </button>
      )
    }
    if (issue.status === 'CLOSED') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(issue, 'OPEN')
          }}
          className="flex items-center gap-1 text-[10px] text-sky-400 hover:bg-sky-400/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
          title="Reopen Issue"
        >
          <RotateCcw className="h-2.5 w-2.5" />
          <span>Reopen</span>
        </button>
      )
    }
    return null
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelectIssue(issue)}
      className={cn(
        'rounded-md border border-border/80 bg-card p-3 shadow-xs hover:border-border hover:shadow-md transition-all cursor-pointer select-none space-y-2 group',
        isDragging && 'opacity-30 border-primary/50',
        isOverlay && 'shadow-2xl border-primary scale-102 bg-card/95 backdrop-blur-sm'
      )}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[10.5px] font-medium text-primary">
          {getIssueDisplayIdentifier(issue.identifier)}
        </span>
        <div className="flex items-center gap-1">
          <TypeBadge type={issue.issue_type} showLabel={false} />
          <PriorityBadge priority={issue.priority} showLabel={false} />
        </div>
      </div>

      <p className="text-[12.5px] font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {issue.title}
      </p>

      {issue.labels && issue.labels.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap pt-0.5">
          {issue.labels.map((lbl) => (
            <span
              key={lbl.id}
              className="px-1.5 py-0.2 rounded text-[9.5px] font-medium border"
              style={{
                backgroundColor: `${lbl.color}15`,
                color: lbl.color,
                borderColor: `${lbl.color}40`,
              }}
            >
              {lbl.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
        {issue.assignee ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar className="h-4 w-4 shrink-0">
              {issue.assignee.avatar_url && (
                <AvatarImage src={issue.assignee.avatar_url} alt={issue.assignee.username} />
              )}
              <AvatarFallback className="text-[8px] font-bold bg-primary/20 text-primary">
                {issue.assignee.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground truncate max-w-[80px]">
              {issue.assignee.display_name || issue.assignee.username}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-[10px]">Unassigned</span>
        )}

        <div className="shrink-0">{renderQuickAction()}</div>
      </div>
    </div>
  )
}

function KanbanColumn({
  column,
  issues,
  onSelectIssue,
  onUpdateStatus,
}: {
  column: { id: IssueStatus; title: string; color: string; dotClass: string }
  issues: Issue[]
  onSelectIssue: (issue: Issue) => void
  onUpdateStatus: (issue: Issue, newStatus: IssueStatus) => Promise<void>
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { status: column.id },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg border border-border/70 bg-sidebar/50 p-2 min-w-[260px] max-w-[320px] flex-1 shrink-0 transition-colors',
        isOver && 'border-primary/60 bg-primary/5 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full shrink-0', column.dotClass)} />
          <span className="text-[12.5px] font-semibold text-foreground">{column.title}</span>
        </div>
        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-medium bg-muted text-muted-foreground">
          {issues.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-210px)] pr-0.5">
        {issues.map((issue) => (
          <KanbanCard
            key={issue.id}
            issue={issue}
            onSelectIssue={onSelectIssue}
            onUpdateStatus={onUpdateStatus}
          />
        ))}

        {issues.length === 0 && (
          <div className="flex items-center justify-center p-6 border border-dashed border-border/60 rounded-md text-center">
            <span className="text-[11px] text-muted-foreground">No issues in {column.title.toLowerCase()}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({
  issues,
  onSelectIssue,
  onUpdateStatus,
}: KanbanBoardProps) {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current
    if (data && data.issue) {
      setActiveIssue(data.issue)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveIssue(null)

    if (!over) return

    const draggedIssue = active.data.current?.issue as Issue
    const targetStatus = (over.data.current?.status || over.id.toString().replace('column-', '')) as IssueStatus

    if (draggedIssue && targetStatus && draggedIssue.status !== targetStatus) {
      await onUpdateStatus(draggedIssue, targetStatus)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 pt-1 w-full min-w-0">
        {COLUMNS.map((col) => {
          const colIssues = issues.filter((i) => i.status === col.id)
          return (
            <KanbanColumn
              key={col.id}
              column={col}
              issues={colIssues}
              onSelectIssue={onSelectIssue}
              onUpdateStatus={onUpdateStatus}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeIssue ? (
          <KanbanCard
            issue={activeIssue}
            onSelectIssue={() => {}}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
