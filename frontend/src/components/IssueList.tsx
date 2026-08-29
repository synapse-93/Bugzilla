import React, { useState } from 'react'
import { Issue, Label, IssueStatus, PriorityLevel, ProjectMember } from '../types'
import { Search, Filter, ArrowUpDown, Plus, CheckSquare, X, Tag, User as UserIcon } from 'lucide-react'
import { getIssueDisplayIdentifier, formatRelativeTime, getStatusColor, getPriorityColor, getStatusLabel } from '../utils/helpers'

interface IssueListProps {
  issues: Issue[]
  labels: Label[]
  members: ProjectMember[]
  currentUserId?: number
  onSelectIssue: (issue: Issue) => void
  onFilterChange: (filters: Record<string, string | undefined>) => void
  onOpenCreateIssue: () => void
  loading: boolean
}

export function IssueList({
  issues,
  labels,
  members,
  currentUserId,
  onSelectIssue,
  onFilterChange,
  onOpenCreateIssue,
  loading,
}: IssueListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('')
  const [labelFilter, setLabelFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [activeSavedFilter, setActiveSavedFilter] = useState<string>('all')

  const applyFilters = (
    q: string,
    status: string,
    priority: string,
    assignee: string,
    label: string,
    sort: string,
    order: 'desc' | 'asc'
  ) => {
    onFilterChange({
      q: q || undefined,
      status: status || undefined,
      priority: priority || undefined,
      assignee_id: assignee || undefined,
      label_id: label || undefined,
      sort_by: sort || undefined,
      sort_order: order || undefined,
    })
  }

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    applyFilters(val, statusFilter, priorityFilter, assigneeFilter, labelFilter, sortBy, sortOrder)
  }

  const handleStatusChange = (val: string) => {
    setStatusFilter(val)
    setActiveSavedFilter('')
    applyFilters(searchQuery, val, priorityFilter, assigneeFilter, labelFilter, sortBy, sortOrder)
  }

  const handlePriorityChange = (val: string) => {
    setPriorityFilter(val)
    setActiveSavedFilter('')
    applyFilters(searchQuery, statusFilter, val, assigneeFilter, labelFilter, sortBy, sortOrder)
  }

  const handleAssigneeChange = (val: string) => {
    setAssigneeFilter(val)
    setActiveSavedFilter('')
    applyFilters(searchQuery, statusFilter, priorityFilter, val, labelFilter, sortBy, sortOrder)
  }

  const handleLabelChange = (val: string) => {
    setLabelFilter(val)
    setActiveSavedFilter('')
    applyFilters(searchQuery, statusFilter, priorityFilter, assigneeFilter, val, sortBy, sortOrder)
  }

  const handleSortChange = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(field)
    setSortOrder(newOrder)
    applyFilters(searchQuery, statusFilter, priorityFilter, assigneeFilter, labelFilter, field, newOrder)
  }

  const handleSavedFilterSelect = (presetKey: string) => {
    setActiveSavedFilter(presetKey)
    if (presetKey === 'all') {
      setStatusFilter('')
      setPriorityFilter('')
      setAssigneeFilter('')
      setLabelFilter('')
      applyFilters(searchQuery, '', '', '', '', sortBy, sortOrder)
    } else if (presetKey === 'my_open') {
      setStatusFilter('OPEN')
      setPriorityFilter('')
      const myId = currentUserId ? String(currentUserId) : ''
      setAssigneeFilter(myId)
      setLabelFilter('')
      applyFilters(searchQuery, 'OPEN', '', myId, '', sortBy, sortOrder)
    } else if (presetKey === 'high_priority') {
      setStatusFilter('')
      setPriorityFilter('HIGH')
      setAssigneeFilter('')
      setLabelFilter('')
      applyFilters(searchQuery, '', 'HIGH', '', '', sortBy, sortOrder)
    } else if (presetKey === 'in_progress') {
      setStatusFilter('IN_PROGRESS')
      setPriorityFilter('')
      setAssigneeFilter('')
      setLabelFilter('')
      applyFilters(searchQuery, 'IN_PROGRESS', '', '', '', sortBy, sortOrder)
    }
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setPriorityFilter('')
    setAssigneeFilter('')
    setLabelFilter('')
    setActiveSavedFilter('all')
    applyFilters('', '', '', '', '', 'created_at', 'desc')
  }

  const hasActiveFilters = Boolean(searchQuery || statusFilter || priorityFilter || assigneeFilter || labelFilter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px' }}
              placeholder="Search issues by title or description..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '130px' }}
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '130px' }}
            value={priorityFilter}
            onChange={(e) => handlePriorityChange(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Assignee Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={assigneeFilter}
            onChange={(e) => handleAssigneeChange(e.target.value)}
          >
            <option value="">All Assignees</option>
            {members.map((m) => (
              <option key={m.user_id} value={String(m.user_id)}>
                {m.user?.username || `User ${m.user_id}`}
              </option>
            ))}
          </select>

          {/* Label Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '130px' }}
            value={labelFilter}
            onChange={(e) => handleLabelChange(e.target.value)}
          >
            <option value="">All Labels</option>
            {labels.map((l) => (
              <option key={l.id} value={String(l.id)}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button className="btn btn-ghost" onClick={clearAllFilters} title="Clear filters">
              <X size={14} />
              <span>Reset</span>
            </button>
          )}

          {/* New Issue Button */}
          <button className="btn btn-primary" onClick={onOpenCreateIssue}>
            <Plus size={15} />
            <span>New Issue</span>
          </button>
        </div>

        {/* Saved Filter Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
            Presets:
          </span>
          {[
            { key: 'all', label: 'All Issues' },
            { key: 'my_open', label: 'Assigned to Me' },
            { key: 'high_priority', label: 'High Priority' },
            { key: 'in_progress', label: 'In Progress' },
          ].map((preset) => (
            <button
              key={preset.key}
              className={`btn btn-sm ${activeSavedFilter === preset.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 10px', fontSize: '11px', borderRadius: '9999px' }}
              onClick={() => handleSavedFilterSelect(preset.key)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Issues Table */}
      <div className="issue-table-container">
        {/* Table Header */}
        <div className="issue-table-header">
          <div style={{ width: '110px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleSortChange('issue_number')}>
            <span>ID</span>
            <ArrowUpDown size={12} />
          </div>
          <div style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleSortChange('title')}>
            <span>Title</span>
            <ArrowUpDown size={12} />
          </div>
          <div style={{ width: '130px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleSortChange('status')}>
            <span>Status</span>
            <ArrowUpDown size={12} />
          </div>
          <div style={{ width: '110px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleSortChange('priority')}>
            <span>Priority</span>
            <ArrowUpDown size={12} />
          </div>
          <div style={{ width: '140px' }}>Assignee</div>
          <div style={{ width: '120px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleSortChange('updated_at')}>
            <span>Updated</span>
            <ArrowUpDown size={12} />
          </div>
        </div>

        {/* Table Rows */}
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading issues...
          </div>
        ) : issues.length === 0 ? (
          <div className="empty-state">
            <CheckSquare size={36} className="text-muted mb-2" />
            <div className="empty-state-title">No issues found</div>
            <p className="empty-state-desc">
              {hasActiveFilters
                ? 'No issues match the active filter criteria. Try resetting filters.'
                : 'Get started by creating your first issue in this project.'}
            </p>
            {hasActiveFilters ? (
              <button className="btn btn-secondary" onClick={clearAllFilters}>
                Clear Filters
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onOpenCreateIssue}>
                <Plus size={15} />
                <span>Create Issue</span>
              </button>
            )}
          </div>
        ) : (
          issues.map((issue) => {
            const statusStyles = getStatusColor(issue.status)
            const priorityStyles = getPriorityColor(issue.priority)
            return (
              <div
                key={issue.id}
                className="issue-row"
                onClick={() => onSelectIssue(issue)}
              >
                <div style={{ width: '110px' }}>
                  <span className="issue-identifier-tag">
                    {getIssueDisplayIdentifier(issue.identifier)}
                  </span>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {issue.title}
                  </span>
                  {issue.labels && issue.labels.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                      {issue.labels.slice(0, 3).map((lbl) => (
                        <span
                          key={lbl.id}
                          className="label-chip"
                          style={{
                            backgroundColor: `${lbl.color}20`,
                            color: lbl.color,
                            border: `1px solid ${lbl.color}40`,
                          }}
                        >
                          {lbl.name}
                        </span>
                      ))}
                      {issue.labels.length > 3 && (
                        <span className="label-chip" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                          +{issue.labels.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ width: '130px' }}>
                  <span
                    className="badge-pill"
                    style={{
                      backgroundColor: statusStyles.bg,
                      color: statusStyles.text,
                      borderColor: statusStyles.border,
                    }}
                  >
                    <span className="badge-dot" style={{ backgroundColor: statusStyles.dot }} />
                    <span>{getStatusLabel(issue.status)}</span>
                  </span>
                </div>

                <div style={{ width: '110px' }}>
                  <span
                    className="badge-pill"
                    style={{
                      backgroundColor: priorityStyles.bg,
                      color: priorityStyles.text,
                      borderColor: priorityStyles.border,
                    }}
                  >
                    {issue.priority}
                  </span>
                </div>

                <div style={{ width: '140px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {issue.assignee ? (
                    <>
                      <div className="user-avatar" style={{ width: '20px', height: '20px', fontSize: '10px' }}>
                        {issue.assignee.username.substring(0, 2)}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{issue.assignee.username}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unassigned</span>
                  )}
                </div>

                <div style={{ width: '120px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {formatRelativeTime(issue.updated_at || issue.created_at)}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
