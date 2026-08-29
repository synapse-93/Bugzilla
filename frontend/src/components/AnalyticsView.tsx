import React, { useState, useEffect } from 'react'
import { AnalyticsSummary, Issue } from '../types'
import { api } from '../api/client'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts'
import { BarChart2, PieChart as PieIcon, TrendingUp, Tag, AlertCircle } from 'lucide-react'

interface AnalyticsViewProps {
  projectId: number
  issues?: Issue[]
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#60a5fa',
  IN_PROGRESS: '#facc15',
  IN_REVIEW: '#c084fc',
  RESOLVED: '#4ade80',
  CLOSED: '#71717a',
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#94a3b8',
}

export function AnalyticsView({ projectId, issues = [] }: AnalyticsViewProps) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([])
  const [priorityData, setPriorityData] = useState<{ name: string; value: number; color: string }[]>([])
  const [labelData, setLabelData] = useState<{ name: string; count: number }[]>([])
  const [timelineData, setTimelineData] = useState<{ date: string; created: number; resolved: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [projectId, issues.length])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [sumRes, statRes, priRes] = await Promise.all([
        api.analytics.getSummary(projectId),
        api.analytics.getStatus(projectId),
        api.analytics.getPriority(projectId),
      ])

      setSummary(sumRes.summary)

      // Transform Status Data
      const sData = Object.entries(statRes.distribution).map(([status, count]) => ({
        name: status.replace('_', ' '),
        value: count,
        color: STATUS_COLORS[status] || '#a1a1aa',
      }))
      setStatusData(sData)

      // Transform Priority Data
      const pData = Object.entries(priRes.distribution).map(([priority, count]) => ({
        name: priority,
        value: count,
        color: PRIORITY_COLORS[priority] || '#a1a1aa',
      }))
      setPriorityData(pData)

      // Transform Label Data from active issues
      const labelCounts: Record<string, number> = {}
      issues.forEach((i) => {
        ;(i.labels || []).forEach((lbl) => {
          labelCounts[lbl.name] = (labelCounts[lbl.name] || 0) + 1
        })
      })
      const lData = Object.entries(labelCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
      setLabelData(lData)

      // Compute simple 7-day trend
      const daysMap: Record<string, { created: number; resolved: number }> = {}
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        daysMap[dateKey] = { created: 0, resolved: 0 }
      }

      issues.forEach((i) => {
        if (i.created_at) {
          const dKey = new Date(i.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (daysMap[dKey]) daysMap[dKey].created += 1
        }
        if (i.resolved_at) {
          const dKey = new Date(i.resolved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (daysMap[dKey]) daysMap[dKey].resolved += 1
        }
      })

      setTimelineData(
        Object.entries(daysMap).map(([date, counts]) => ({
          date,
          created: counts.created,
          resolved: counts.resolved,
        }))
      )
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="empty-state py-12">
        <div className="text-muted text-sm">Loading project analytics & metric charts...</div>
      </div>
    )
  }

  const completionRate =
    summary && summary.total > 0
      ? Math.round((summary.resolved / summary.total) * 100)
      : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Total Tracked
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{summary?.total || 0}</div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', marginBottom: '4px' }}>
            Active Open
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#60a5fa' }}>{summary?.open || 0}</div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#4ade80', textTransform: 'uppercase', marginBottom: '4px' }}>
            Resolved
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#4ade80' }}>{summary?.resolved || 0}</div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>
            Critical Blockers
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f87171' }}>{summary?.critical || 0}</div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Resolution Rate
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)' }}>{completionRate}%</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Chart 1: Status Donut Chart */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieIcon size={16} className="text-blue-400" />
              <span className="card-title">Issues by Status</span>
            </div>
          </div>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-raised)',
                    borderColor: 'var(--border-muted)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Priority Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={16} className="text-amber-400" />
              <span className="card-title">Issues by Priority</span>
            </div>
          </div>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-raised)',
                    borderColor: 'var(--border-muted)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" name="Issues" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Velocity Activity Trend */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="card-title">Weekly Creation & Resolution Trend</span>
            </div>
          </div>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-raised)',
                    borderColor: 'var(--border-muted)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="created" name="Created" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Top Labels Distribution */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={16} className="text-purple-400" />
              <span className="card-title">Top Issue Labels</span>
            </div>
          </div>
          <div style={{ height: '260px' }}>
            {labelData.length === 0 ? (
              <div className="empty-state py-12">
                <p className="text-xs text-muted">No labels assigned to issues yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={labelData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface-raised)',
                      borderColor: 'var(--border-muted)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Issues" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
