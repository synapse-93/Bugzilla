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
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import {
  getIssueDisplayIdentifier,
  getStatusColor,
  getPriorityColor,
  getStatusLabel,
} from '../utils/helpers'
import { Plus, ArrowRight, Play, CheckCircle, RotateCcw, Eye } from 'lucide-react'

interface KanbanBoardProps {
  issues: Issue[]
  onSelectIssue: (issue: Issue) => void
  onUpdateStatus: (issue: Issue, newStatus: IssueStatus) => Promise<void>
  onOpenCreateIssue?: () => void
}

const COLUMNS: { id: IssueStatus; title: string; color: string }[] = [
  { id: 'OPEN', title: 'Open', color: '#60a5fa' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#facc15' },
  { id: 'IN_REVIEW', title: 'In Review', color: '#c084fc' },
  { id: 'RESOLVED', title: 'Resolved', color: '#4ade80' },
  { id: 'CLOSED', title: 'Closed', color: '#a1a1aa' },
]

// Draggable Issue Card Component
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

  const priorityStyles = getPriorityColor(issue.priority)

  const renderQuickAction = () => {
    if (!onUpdateStatus) return null
    if (issue.status === 'OPEN') {
      return (
        <button
          className="btn btn-ghost"
          style={{ padding: '2px 6px', fontSize: '10px', color: '#facc15' }}
          title="Move to In Progress"
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(issue, 'IN_PROGRESS')
          }}
        >
          <Play size={10} />
          <span>Start</span>
        </button>
      )
    }
    if (issue.status === 'IN_PROGRESS') {
      return (
        <button
          className="btn btn-ghost"
          style={{ padding: '2px 6px', fontSize: '10px', color: '#c084fc' }}
          title="Move to In Review"
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(issue, 'IN_REVIEW')
          }}
        >
          <Eye size={10} />
          <span>Review</span>
        </button>
      )
    }
    if (issue.status === 'IN_REVIEW') {
      return (
        <button
          className="btn btn-ghost"
          style={{ padding: '2px 6px', fontSize: '10px', color: '#4ade80' }}
          title="Mark as Resolved"
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(issue, 'RESOLVED')
          }}
        >
          <CheckCircle size={10} />
          <span>Resolve</span>
        </button>
      )
    }
    if (issue.status === 'RESOLVED') {
      return (
        <button
          className="btn btn-ghost"
          style={{ padding: '2px 6px', fontSize: '10px', color: '#a1a1aa' }}
          title="Close Issue"
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(issue, 'CLOSED')
          }}
        >
          <span>Close</span>
        </button>
      )
    }
    if (issue.status === 'CLOSED') {
      return (
        <button
          className="btn btn-ghost"
          style={{ padding: '2px 6px', fontSize: '10px', color: '#60a5fa' }}
          title="Reopen Issue"
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(issue, 'OPEN')
          }}
        >
          <RotateCcw size={10} />
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
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
      onClick={() => onSelectIssue(issue)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span className="issue-identifier-tag">{getIssueDisplayIdentifier(issue.identifier)}</span>
        <span
          className="badge-pill"
          style={{
            backgroundColor: priorityStyles.bg,
            color: priorityStyles.text,
            borderColor: priorityStyles.border,
            fontSize: '10px',
            padding: '1px 6px',
          }}
        >
          {issue.priority}
        </span>
      </div>

      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
        {issue.title}
      </div>

      {issue.labels && issue.labels.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {issue.labels.map((lbl) => (
            <span
              key={lbl.id}
              className="label-chip"
              style={{
                backgroundColor: `${lbl.color}20`,
                color: lbl.color,
                border: `1px solid ${lbl.color}40`,
                fontSize: '10px',
              }}
            >
              {lbl.name}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {issue.assignee ? (
            <div
              className="user-avatar"
              style={{ width: '18px', height: '18px', fontSize: '9px' }}
              title={`Assigned to ${issue.assignee.username}`}
            >
              {issue.assignee.username.substring(0, 2)}
            </div>
          ) : (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Unassigned</span>
          )}
        </div>

        <div>{renderQuickAction()}</div>
      </div>
    </div>
  )
}

// Droppable Column Component
function KanbanColumn({
  column,
  issues,
  onSelectIssue,
  onUpdateStatus,
}: {
  column: { id: IssueStatus; title: string; color: string }
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
      className="kanban-column"
      style={{
        borderColor: isOver ? column.color : 'var(--border-subtle)',
        boxShadow: isOver ? `0 0 12px ${column.color}30` : 'none',
      }}
    >
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: column.color }} />
          <span>{column.title}</span>
        </div>
        <span className="nav-badge">{issues.length}</span>
      </div>

      <div className="kanban-card-list">
        {issues.map((issue) => (
          <KanbanCard
            key={issue.id}
            issue={issue}
            onSelectIssue={onSelectIssue}
            onUpdateStatus={onUpdateStatus}
          />
        ))}
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

    const activeIssue = active.data.current?.issue as Issue
    const overColumnStatus = (over.data.current?.status || over.id.toString().replace('column-', '')) as IssueStatus

    if (activeIssue && overColumnStatus && activeIssue.status !== overColumnStatus) {
      await onUpdateStatus(activeIssue, overColumnStatus)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="kanban-board-container">
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
