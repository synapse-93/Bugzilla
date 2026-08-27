import React from 'react'
import { Issue, IssueStatus } from '../types'
import { CircleDot, Clock, AlertCircle, CheckCircle2, ChevronRight, User } from 'lucide-react'

interface KanbanBoardProps {
  issues: Issue[]
  onSelectIssue: (issue: Issue) => void
  onUpdateStatus: (issue: Issue, newStatus: IssueStatus) => void
}

const COLUMNS: { status: IssueStatus; title: string; color: string }[] = [
  { status: 'OPEN', title: 'Open', color: '#3b82f6' },
  { status: 'IN_PROGRESS', title: 'In Progress', color: '#eab308' },
  { status: 'IN_REVIEW', title: 'In Review', color: '#a855f7' },
  { status: 'RESOLVED', title: 'Resolved', color: '#10b981' },
  { status: 'CLOSED', title: 'Closed', color: '#6b7280' },
]

export function KanbanBoard({ issues, onSelectIssue, onUpdateStatus }: KanbanBoardProps) {
  const getNextStatus = (current: IssueStatus): IssueStatus | null => {
    switch (current) {
      case 'OPEN':
        return 'IN_PROGRESS'
      case 'IN_PROGRESS':
        return 'IN_REVIEW'
      case 'IN_REVIEW':
        return 'RESOLVED'
      case 'RESOLVED':
        return 'CLOSED'
      default:
        return null
    }
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'badge-urgent'
      case 'HIGH':
        return 'badge-high'
      case 'MEDIUM':
        return 'badge-medium'
      case 'LOW':
        return 'badge-low'
      default:
        return ''
    }
  }

  return (
    <div className="kanban-container">
      {COLUMNS.map((col) => {
        const colIssues = issues.filter((i) => i.status === col.status)
        return (
          <div key={col.status} className="kanban-column">
            <div className="kanban-column-header">
              <div className="column-title-group">
                <span className="column-indicator" style={{ backgroundColor: col.color }} />
                <h3>{col.title}</h3>
              </div>
              <span className="column-count">{colIssues.length}</span>
            </div>

            <div className="kanban-column-body">
              {colIssues.length === 0 ? (
                <div className="kanban-empty">No issues</div>
              ) : (
                colIssues.map((issue) => {
                  const next = getNextStatus(issue.status)
                  return (
                    <div
                      key={issue.id}
                      className="kanban-card"
                      onClick={() => onSelectIssue(issue)}
                    >
                      <div className="kanban-card-top">
                        <span className="font-mono text-muted text-xs font-bold">
                          {issue.identifier || `#${issue.issue_number}`}
                        </span>
                        <span className={`badge-pill text-xs ${getPriorityClass(issue.priority)}`}>
                          {issue.priority}
                        </span>
                      </div>

                      <h4 className="kanban-card-title">{issue.title}</h4>

                      {issue.labels && issue.labels.length > 0 && (
                        <div className="kanban-card-labels">
                          {issue.labels.map((lbl) => (
                            <span
                              key={lbl.id}
                              className="tag-pill text-xs"
                              style={{
                                backgroundColor: `${lbl.color}22`,
                                color: lbl.color,
                                borderColor: `${lbl.color}44`,
                              }}
                            >
                              {lbl.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="kanban-card-footer">
                        <div className="card-assignee">
                          {issue.assignee ? (
                            <>
                              <div className="avatar-xs">
                                {issue.assignee.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs text-muted">{issue.assignee.username}</span>
                            </>
                          ) : (
                            <span className="text-xs text-muted">Unassigned</span>
                          )}
                        </div>

                        {next && (
                          <button
                            className="btn-next-status"
                            title={`Advance to ${next.replace('_', ' ')}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              onUpdateStatus(issue, next)
                            }}
                          >
                            <span>Move</span>
                            <ChevronRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
