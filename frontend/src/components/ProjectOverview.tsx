import React, { useMemo } from 'react'
import { Project, Issue, Activity, Milestone } from '../types'
import {
  Layers,
  Target,
  Activity as ActivityIcon,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { getDisplayProjectKey, getIssueDisplayIdentifier, formatRelativeTime } from '../utils/helpers'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { SeverityBadge } from './SeverityBadge'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from './ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { NeonPatternDefs } from './NeonPatternDefs'
import { ActiveView } from './Sidebar'

interface ProjectOverviewProps {
  project: Project
  issues: Issue[]
  activities: Activity[]
  milestones: Milestone[]
  onSelectIssue: (issue: Issue) => void
  onChangeView: (view: ActiveView) => void
  onOpenCreateIssue: () => void
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'hsl(var(--info))',
  IN_PROGRESS: 'hsl(var(--warning))',
  IN_REVIEW: 'hsl(280, 60%, 55%)',
  RESOLVED: 'hsl(var(--success))',
  CLOSED: 'hsl(var(--muted-foreground))',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'hsl(var(--severity-critical))',
  HIGH: 'hsl(var(--severity-high))',
  MEDIUM: 'hsl(var(--severity-medium))',
  LOW: 'hsl(var(--severity-low))',
}

export function ProjectOverview({
  project,
  issues,
  activities,
  milestones,
  onSelectIssue,
  onChangeView,
  onOpenCreateIssue,
}: ProjectOverviewProps) {
  // Metrics calculation
  const total = issues.length
  const openCount = issues.filter((i) => i.status === 'OPEN').length
  const inProgressCount = issues.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'IN_REVIEW').length
  const resolvedCount = issues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length
  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL' && i.status !== 'CLOSED' && i.status !== 'RESOLVED').length
  const completionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0

  const highPriorityIssues = issues.filter(
    (i) => (i.priority === 'HIGH' || i.priority === 'URGENT' || i.severity === 'CRITICAL') && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
  )

  // Status Distribution for Charts
  const statusData = useMemo(() => {
    const counts: Record<string, number> = { OPEN: 0, IN_PROGRESS: 0, IN_REVIEW: 0, RESOLVED: 0, CLOSED: 0 }
    issues.forEach((i) => {
      counts[i.status] = (counts[i.status] || 0) + 1
    })
    return Object.entries(counts).map(([key, count]) => ({
      status: STATUS_LABELS[key] || key,
      count,
      fill: STATUS_COLORS[key] || 'hsl(var(--primary))',
    }))
  }, [issues])

  const statusChartConfig: ChartConfig = Object.fromEntries(
    Object.entries(STATUS_LABELS).map(([k, label]) => [k, { label, color: STATUS_COLORS[k] }])
  )

  // Severity Distribution for Pie Chart
  const severityData = useMemo(() => {
    const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    issues.forEach((i) => {
      counts[i.severity] = (counts[i.severity] || 0) + 1
    })
    return Object.entries(counts).map(([key, value]) => ({
      name: key.charAt(0) + key.slice(1).toLowerCase(),
      value,
      fill: SEVERITY_COLORS[key] || 'hsl(var(--muted))',
    }))
  }, [issues])

  const severityChartConfig: ChartConfig = {
    critical: { label: 'Critical', color: SEVERITY_COLORS.CRITICAL },
    high: { label: 'High', color: SEVERITY_COLORS.HIGH },
    medium: { label: 'Medium', color: SEVERITY_COLORS.MEDIUM },
    low: { label: 'Low', color: SEVERITY_COLORS.LOW },
  }

  return (
    <div className="space-y-6 max-w-[1400px] w-full min-w-0">
      <NeonPatternDefs />

      {/* Project Banner Card */}
      <Card className="border-border/80 bg-gradient-to-r from-card via-card to-card/60 shadow-sm overflow-hidden">
        <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[11px] font-mono font-semibold border border-primary/30 shrink-0">
                {getDisplayProjectKey(project.key)}
              </span>
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground truncate">
                {project.name}
              </h2>
            </div>
            <p className="text-[12.5px] text-muted-foreground max-w-2xl line-clamp-2">
              {project.description || 'Developer project workspace for issues, milestones, and releases.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChangeView('board')}
              className="gap-1.5 text-[12px] h-8"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </Button>
            <Button
              size="sm"
              onClick={onOpenCreateIssue}
              className="gap-1.5 text-[12px] h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Issue</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-3.5 border-border/80 bg-card">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Issues
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground mt-1">{total}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Across all workflow stages</p>
        </Card>

        <Card className="p-3.5 border-border/80 bg-card">
          <p className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">
            Open
          </p>
          <p className="text-2xl font-bold tracking-tight text-sky-400 mt-1">{openCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Awaiting triage & work</p>
        </Card>

        <Card className="p-3.5 border-border/80 bg-card">
          <p className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">
            In Progress
          </p>
          <p className="text-2xl font-bold tracking-tight text-amber-400 mt-1">{inProgressCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Active development/review</p>
        </Card>

        <Card className="p-3.5 border-border/80 bg-card">
          <p className="text-[11px] font-medium text-red-400 uppercase tracking-wider">
            Critical
          </p>
          <p className="text-2xl font-bold tracking-tight text-red-400 mt-1">{criticalCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Requiring immediate fix</p>
        </Card>

        <Card className="col-span-2 lg:col-span-1 p-3.5 border-border/80 bg-card">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
              Resolution Rate
            </p>
            <span className="text-[11px] font-bold text-emerald-400">{completionRate}%</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground mt-1">{resolvedCount} / {total}</p>
          <div className="w-full h-1.5 bg-muted/60 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Analytics Visual Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution Chart */}
        <Card className="border-border/80 bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[13px] font-semibold text-foreground">
              Issues by Workflow Status
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Current breakdown of issues across pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ChartContainer config={statusChartConfig} className="h-[180px] w-full">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {statusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Severity Breakdown */}
        <Card className="border-border/80 bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[13px] font-semibold text-foreground">
              Severity Breakdown
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Impact and risk classification of reported issues
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ChartContainer config={severityChartConfig} className="h-[180px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={severityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {severityData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Grid: High Priority Issues & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Urgent & High Priority Issues */}
        <Card className="border-border/80 bg-card flex flex-col">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between shrink-0">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-foreground font-semibold text-[13px]">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span>Urgent & High Priority Issues</span>
              </div>
              <CardDescription className="text-[11px] text-muted-foreground">
                Items requiring immediate focus
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChangeView('issues')}
              className="gap-1 text-[11px] h-7 text-muted-foreground hover:text-foreground"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 pt-2 flex-1 flex flex-col">
            {highPriorityIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center m-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-400/80 mb-2" />
                <p className="text-[12.5px] font-medium text-foreground">All Clear!</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  No open urgent or high priority issues found.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {highPriorityIssues.slice(0, 5).map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className="p-2.5 rounded-md border border-border/70 bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-primary font-medium">
                        {getIssueDisplayIdentifier(issue.identifier, project.key)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <SeverityBadge severity={issue.severity} showLabel={false} />
                        <PriorityBadge priority={issue.priority} />
                      </div>
                    </div>
                    <p className="text-[12.5px] font-medium text-foreground line-clamp-1">
                      {issue.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Stream */}
        <Card className="border-border/80 bg-card flex flex-col">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between shrink-0">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-foreground font-semibold text-[13px]">
                <ActivityIcon className="h-4 w-4 text-sky-400" />
                <span>Recent Activity</span>
              </div>
              <CardDescription className="text-[11px] text-muted-foreground">
                Audit events and actions across the project
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2 flex-1 flex flex-col">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center m-auto">
                <Clock className="h-7 w-7 text-muted-foreground/50 mb-2" />
                <p className="text-[12px] text-muted-foreground">No recent activity events recorded.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activities.slice(0, 5).map((act) => {
                  const actorName = act.actor?.display_name || act.actor?.username || 'Team Member'
                  const initials = actorName.substring(0, 2).toUpperCase()
                  return (
                    <div
                      key={act.id}
                      className="flex items-start gap-2.5 pb-2.5 border-b border-border/50 last:border-0 last:pb-0"
                    >
                      <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                        {act.actor?.avatar_url && <AvatarImage src={act.actor.avatar_url} alt={actorName} />}
                        <AvatarFallback className="bg-primary/20 text-primary text-[9px] font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 text-[12px]">
                        <p className="text-foreground leading-snug">
                          <span className="font-semibold">{actorName}</span>{' '}
                          <span className="text-muted-foreground">
                            {(act.action || (act as any).action_type || 'updated').toLowerCase().replace('_', ' ')}
                          </span>
                          {act.new_value && (
                            <span className="font-mono text-primary ml-1 font-medium">"{act.new_value}"</span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatRelativeTime(act.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Milestones Progress Strip */}
      {milestones.length > 0 && (
        <Card className="border-border/80 bg-card">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-foreground font-semibold text-[13px]">
                <Target className="h-4 w-4 text-purple-400" />
                <span>Project Milestones</span>
              </div>
              <CardDescription className="text-[11px] text-muted-foreground">
                Progress towards active sprint and release targets
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChangeView('milestones')}
              className="gap-1 text-[11px] h-7 text-muted-foreground hover:text-foreground"
            >
              <span>Manage</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {milestones.slice(0, 3).map((m) => {
                const totalIssues = m.total_issues || 0
                const closedIssues = m.closed_issues || 0
                const progressPct = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : (m.status === 'COMPLETED' ? 100 : 0)
                return (
                  <div key={m.id} className="p-3 rounded-md border border-border/70 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-semibold text-foreground truncate">{m.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{closedIssues}/{totalIssues} done</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
