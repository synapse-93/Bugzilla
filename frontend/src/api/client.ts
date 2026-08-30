import {
  User,
  PublicProfile,
  Project,
  ProjectMember,
  Invitation,
  Notification,
  Issue,
  Label,
  Comment,
  Activity,
  Milestone,
  IssueRelationship,
  ProjectRole,
} from '../types'

function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
  if (!envUrl) {
    return 'http://localhost:5000/api'
  }
  // Ensure the base URL always targets /api (whether Vercel env variable has /api suffix or not)
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
}

const API_BASE_URL = getApiBaseUrl()

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('bugzilla_auth_token')
  const { params, headers, ...customConfig } = options

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  let url = `${API_BASE_URL}${cleanEndpoint}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  }

  const response = await fetch(url, config)

  if (response.status === 204) {
    return {} as T
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (
      response.status === 401 &&
      !cleanEndpoint.includes('/auth/login') &&
      !cleanEndpoint.includes('/auth/register') &&
      !cleanEndpoint.includes('/auth/guest') &&
      !cleanEndpoint.includes('/auth/forgot-password') &&
      !cleanEndpoint.includes('/auth/reset-password')
    ) {
      if (unauthorizedHandler) {
        unauthorizedHandler()
      }
    }

    const errorMsg = data?.error?.message || data?.message || 'An unexpected error occurred'
    const error = new Error(errorMsg) as Error & { code?: string; details?: any; status: number }
    error.code = data?.error?.code
    error.details = data?.error?.details
    error.status = response.status
    throw error
  }

  return data as T
}

export const api = {
  auth: {
    register: (body: { username: string; email: string; password: string }) =>
      request<{ user: User; access_token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body: { email?: string; username?: string; password: string }) =>
      request<{ user: User; access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    guest: (body: { username: string; password: string }) =>
      request<{ user: User; access_token: string }>('/auth/guest', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    forgotPassword: (email: string) =>
      request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, password: string) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
    verifyEmail: (token: string) =>
      request<{ message: string; user: User }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
    oauthGitHub: (data: { username: string; email?: string; avatar_url?: string }) =>
      request<{ user: User; access_token: string }>('/auth/oauth/github', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    oauthCheck: (data: { email?: string; username?: string }) =>
      request<{ exists: boolean; username?: string }>('/auth/oauth/check', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    completeOAuthRegistration: (data: { pending_token: string; username: string }) =>
      request<{ user: User; access_token: string }>('/auth/oauth/complete-registration', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getGitHubAuthUrl: () => request<{ url: string }>('/auth/github?json=1'),
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ user: User }>('/auth/me'),
    getProfile: () => request<{ user: User }>('/auth/profile'),
    updateProfile: (data: Partial<User>) =>
      request<{ user: User }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    getPublicProfile: (userId: number) =>
      request<{ profile: PublicProfile }>(`/users/${userId}/public-profile`),
    listCollaborators: (skill?: string) =>
      request<{ collaborators: PublicProfile[] }>('/users/collaborators', {
        params: { skill },
      }),
  },

  invitations: {
    invite: (projectId: number, body: { username: string; role: ProjectRole }) =>
      request<{ invitation: Invitation }>(`/projects/${projectId}/invitations`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    myInvitations: () => request<{ invitations: Invitation[] }>('/invitations/my'),
    accept: (invitationId: number) =>
      request<{ status: string; project: Project }>(`/invitations/${invitationId}/accept`, {
        method: 'POST',
      }),
    decline: (invitationId: number) =>
      request<{ status: string }>(`/invitations/${invitationId}/decline`, {
        method: 'POST',
      }),
  },

  notifications: {
    list: () => request<{ notifications: Notification[]; unread_count: number }>('/notifications'),
    markRead: (id: number) =>
      request<{ notification: Notification }>(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    markAllRead: () => request<{ status: string }>('/notifications/mark-all-read', { method: 'POST' }),
  },

  projects: {
    list: () => request<{ projects: Project[] }>('/projects'),
    get: (id: number) => request<{ project: Project }>(`/projects/${id}`),
    create: (body: { name: string; key: string; description?: string }) =>
      request<{ project: Project }>('/projects', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    createWithFallbackKey: async (body: { name: string; key: string; description?: string }) => {
      return request<{ project: Project }>('/projects', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },
    update: (id: number, body: { name?: string; description?: string }) =>
      request<{ project: Project }>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: number) => request<{ status: string }>(`/projects/${id}`, { method: 'DELETE' }),
    getMembers: (projectId: number) =>
      request<{ members: ProjectMember[] }>(`/projects/${projectId}/members`),
    updateMemberRole: (projectId: number, userId: number, role: ProjectRole) =>
      request<{ member: ProjectMember }>(`/projects/${projectId}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    removeMember: (projectId: number, userId: number) =>
      request<{ status: string }>(`/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
      }),
  },

  issues: {
    list: (projectId: number, params?: Record<string, string | number | boolean | undefined>) =>
      request<{ issues: Issue[] }>(`/projects/${projectId}/issues`, { params }),
    get: (projectId: number, issueId: number) =>
      request<{ issue: Issue }>(`/projects/${projectId}/issues/${issueId}`),
    create: (
      projectId: number,
      body: {
        title: string
        description?: string
        issue_type?: string
        priority?: string
        severity?: string
        assignee_id?: number | null
        milestone_id?: number | null
        label_ids?: number[]
      }
    ) =>
      request<{ issue: Issue }>(`/projects/${projectId}/issues`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (projectId: number, issueId: number, body: Partial<Issue> & { label_ids?: number[] }) =>
      request<{ issue: Issue }>(`/projects/${projectId}/issues/${issueId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (projectId: number, issueId: number) =>
      request<{ status: string }>(`/projects/${projectId}/issues/${issueId}`, {
        method: 'DELETE',
      }),
  },

  milestones: {
    list: (projectId: number) =>
      request<{ milestones: Milestone[] }>(`/projects/${projectId}/milestones`),
    create: (projectId: number, body: { name: string; description?: string; due_date?: string }) =>
      request<{ milestone: Milestone }>(`/projects/${projectId}/milestones`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (projectId: number, milestoneId: number | string, body: Partial<Milestone>) =>
      request<{ milestone: Milestone }>(`/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (projectId: number, milestoneId: number | string) =>
      request<{ status: string }>(`/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'DELETE',
      }),
  },

  relationships: {
    list: (projectId: number, issueId: number) =>
      request<{ relationships: IssueRelationship[] }>(`/projects/${projectId}/issues/${issueId}/relationships`),
    create: (
      projectId: number,
      issueId: number,
      body: { target_issue_id: number; relationship_type: string }
    ) =>
      request<{ relationship: IssueRelationship }>(`/projects/${projectId}/issues/${issueId}/relationships`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    delete: (projectId: number, issueId: number, relationshipId: number) =>
      request<{ status: string }>(`/projects/${projectId}/issues/${issueId}/relationships/${relationshipId}`, {
        method: 'DELETE',
      }),
  },

  labels: {
    list: (projectId: number) => request<{ labels: Label[] }>(`/projects/${projectId}/labels`),
    create: (projectId: number, body: { name: string; color: string }) =>
      request<{ label: Label }>(`/projects/${projectId}/labels`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (projectId: number, labelId: number, body: { name?: string; color?: string }) =>
      request<{ label: Label }>(`/projects/${projectId}/labels/${labelId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (projectId: number, labelId: number) =>
      request<{ status: string }>(`/projects/${projectId}/labels/${labelId}`, {
        method: 'DELETE',
      }),
  },

  comments: {
    list: (projectId: number, issueId: number) =>
      request<{ comments: Comment[] }>(`/projects/${projectId}/issues/${issueId}/comments`),
    create: (projectId: number, issueId: number, content: string) =>
      request<{ comment: Comment }>(`/projects/${projectId}/issues/${issueId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: content, content }),
      }),
    update: (projectId: number, issueId: number, commentId: number, content: string) =>
      request<{ comment: Comment }>(
        `/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ body: content, content }),
        }
      ),
    delete: (projectId: number, issueId: number, commentId: number) =>
      request<{ status: string }>(
        `/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
        {
          method: 'DELETE',
        }
      ),
  },

  activities: {
    listIssue: (projectId: number, issueId: number) =>
      request<{ activities: Activity[] }>(`/projects/${projectId}/issues/${issueId}/activities`),
    listProject: (projectId: number) =>
      request<{ activities: Activity[] }>(`/projects/${projectId}/activities`),
  },

  analytics: {
    getOverview: (projectId: number) =>
      request<{
        total_issues: number
        open_issues: number
        resolved_issues: number
        closed_issues: number
        critical_issues: number
      }>(`/projects/${projectId}/analytics/overview`),
    getStatusDistribution: (projectId: number) =>
      request<{ distribution: { status: string; count: number }[] }>(
        `/projects/${projectId}/analytics/status-distribution`
      ),
    getPriorityDistribution: (projectId: number) =>
      request<{ distribution: { priority: string; count: number }[] }>(
        `/projects/${projectId}/analytics/priority-distribution`
      ),
  },

  health: {
    checkDb: () =>
      request<{ status: string; database: string }>('/health/db'),
  },
}
