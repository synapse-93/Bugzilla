import { Project, Issue, Label, Comment, Activity, AnalyticsSummary, ProjectMember, User } from '../types'

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '') + '/api'

export class ApiError extends Error {
  code: string
  status: number
  details: Record<string, any>

  constructor(code: string, message: string, status: number, details = {}) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('bugzilla_auth_token')
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const response = await fetch(url, { ...options, headers })

  if (response.status === 204) {
    return {} as T
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const err = data.error || {}
    throw new ApiError(
      err.code || 'REQUEST_FAILED',
      err.message || response.statusText || 'An unexpected error occurred',
      response.status,
      err.details || {}
    )
  }

  return data as T
}

export const api = {
  health: {
    check: () => request<{ status: string }>('/health'),
    checkDb: () => request<{ status: string; database: string }>('/health/db'),
  },

  auth: {
    register: (data: { username: string; email: string; password: string }) =>
      request<{ user: User; access_token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email?: string; username?: string; password: string }) =>
      request<{ user: User; access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<{ user: User }>('/auth/me'),
  },

  projects: {
    list: () => request<{ projects: Project[] }>('/projects'),
    create: (data: { name: string; key: string; description?: string }) =>
      request<{ project: Project }>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: number) => request<{ project: Project }>(`/projects/${id}`),
    update: (id: number, data: { name?: string; description?: string }) =>
      request<{ project: Project }>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ status: string }>(`/projects/${id}`, {
        method: 'DELETE',
      }),
    getMembers: (id: number) =>
      request<{ members: ProjectMember[] }>(`/projects/${id}/members`),
    addMember: (id: number, data: { email?: string; username?: string; role: string }) =>
      request<{ member: ProjectMember }>(`/projects/${id}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateMemberRole: (id: number, userId: number, role: string) =>
      request<{ member: ProjectMember }>(`/projects/${id}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    removeMember: (id: number, userId: number) =>
      request<{ status: string }>(`/projects/${id}/members/${userId}`, {
        method: 'DELETE',
      }),
  },

  issues: {
    list: (projectId: number, params: Record<string, string | undefined> = {}) => {
      const query = new URLSearchParams()
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, v)
      })
      const qs = query.toString()
      return request<{ issues: Issue[] }>(`/projects/${projectId}/issues${qs ? `?${qs}` : ''}`)
    },
    create: (projectId: number, data: Partial<Issue> & { label_ids?: number[] }) =>
      request<{ issue: Issue }>(`/projects/${projectId}/issues`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (projectId: number, issueId: number) =>
      request<{ issue: Issue }>(`/projects/${projectId}/issues/${issueId}`),
    update: (projectId: number, issueId: number, data: Partial<Issue> & { label_ids?: number[] }) =>
      request<{ issue: Issue }>(`/projects/${projectId}/issues/${issueId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (projectId: number, issueId: number) =>
      request<{ status: string }>(`/projects/${projectId}/issues/${issueId}`, {
        method: 'DELETE',
      }),
  },

  labels: {
    list: (projectId: number) => request<{ labels: Label[] }>(`/projects/${projectId}/labels`),
    create: (projectId: number, data: { name: string; color: string }) =>
      request<{ label: Label }>(`/projects/${projectId}/labels`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (projectId: number, labelId: number) =>
      request<{ status: string }>(`/projects/${projectId}/labels/${labelId}`, {
        method: 'DELETE',
      }),
  },

  comments: {
    list: (projectId: number, issueId: number) =>
      request<{ comments: Comment[] }>(`/projects/${projectId}/issues/${issueId}/comments`),
    create: (projectId: number, issueId: number, body: string) =>
      request<{ comment: Comment }>(`/projects/${projectId}/issues/${issueId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    update: (projectId: number, issueId: number, commentId: number, body: string) =>
      request<{ comment: Comment }>(`/projects/${projectId}/issues/${issueId}/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      }),
    delete: (projectId: number, issueId: number, commentId: number) =>
      request<{ status: string }>(`/projects/${projectId}/issues/${issueId}/comments/${commentId}`, {
        method: 'DELETE',
      }),
  },

  activities: {
    listIssue: (projectId: number, issueId: number) =>
      request<{ activities: Activity[] }>(`/projects/${projectId}/issues/${issueId}/activities`),
    listProject: (projectId: number) =>
      request<{ activities: Activity[] }>(`/projects/${projectId}/activities`),
  },

  analytics: {
    getSummary: (projectId: number) =>
      request<{ summary: AnalyticsSummary }>(`/projects/${projectId}/analytics/summary`),
    getStatus: (projectId: number) =>
      request<{ distribution: Record<string, number> }>(`/projects/${projectId}/analytics/status`),
    getPriority: (projectId: number) =>
      request<{ distribution: Record<string, number> }>(`/projects/${projectId}/analytics/priority`),
  },
}
