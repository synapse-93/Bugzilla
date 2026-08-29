export interface User {
  id: number
  username: string
  email?: string
  created_at?: string
}

export interface Project {
  id: number
  name: string
  key: string
  display_key?: string
  description?: string | null
  created_by?: number | null
  created_at?: string
  role?: string
  member_count?: number
  issue_count?: number
  labels?: Label[]
}

export interface ProjectMember {
  id: number
  project_id: number
  user_id: number
  role: 'ADMIN' | 'MAINTAINER' | 'DEVELOPER' | 'VIEWER'
  joined_at: string
  user?: User
}

export type IssueType = 'BUG' | 'FEATURE' | 'TASK' | 'IMPROVEMENT'
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED'
export type PriorityLevel = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type ResolutionType = 'FIXED' | 'DUPLICATE' | 'WONT_FIX' | 'INVALID' | 'WORKS_FOR_ME'

export interface Label {
  id: number
  project_id: number
  name: string
  color: string
}

export interface Issue {
  id: number
  project_id: number
  issue_number: number
  identifier: string
  title: string
  description?: string | null
  issue_type: IssueType
  status: IssueStatus
  priority: PriorityLevel
  severity: SeverityLevel
  creator_id?: number | null
  creator?: User | null
  assignee_id?: number | null
  assignee?: User | null
  resolution?: ResolutionType | null
  labels?: Label[]
  milestone_id?: string | null
  created_at: string
  updated_at: string
  resolved_at?: string | null
}

export interface Comment {
  id: number
  issue_id: number
  author_id?: number | null
  author?: User | null
  body: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: number
  issue_id: number
  actor_id?: number | null
  actor?: User | null
  action_type: string
  old_value?: string | null
  new_value?: string | null
  metadata?: Record<string, any>
  created_at: string
}

export interface AnalyticsSummary {
  total: number
  open: number
  resolved: number
  critical: number
  members: number
  labels: number
}

export interface Milestone {
  id: string
  project_id: number
  name: string
  description?: string
  due_date?: string
  status: 'OPEN' | 'COMPLETED'
  created_at: string
}

export type RelationshipType = 'BLOCKS' | 'BLOCKED_BY' | 'RELATED' | 'DUPLICATE'

export interface IssueRelationship {
  id: string
  source_issue_id: number
  target_issue_id: number
  target_issue_identifier: string
  target_issue_title: string
  type: RelationshipType
  created_at: string
}

export interface SavedFilter {
  id: string
  name: string
  filters: Record<string, string | undefined>
  is_preset?: boolean
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'ASSIGNMENT' | 'COMMENT' | 'STATUS_CHANGE' | 'PROJECT_INVITE'
  created_at: string
  read: boolean
  issue_id?: number
  project_id?: number
}

export interface Attachment {
  id: string
  filename: string
  size: number
  uploaded_at: string
  url?: string
}
