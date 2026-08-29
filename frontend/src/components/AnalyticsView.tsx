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
      const [overviewRes, statRes, priRes] = await Promise.all([
        api.analytics.getOverview(projectId).catch(() => null),
        api.analytics.getStatusDistribution(projectId).catch(() => null),
        api.analytics.getPriorityDistribution(projectId).catch(() => null),
      ])

      // Fallback calculation from local issues if backend endpoints are not returning values
      const total = overviewRes ? overviewRes.total_issues : issues.length
      const open = overviewRes
        ? overviewRes.open_issues
        : issues.filter((i) => i.status === 'OPEN').length
      const inProgress = issues.filter((i) => i.status === 'IN_PROGRESS').length
      const inReview = issues.filter((i) => i.status === 'IN_REVIEW').length
      const resolved = overviewRes
        ? overviewRes.resolved_issues
        : issues.filter((i) => i.status === 'RESOLVED').length
      const closed = overviewRes
        ? overviewRes.closed_issues
        : issues.filter((i) => i.status === 'CLOSED').length
      const criticalBugs = overviewRes
        ? overviewRes.critical_issues
        : issues.filter((i) => i.severity === 'CRITICAL' || i.priority === 'URGENT').length
      const urgentOrHigh = issues.filter((i) => i.priority === 'URGENT' || i.priority === 'HIGH').length
      const resolutionRate = total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0

      setSummary({
        total,
        open,
        inProgress,
        inReview,
        resolved,
        closed,
        urgentOrHigh,
        criticalBugs,
        resolutionRate,
      })

      // Transform Status Data
      if (statRes && statRes.distribution) {
        const sData = statRes.distribution.map((item) => ({
          name: item.status.replace('_', ' '),
          value: Number(item.count) || 0,
          color: STATUS_COLORS[item.status] || '#a1a1aa',
        }))
        setStatusData(sData)
      } else {
        const statusCounts: Record<string, number> = { OPEN: 0, IN_PROGRESS: 0, IN_REVIEW: 0, RESOLVED: 0, CLOSED: 0 }
        issues.forEach((i) => {
          statusCounts[i.status] = (statusCounts[i.status] || 0) + 1
        })
        setStatusData(
          Object.entries(statusCounts).map(([status, count]) => ({
            name: status.replace('_', ' '),
            value: count,
            color: STATUS_COLORS[status] || '#a1a1aa',
          }))
        )
      }

      // Transform Priority Data
      if (priRes && priRes.distribution) {
        const pData = priRes.distribution.map((item) => ({
          name: item.priority,
          value: Number(item.count) || 0,
          color: PRIORITY_COLORS[item.priority] || '#a1a1aa',
        }))
        setPriorityData(pData)
      } else {
        const priorityCounts: Record<string, number> = { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
        issues.forEach((i) => {
          priorityCounts[i.priority] = (priorityCounts[i.priority] || 0) + 1
        })
        setPriorityData(
          Object.entries(priorityCounts).map(([priority, count]) => ({
            name: priority,
            value: count,
            color: PRIORITY_COLORS[priority] || '#a1a1aa',
          }))
        )
      }

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
          const d = new Date(i.created_at)
          const k = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (daysMap[k]) daysMap[k].created++
        }
        if (i.resolved_at) {
          const d = new Date(i.resolved_at)
          const k = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (daysMap[k]) daysMap[k].resolved++
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
    return <div className="text-center py-12 text-muted text-sm">Computing analytics metrics...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Tracked Issues
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {summary?.total || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across all statuses
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Open / Active Issues
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#60a5fa', marginTop: '4px' }}>
            {(summary?.open || 0) + (summary?.inProgress || 0) + (summary?.inReview || 0)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {summary?.inProgress || 0} in progress
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Resolution Rate
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#4ade80', marginTop: '4px' }}>
            {summary?.resolutionRate || 0}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {(summary?.resolved || 0) + (summary?.closed || 0)} resolved or closed
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Critical / High Priority
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>
            {summary?.criticalBugs || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Requires immediate attention
          </div>
        </div>
      </div>

      {/* Chart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
        {/* Status Distribution */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <PieIcon size={16} className="text-blue-400" />
            <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Status Distribution</h4>
          </div>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData.filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-raised)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart2 size={16} className="text-amber-400" />
            <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Priority Breakdown</h4>
          </div>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-raised)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" name="Issues" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Velocity & Activity Trend */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={16} className="text-emerald-400" />
            <h4 style={{ fontSize: '14px', fontWeight: 600 }}>7-Day Issue Activity</h4>
          </div>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-raised)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="created" name="Created" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#4ade80" fill="#4ade80" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Labels Distribution */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Tag size={16} className="text-purple-400" />
            <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Top Labels</h4>
          </div>
          {labelData.length === 0 ? (
            <div className="text-muted text-xs py-12 text-center">No labeled issues yet.</div>
          ) : (
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer>
                <BarChart data={labelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface-raised)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Issues" fill="#818cf8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
