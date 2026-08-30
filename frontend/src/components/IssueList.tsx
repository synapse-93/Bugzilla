import React, { useState } from 'react'
import { Issue, Label, ProjectMember } from '../types'
import {
  Search,
  ArrowUpDown,
  Plus,
  CheckSquare,
  X,
  User as UserIcon,
  Tag as TagIcon,
  Filter,
} from 'lucide-react'
import { getIssueDisplayIdentifier, formatRelativeTime } from '../utils/helpers'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import { StatusBadge } from './StatusBadge'
import { SeverityBadge } from './SeverityBadge'
import { PriorityBadge } from './PriorityBadge'
import { TypeBadge } from './TypeBadge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { cn } from '@/lib/utils'

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
    <div className="space-y-4 max-w-[1400px] w-full min-w-0">
      {/* Search & Filters Card */}
      <Card className="border-border/80 bg-card p-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search issues by title or description..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-8 text-[12.5px] bg-background/50"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background/50 px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer shrink-0"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background/50 px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer shrink-0"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Assignee Dropdown */}
          <select
            value={assigneeFilter}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background/50 px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer shrink-0"
          >
            <option value="">All Assignees</option>
            {members.map((m) => (
              <option key={m.user_id} value={String(m.user_id)}>
                {m.user?.display_name || m.user?.username || `User ${m.user_id}`}
              </option>
            ))}
          </select>

          {/* Label Dropdown */}
          <select
            value={labelFilter}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background/50 px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer shrink-0"
          >
            <option value="">All Labels</option>
            {labels.map((l) => (
              <option key={l.id} value={String(l.id)}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 px-2 text-[12px] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              <span>Reset</span>
            </Button>
          )}

          {/* New Issue Action */}
          <Button
            size="sm"
            onClick={onOpenCreateIssue}
            className="h-8 text-[12px] gap-1 font-medium ml-auto shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Issue</span>
          </Button>
        </div>

        {/* Filter Presets Row */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
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
              type="button"
              onClick={() => handleSavedFilterSelect(preset.key)}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer',
                activeSavedFilter === preset.key
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Issues Table Container */}
      <Card className="border-border/80 bg-card overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[700px] text-[12.5px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium text-[11px] uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSortChange('issue_number')}
                  className="px-3.5 py-2.5 w-24 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortChange('title')}
                  className="px-3.5 py-2.5 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Title</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortChange('status')}
                  className="px-3.5 py-2.5 w-32 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortChange('priority')}
                  className="px-3.5 py-2.5 w-28 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Priority</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-3.5 py-2.5 w-36">Assignee</th>
                <th
                  onClick={() => handleSortChange('updated_at')}
                  className="px-3.5 py-2.5 w-28 cursor-pointer hover:text-foreground transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Updated</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Loading issues...
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                      <CheckSquare className="h-8 w-8 text-muted-foreground/60 mb-1" />
                      <p className="text-[13px] font-semibold text-foreground">No issues found</p>
                      <p className="text-[11.5px] text-muted-foreground">
                        {hasActiveFilters
                          ? 'No issues match the active filter criteria. Try resetting filters.'
                          : 'Get started by creating your first issue in this project.'}
                      </p>
                      {hasActiveFilters ? (
                        <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-2 text-[12px]">
                          Clear Filters
                        </Button>
                      ) : (
                        <Button size="sm" onClick={onOpenCreateIssue} className="mt-2 text-[12px] gap-1">
                          <Plus className="h-3.5 w-3.5" />
                          <span>Create Issue</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    {/* Identifier */}
                    <td className="px-3.5 py-2.5 font-mono text-[11px] font-medium text-primary">
                      {getIssueDisplayIdentifier(issue.identifier)}
                    </td>

                    {/* Title & Labels */}
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TypeBadge type={issue.issue_type} showLabel={false} />
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {issue.title}
                        </span>
                        {issue.labels && issue.labels.length > 0 && (
                          <div className="flex items-center gap-1">
                            {issue.labels.slice(0, 3).map((lbl) => (
                              <span
                                key={lbl.id}
                                className="px-1.5 py-0.2 rounded text-[10px] font-medium border"
                                style={{
                                  backgroundColor: `${lbl.color}15`,
                                  color: lbl.color,
                                  borderColor: `${lbl.color}40`,
                                }}
                              >
                                {lbl.name}
                              </span>
                            ))}
                            {issue.labels.length > 3 && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                +{issue.labels.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-2.5">
                      <StatusBadge status={issue.status} />
                    </td>

                    {/* Priority / Severity */}
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <SeverityBadge severity={issue.severity} showLabel={false} />
                        <PriorityBadge priority={issue.priority} />
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="px-3.5 py-2.5">
                      {issue.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            {issue.assignee.avatar_url && (
                              <AvatarImage src={issue.assignee.avatar_url} alt={issue.assignee.username} />
                            )}
                            <AvatarFallback className="text-[9px] font-bold bg-primary/20 text-primary">
                              {issue.assignee.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[12px] text-foreground truncate max-w-[100px]">
                            {issue.assignee.display_name || issue.assignee.username}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11.5px] text-muted-foreground">Unassigned</span>
                      )}
                    </td>

                    {/* Updated */}
                    <td className="px-3.5 py-2.5 text-right font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(issue.updated_at || issue.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
