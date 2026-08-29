import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { IssueStatus, PriorityLevel, SeverityLevel, IssueType } from '../types'

/**
 * Extracts friendly display key from project key (e.g. 'TEST-6E' -> 'TEST' or 'TEST' -> 'TEST')
 */
export function getDisplayProjectKey(rawKey: string): string {
  if (!rawKey) return ''
  const parts = rawKey.split('-')
  return parts[0].toUpperCase()
}

/**
 * Formats issue display identifier preserving friendly display key
 */
export function getIssueDisplayIdentifier(identifier: string, projectDisplayKey?: string): string {
  if (!identifier) return ''
  if (!projectDisplayKey) return identifier
  const parts = identifier.split('-')
  if (parts.length >= 2) {
    const issueNum = parts[parts.length - 1]
    return `${getDisplayProjectKey(projectDisplayKey)}-${issueNum}`
  }
  return identifier
}

/**
 * Safely formats an ISO date string
 */
export function formatDate(dateStr?: string | null, formatPattern: string = 'MMM d, yyyy'): string {
  if (!dateStr) return '-'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(date, formatPattern)
  } catch {
    return dateStr
  }
}

/**
 * Formats relative time (e.g. '2 hours ago')
 */
export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return dateStr
  }
}

export function getStatusLabel(status: IssueStatus): string {
  switch (status) {
    case 'OPEN':
      return 'Open'
    case 'IN_PROGRESS':
      return 'In Progress'
    case 'IN_REVIEW':
      return 'In Review'
    case 'RESOLVED':
      return 'Resolved'
    case 'CLOSED':
      return 'Closed'
    default:
      return status
  }
}

export function getStatusColor(status: IssueStatus): { bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'OPEN':
      return { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)', dot: '#3b82f6' }
    case 'IN_PROGRESS':
      return { bg: 'rgba(234, 179, 8, 0.12)', text: '#facc15', border: 'rgba(234, 179, 8, 0.3)', dot: '#eab308' }
    case 'IN_REVIEW':
      return { bg: 'rgba(168, 85, 247, 0.12)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)', dot: '#a855f7' }
    case 'RESOLVED':
      return { bg: 'rgba(34, 197, 94, 0.12)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.3)', dot: '#22c55e' }
    case 'CLOSED':
      return { bg: 'rgba(113, 113, 122, 0.16)', text: '#a1a1aa', border: 'rgba(113, 113, 122, 0.3)', dot: '#71717a' }
    default:
      return { bg: 'rgba(113, 113, 122, 0.12)', text: '#a1a1aa', border: 'rgba(113, 113, 122, 0.2)', dot: '#71717a' }
  }
}

export function getPriorityColor(priority: PriorityLevel): { bg: string; text: string; border: string } {
  switch (priority) {
    case 'URGENT':
      return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.35)' }
    case 'HIGH':
      return { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.35)' }
    case 'MEDIUM':
      return { bg: 'rgba(234, 179, 8, 0.12)', text: '#facc15', border: 'rgba(234, 179, 8, 0.25)' }
    case 'LOW':
      return { bg: 'rgba(148, 163, 184, 0.12)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.2)' }
    default:
      return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8', border: 'transparent' }
  }
}

export function getIssueTypeIconName(type: IssueType): string {
  switch (type) {
    case 'BUG':
      return 'Bug'
    case 'FEATURE':
      return 'Sparkles'
    case 'TASK':
      return 'CheckSquare'
    case 'IMPROVEMENT':
      return 'TrendingUp'
    default:
      return 'Circle'
  }
}
