import React, { useState, useEffect } from 'react'
import { AnalyticsSummary, Activity } from '../types'
import { api } from '../api/client'
import {
  BarChart3,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Users,
  Tags,
  Activity as ActivityIcon,
  TrendingUp,
} from 'lucide-react'

interface AnalyticsViewProps {
  projectId: number
}

export function AnalyticsView({ projectId }: AnalyticsViewProps) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [statusDist, setStatusDist] = useState<Record<string, number>>({})
  const [priorityDist, setPriorityDist] = useState<Record<string, number>>({})
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true)
      try {
        const [sumRes, statRes, prioRes, actRes] = await Promise.all([
          api.analytics.getSummary(projectId),
          api.analytics.getStatus(projectId),
          api.analytics.getPriority(projectId),
          api.activities.listProject(projectId),
        ])
        setSummary(sumRes.summary)
        setStatusDist(statRes.distribution)
        setPriorityDist(prioRes.distribution)
        setActivities(actRes.activities)
      } catch (err) {
        console.error('Failed to load analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [projectId])

  if (loading) {
    return <div className="loading-box py-8">Loading analytics metrics...</div>
  }

  const total = summary?.total || 0
  const resolutionRate = total > 0 ? Math.round(((summary?.resolved || 0) / total) * 100) : 0

  return (
    <div className="analytics-container">
      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box bg-blue-tint">
            <Clock size={18} className="text-blue" />
          </div>
          <div className="metric-data">
            <span className="metric-label">Open Issues</span>
            <strong className="metric-value">{summary?.open || 0}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-green-tint">
            <CheckCircle2 size={18} className="text-green" />
          </div>
          <div className="metric-data">
            <span className="metric-label">Resolved Issues</span>
            <strong className="metric-value">{summary?.resolved || 0}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-red-tint">
            <AlertOctagon size={18} className="text-red" />
          </div>
          <div className="metric-data">
            <span className="metric-label">Critical Blockers</span>
            <strong className="metric-value">{summary?.critical || 0}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-purple-tint">
            <TrendingUp size={18} className="text-purple" />
          </div>
          <div className="metric-data">
            <span className="metric-label">Resolution Rate</span>
            <strong className="metric-value">{resolutionRate}%</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-yellow-tint">
            <Users size={18} className="text-yellow" />
          </div>
          <div className="metric-data">
            <span className="metric-label">Team Members</span>
            <strong className="metric-value">{summary?.members || 0}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-cyan-tint">
            <Tags size={18} className="text-cyan" />
          </div>
          <div className="metric-data">
            <span className="metric-label">Active Labels</span>
            <strong className="metric-value">{summary?.labels || 0}</strong>
          </div>
        </div>
      </div>

      {/* Distribution Charts / Breakdowns */}
      <div className="analytics-split-row">
        <div className="analytics-card">
          <h3>Status Breakdown</h3>
          <div className="distribution-bars">
            {Object.entries(statusDist).map(([status, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={status} className="dist-row">
                  <div className="dist-info">
                    <span className="dist-label">{status.replace('_', ' ')}</span>
                    <span className="dist-count font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill fill-${status.toLowerCase()}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="analytics-card">
          <h3>Priority Distribution</h3>
          <div className="distribution-bars">
            {Object.entries(priorityDist).map(([priority, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={priority} className="dist-row">
                  <div className="dist-info">
                    <span className="dist-label">{priority}</span>
                    <span className="dist-count font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill fill-prio-${priority.toLowerCase()}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Project Activity Stream */}
      <div className="analytics-card full-width">
        <div className="card-header-row">
          <div className="flex-row gap-2 items-center">
            <ActivityIcon size={16} />
            <h3>Recent Project Activity</h3>
          </div>
          <span className="text-xs text-muted">Last 50 events</span>
        </div>

        {activities.length === 0 ? (
          <div className="text-muted text-sm py-4">No recent activity recorded for this project.</div>
        ) : (
          <div className="activity-timeline">
            {activities.map((act) => (
              <div key={act.id} className="activity-item">
                <div className="activity-dot" />
                <div className="activity-content">
                  <div className="activity-header">
                    <strong>{act.actor?.username || 'User'}</strong>
                    <span className="activity-action">{act.action_type.replace('_', ' ')}</span>
                    <span className="activity-date">{new Date(act.created_at).toLocaleString()}</span>
                  </div>
                  {(act.old_value || act.new_value) && (
                    <div className="activity-diff">
                      {act.old_value && <span className="diff-old">{act.old_value}</span>}
                      {act.old_value && act.new_value && <span className="diff-arrow">→</span>}
                      {act.new_value && <span className="diff-new">{act.new_value}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
