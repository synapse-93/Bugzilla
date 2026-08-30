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
import { BarChart2, PieChart as PieIcon, TrendingUp, Tag, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from './ui/chart'
import { NeonPatternDefs } from './NeonPatternDefs'

interface AnalyticsViewProps {
  projectId: number
  issues?: Issue[]
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#38bdf8',
  IN_PROGRESS: '#fbbf24',
  IN_REVIEW: '#c084fc',
  RESOLVED: '#4ade80',
  CLOSED: '#71717a',
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#34d399',
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

      // Status
      if (statRes && statRes.distribution) {
        setStatusData(
          statRes.distribution.map((item) => ({
            name: item.status.replace('_', ' '),
            value: Number(item.count) || 0,
            color: STATUS_COLORS[item.status] || '#a1a1aa',
          }))
        )
      } else {
        const counts: Record<string, number> = { OPEN: 0, IN_PROGRESS: 0, IN_REVIEW: 0, RESOLVED: 0, CLOSED: 0 }
        issues.forEach((i) => {
          counts[i.status] = (counts[i.status] || 0) + 1
        })
        setStatusData(
          Object.entries(counts).map(([status, count]) => ({
            name: status.replace('_', ' '),
            value: count,
            color: STATUS_COLORS[status] || '#a1a1aa',
          }))
        )
      }

      // Priority
      if (priRes && priRes.distribution) {
        setPriorityData(
          priRes.distribution.map((item) => ({
            name: item.priority,
            value: Number(item.count) || 0,
            color: PRIORITY_COLORS[item.priority] || '#a1a1aa',
          }))
        )
      } else {
        const counts: Record<string, number> = { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
        issues.forEach((i) => {
          counts[i.priority] = (counts[i.priority] || 0) + 1
        })
        setPriorityData(
          Object.entries(counts).map(([priority, count]) => ({
            name: priority,
            value: count,
            color: PRIORITY_COLORS[priority] || '#a1a1aa',
          }))
        )
      }

      // Labels
      const labelCounts: Record<string, number> = {}
      issues.forEach((i) => {
        ;(i.labels || []).forEach((lbl) => {
          labelCounts[lbl.name] = (labelCounts[lbl.name] || 0) + 1
        })
      })
      setLabelData(
        Object.entries(labelCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
      )

      // 7-day timeline
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

  const defaultChartConfig: ChartConfig = {
    issues: { label: 'Issues', color: 'hsl(var(--primary))' },
    created: { label: 'Created', color: '#38bdf8' },
    resolved: { label: 'Resolved', color: '#4ade80' },
  }

  if (loading) {
    return <div className="text-center py-16 text-muted-foreground text-[13px]">Computing telemetry and analytics...</div>
  }

  return (
    <div className="space-y-6 max-w-[1400px] w-full min-w-0">
      <NeonPatternDefs />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/80 bg-card p-4 space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Issues
          </p>
          <p className="text-2xl font-bold text-foreground">{summary?.total || 0}</p>
          <p className="text-[10px] text-muted-foreground">Across entire history</p>
        </Card>

        <Card className="border-border/80 bg-card p-4 space-y-1">
          <p className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">
            Active / Open
          </p>
          <p className="text-2xl font-bold text-sky-400">
            {(summary?.open || 0) + (summary?.inProgress || 0) + (summary?.inReview || 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">{summary?.inProgress || 0} in active development</p>
        </Card>

        <Card className="border-border/80 bg-card p-4 space-y-1">
          <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
            Resolution Rate
          </p>
          <p className="text-2xl font-bold text-emerald-400">{summary?.resolutionRate || 0}%</p>
          <p className="text-[10px] text-muted-foreground">
            {(summary?.resolved || 0) + (summary?.closed || 0)} resolved or closed
          </p>
        </Card>

        <Card className="border-border/80 bg-card p-4 space-y-1">
          <p className="text-[11px] font-medium text-red-400 uppercase tracking-wider">
            Urgent / Critical
          </p>
          <p className="text-2xl font-bold text-red-400">{summary?.criticalBugs || 0}</p>
          <p className="text-[10px] text-muted-foreground">High impact items</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <Card className="border-border/80 bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
              <PieIcon className="h-4 w-4 text-sky-400" />
              <span>Status Distribution</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Proportion of issues across each pipeline stage
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ChartContainer config={defaultChartConfig} className="h-[220px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={statusData.filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                >
                  {statusData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card className="border-border/80 bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-amber-400" />
              <span>Priority Breakdown</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Distribution of issues by priority level
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ChartContainer config={defaultChartConfig} className="h-[220px] w-full">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" name="Issues" radius={[3, 3, 0, 0]}>
                  {priorityData.map((entry, idx) => (
                    <Cell key={`cell-bar-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 7-Day Velocity Trend */}
        <Card className="border-border/80 bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>7-Day Issue Activity</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              New vs. resolved issues over the past week
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ChartContainer config={defaultChartConfig} className="h-[220px] w-full">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="created" name="Created" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#4ade80" fill="#4ade80" fillOpacity={0.2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Labels Distribution */}
        <Card className="border-border/80 bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-purple-400" />
              <span>Top Labels</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Most frequently applied tags
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {labelData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-[12px]">
                No labeled issues recorded yet.
              </div>
            ) : (
              <ChartContainer config={defaultChartConfig} className="h-[220px] w-full">
                <BarChart data={labelData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" name="Issues" fill="#818cf8" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
