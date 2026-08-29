export type IssueType = 'BUG' | 'FEATURE' | 'TASK' | 'IMPROVEMENT'
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED'
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type ProjectRole = 'ADMIN' | 'MAINTAINER' | 'DEVELOPER' | 'VIEWER'
export type AuthProviderType = 'EMAIL' | 'GOOGLE' | 'GITHUB' | 'GUEST'
export type ResolutionType = 'FIXED' | 'DUPLICATE' | 'WONT_FIX' | 'INVALID' | 'WORKS_FOR_ME'

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploaded_at: string
}

export interface AnalyticsSummary {
  total: number
  open: number
  inProgress: number
  inReview: number
  resolved: number
  closed: number
  urgentOrHigh: number
  criticalBugs: number
  resolutionRate: number
}

export interface User {
  id: number
  username: string
  email?: string | null
  display_name?: string | null
  auth_provider: AuthProviderType
  is_email_verified?: boolean
  avatar_url?: string | null
  bio?: string | null
  role_title?: string | null
  skills?: string[]
  github_url?: string | null
  linkedin_url?: string | null
  website_url?: string | null
  is_open_to_work?: boolean
  created_at: string
  updated_at?: string
}

export interface PublicProfile {
  id: number
  username: string
  display_name?: string | null
  auth_provider: AuthProviderType
  avatar_url?: string | null
  bio?: string | null
  role_title?: string | null
  skills: string[]
  github_url?: string | null
  linkedin_url?: string | null
  website_url?: string | null
  is_open_to_work: boolean
  created_at: string
}

export interface Project {
  id: number
  name: string
  key: string
  display_key?: string
  description?: string
  created_by: number
  created_at: string
  updated_at?: string
  role?: ProjectRole
  member_count?: number
  issue_count?: number
}

export interface ProjectMember {
  id: number
  project_id: number
  user_id: number
  role: ProjectRole
  joined_at: string
  user: User
}

export interface Invitation {
  id: number
  project_id: number
  project_name?: string
  project_key?: string
  inviter_id?: number
  inviter_username?: string
  invitee_id: number
  invitee_username?: string
  role: ProjectRole
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  actor_id?: number
  actor_username?: string
  project_id?: number
  project_name?: string
  issue_id?: number
  issue_identifier?: string
  notification_type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface Label {
  id: number
  project_id: number
  name: string
  color: string
  created_at?: string
}

export interface IssueRelationship {
  id: number
  source_issue_id: number
  target_issue_id: number
  target_identifier?: string
  target_title?: string
  relationship_type: 'BLOCKS' | 'BLOCKED_BY' | 'RELATED' | 'DUPLICATE'
  created_at: string
}

export interface Milestone {
  id: number | string
  project_id: number
  name: string
  description?: string
  due_date?: string | null
  status: 'OPEN' | 'COMPLETED'
  total_issues?: number
  closed_issues?: number
  progress?: number
  created_at?: string
  updated_at?: string
}

export interface Issue {
  id: number
  project_id: number
  issue_number: number
  identifier: string
  title: string
  description?: string
  issue_type: IssueType
  status: IssueStatus
  priority: PriorityLevel
  severity: SeverityLevel
  creator_id: number
  assignee_id?: number | null
  milestone_id?: number | null
  milestone_name?: string | null
  resolution?: string | null
  created_at: string
  updated_at: string
  resolved_at?: string | null
  creator?: User | null
  assignee?: User | null
  labels: Label[]
  relationships?: IssueRelationship[]
}

export interface Comment {
  id: number
  issue_id: number
  author_id: number
  content: string
  created_at: string
  updated_at: string
  author?: User | null
}

export interface Activity {
  id: number
  issue_id?: number
  actor_id: number
  action: string
  field_name?: string | null
  old_value?: string | null
  new_value?: string | null
  metadata_json?: Record<string, any> | null
  created_at: string
  actor?: User | null
}
