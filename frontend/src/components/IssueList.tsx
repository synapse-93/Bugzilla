import React, { useState } from 'react'
import { Issue, Label } from '../types'
import {
  Search,
  Filter,
  ArrowUpDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  CircleDot,
  User,
  Tag,
} from 'lucide-react'

interface IssueListProps {
  issues: Issue[]
  labels: Label[]
  onSelectIssue: (issue: Issue) => void
  onFilterChange: (filters: Record<string, string | undefined>) => void
  loading: boolean
}

export function IssueList({
  issues,
  labels,
  onSelectIssue,
  onFilterChange,
  loading,
}: IssueListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [labelFilter, setLabelFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFilterChange({
      q: search || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      type: typeFilter || undefined,
      label_id: labelFilter || undefined,
      sort: sortBy,
      order: sortOrder,
    })
  }

  const handleFilterUpdate = (newFilters: Record<string, string | undefined>) => {
    onFilterChange({
      q: search || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      type: typeFilter || undefined,
      label_id: labelFilter || undefined,
      sort: sortBy,
      order: sortOrder,
      ...newFilters,
    })
  }

  const getPriorityBadgeClass = (priority: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <CircleDot size={14} className="text-blue" />
      case 'IN_PROGRESS':
        return <Clock size={14} className="text-yellow" />
      case 'IN_REVIEW':
        return <AlertCircle size={14} className="text-purple" />
      case 'RESOLVED':
      case 'CLOSED':
        return <CheckCircle2 size={14} className="text-green" />
      default:
        return <CircleDot size={14} />
    }
  }

  return (
    <div className="issue-list-container">
      {/* Search and Filters Toolbar */}
      <div className="toolbar-card">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search issues by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="btn-clear"
              onClick={() => {
                setSearch('')
                handleFilterUpdate({ q: undefined })
              }}
            >
              ✕
            </button>
          )}
        </form>

        <div className="filters-row">
          <div className="filter-group">
            <Filter size={14} />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                handleFilterUpdate({ status: e.target.value || undefined })
              }}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                handleFilterUpdate({ priority: e.target.value || undefined })
              }}
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                handleFilterUpdate({ type: e.target.value || undefined })
              }}
            >
              <option value="">All Types</option>
              <option value="BUG">Bug</option>
              <option value="FEATURE">Feature</option>
              <option value="TASK">Task</option>
              <option value="IMPROVEMENT">Improvement</option>
            </select>
          </div>

          {labels.length > 0 && (
            <div className="filter-group">
              <select
                value={labelFilter}
                onChange={(e) => {
                  setLabelFilter(e.target.value)
                  handleFilterUpdate({ label_id: e.target.value || undefined })
                }}
              >
                <option value="">All Labels</option>
                {labels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="sort-group ml-auto">
            <ArrowUpDown size={14} />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-')
                setSortBy(sort)
                setSortOrder(order as 'desc' | 'asc')
                handleFilterUpdate({ sort, order })
              }}
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="updated_at-desc">Recently Updated</option>
              <option value="priority-desc">Priority</option>
              <option value="severity-desc">Severity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      {loading ? (
        <div className="loading-box">Loading issues...</div>
      ) : issues.length === 0 ? (
        <div className="empty-box">
          <AlertCircle size={32} />
          <h3>No issues found</h3>
          <p>No issues match the selected filters or search query.</p>
        </div>
      ) : (
        <div className="issue-table-wrapper">
          <table className="issue-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>ID</th>
                <th>Title</th>
                <th style={{ width: '130px' }}>Status</th>
                <th style={{ width: '100px' }}>Priority</th>
                <th style={{ width: '100px' }}>Type</th>
                <th style={{ width: '140px' }}>Assignee</th>
                <th style={{ width: '130px' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} onClick={() => onSelectIssue(issue)} className="issue-row">
                  <td className="font-mono text-muted">
                    <strong>{issue.identifier || `#${issue.issue_number}`}</strong>
                  </td>
                  <td>
                    <div className="issue-title-cell">
                      <span className="issue-title-text">{issue.title}</span>
                      {issue.labels && issue.labels.length > 0 && (
                        <div className="issue-labels-inline">
                          {issue.labels.map((lbl) => (
                            <span
                              key={lbl.id}
                              className="tag-pill"
                              style={{ backgroundColor: `${lbl.color}22`, color: lbl.color, borderColor: `${lbl.color}44` }}
                            >
                              {lbl.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      {getStatusIcon(issue.status)}
                      <span>{issue.status.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-pill ${getPriorityBadgeClass(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td>
                    <span className="type-pill">{issue.issue_type}</span>
                  </td>
                  <td>
                    <div className="assignee-cell">
                      {issue.assignee ? (
                        <>
                          <div className="avatar-xs">{issue.assignee.username.charAt(0).toUpperCase()}</div>
                          <span>{issue.assignee.username}</span>
                        </>
                      ) : (
                        <span className="text-muted">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="text-muted text-sm">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
