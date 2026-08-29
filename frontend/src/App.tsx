import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Project, Issue, Label, ProjectMember, Activity, Milestone, IssueStatus } from './types'
import { api } from './api/client'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { AuthModal } from './components/AuthModal'
import { ProjectOverview } from './components/ProjectOverview'
import { IssueList } from './components/IssueList'
import { KanbanBoard } from './components/KanbanBoard'
import { AnalyticsView } from './components/AnalyticsView'
import { MilestonesView } from './components/MilestonesView'
import { ProjectSettingsView } from './components/ProjectSettingsView'
import { CreateIssueModal } from './components/CreateIssueModal'
import { CreateProjectModal } from './components/CreateProjectModal'
import { IssueDetailModal } from './components/IssueDetailModal'
import { CommandPalette } from './components/CommandPalette'
import { NotificationsDrawer } from './components/NotificationsDrawer'
import { FolderPlus, PlusCircle } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import './styles.css'

function BugzillaApp() {
  const { user, isLoading: authLoading } = useAuth()

  // Project state
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [loadingProjects, setLoadingProjects] = useState(false)

  // Project resource state
  const [issues, setIssues] = useState<Issue[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loadingIssues, setLoadingIssues] = useState(false)

  // View state
  const [activeView, setActiveView] = useState<
    'overview' | 'issues' | 'board' | 'milestones' | 'analytics' | 'settings'
  >('overview')
  const [filters, setFilters] = useState<Record<string, string | undefined>>({})

  // Modals state
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Global Keyboard Shortcuts (Cmd+K and C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      } else if (e.key.toLowerCase() === 'c' && !isInput && !e.metaKey && !e.ctrlKey && currentProject) {
        e.preventDefault()
        setIsCreateIssueOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentProject])

  // Load Projects on Auth
  useEffect(() => {
    if (!user) return

    async function loadProjects() {
      setLoadingProjects(true)
      try {
        const res = await api.projects.list()
        setProjects(res.projects)
        if (res.projects.length > 0 && !currentProject) {
          setCurrentProject(res.projects[0])
        }
      } catch (err) {
        console.error('Failed to load projects:', err)
      } finally {
        setLoadingProjects(false)
      }
    }

    loadProjects()
  }, [user])

  // Load Issues, Labels, Members, Activities when Current Project changes
  useEffect(() => {
    if (!currentProject) {
      setIssues([])
      setLabels([])
      setMembers([])
      setActivities([])
      return
    }

    loadProjectData(currentProject.id, filters)
  }, [currentProject?.id, filters])

  const loadProjectData = async (projectId: number, activeFilters: Record<string, string | undefined>) => {
    setLoadingIssues(true)
    try {
      const [issuesRes, labelsRes, membersRes, activitiesRes] = await Promise.all([
        api.issues.list(projectId, activeFilters),
        api.labels.list(projectId),
        api.projects.getMembers(projectId),
        api.activities.listProject(projectId).catch(() => ({ activities: [] })),
      ])
      setIssues(issuesRes.issues)
      setLabels(labelsRes.labels)
      setMembers(membersRes.members)
      setActivities(activitiesRes.activities)
    } catch (err) {
      console.error('Failed to fetch project data:', err)
    } finally {
      setLoadingIssues(false)
    }
  }

  // Refresh handlers
  const handleRefreshMembers = async () => {
    if (!currentProject) return
    try {
      const res = await api.projects.getMembers(currentProject.id)
      setMembers(res.members)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRefreshLabels = async () => {
    if (!currentProject) return
    try {
      const res = await api.labels.list(currentProject.id)
      setLabels(res.labels)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRefreshActivities = async () => {
    if (!currentProject) return
    try {
      const res = await api.activities.listProject(currentProject.id)
      setActivities(res.activities)
    } catch (err) {
      console.error(err)
    }
  }

  // Kanban Status Update with Optimistic UI & Revert
  const handleStatusUpdate = async (issue: Issue, newStatus: IssueStatus) => {
    if (!currentProject) return
    const prevStatus = issue.status
    // Optimistic UI update
    setIssues((prev) => prev.map((i) => (i.id === issue.id ? { ...i, status: newStatus } : i)))

    try {
      const res = await api.issues.update(currentProject.id, issue.id, { status: newStatus })
      setIssues((prev) => prev.map((i) => (i.id === issue.id ? res.issue : i)))
      toast.success(`Issue ${issue.identifier} moved to ${newStatus.replace('_', ' ')}`)
      handleRefreshActivities()
    } catch (err: any) {
      // Revert optimistic UI
      setIssues((prev) => prev.map((i) => (i.id === issue.id ? { ...i, status: prevStatus } : i)))
      toast.error(err.message || 'Failed to update issue status')
    }
  }

  const handleIssueCreated = (newIssue: Issue) => {
    setIssues([newIssue, ...issues])
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        issue_count: (currentProject.issue_count || 0) + 1,
      })
    }
    handleRefreshActivities()
  }

  const handleIssueUpdated = (updated: Issue) => {
    setIssues(issues.map((i) => (i.id === updated.id ? updated : i)))
    setSelectedIssue(updated)
    handleRefreshActivities()
  }

  const handleIssueDeleted = (issueId: number) => {
    setIssues(issues.filter((i) => i.id !== issueId))
    setSelectedIssue(null)
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        issue_count: Math.max(0, (currentProject.issue_count || 1) - 1),
      })
    }
    handleRefreshActivities()
  }

  const handleProjectCreated = (newProj: Project) => {
    setProjects([...projects, newProj])
    setCurrentProject(newProj)
    setActiveView('overview')
  }

  const handleProjectUpdated = (updatedProj: Project) => {
    setProjects(projects.map((p) => (p.id === updatedProj.id ? updatedProj : p)))
    setCurrentProject(updatedProj)
  }

  const handleProjectDeleted = () => {
    if (!currentProject) return
    const remaining = projects.filter((p) => p.id !== currentProject.id)
    setProjects(remaining)
    setCurrentProject(remaining.length > 0 ? remaining[0] : null)
    setActiveView('overview')
  }

  const handleAddMilestone = (newMilestone: Milestone) => {
    setMilestones([...milestones, newMilestone])
  }

  const handleDeleteMilestone = (milestoneId: string) => {
    setMilestones(milestones.filter((m) => m.id !== milestoneId))
    toast.success('Milestone deleted')
  }

  if (authLoading) {
    return (
      <div className="modal-overlay">
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
          Initializing Bugzilla...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <AuthModal />
        <Toaster theme="dark" position="bottom-right" richColors />
      </>
    )
  }

  return (
    <div className="app-container">
      <Sidebar
        projects={projects}
        currentProject={currentProject}
        onSelectProject={(proj) => setCurrentProject(proj)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        activeView={activeView}
        onChangeView={(view) => setActiveView(view)}
        issueCount={issues.length}
        memberCount={members.length}
        labelCount={labels.length}
      />

      <main className="app-main">
        <Header
          currentProject={currentProject}
          onOpenCreateIssue={() => setIsCreateIssueOpen(true)}
          activeView={activeView}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={activities.length > 0 ? Math.min(activities.length, 5) : 0}
        />

        <div className="view-content">
          {!currentProject ? (
            <div className="card empty-state py-12">
              <FolderPlus size={44} className="text-muted mb-3" />
              <div className="empty-state-title">No Project Selected</div>
              <p className="empty-state-desc">Create your first project to start tracking issues.</p>
              <button className="btn btn-primary" onClick={() => setIsCreateProjectOpen(true)}>
                <PlusCircle size={15} />
                <span>Create New Project</span>
              </button>
            </div>
          ) : (
            <>
              {activeView === 'overview' && (
                <ProjectOverview
                  project={currentProject}
                  issues={issues}
                  activities={activities}
                  milestones={milestones}
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  onChangeView={(view) => setActiveView(view)}
                  onOpenCreateIssue={() => setIsCreateIssueOpen(true)}
                />
              )}

              {activeView === 'issues' && (
                <IssueList
                  issues={issues}
                  labels={labels}
                  members={members}
                  currentUserId={user.id}
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  onFilterChange={(newFilters) => setFilters(newFilters)}
                  onOpenCreateIssue={() => setIsCreateIssueOpen(true)}
                  loading={loadingIssues}
                />
              )}

              {activeView === 'board' && (
                <KanbanBoard
                  issues={issues}
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  onUpdateStatus={handleStatusUpdate}
                  onOpenCreateIssue={() => setIsCreateIssueOpen(true)}
                />
              )}

              {activeView === 'milestones' && (
                <MilestonesView
                  projectId={currentProject.id}
                  milestones={milestones}
                  issues={issues}
                  onAddMilestone={handleAddMilestone}
                  onDeleteMilestone={handleDeleteMilestone}
                />
              )}

              {activeView === 'analytics' && (
                <AnalyticsView projectId={currentProject.id} issues={issues} />
              )}

              {activeView === 'settings' && (
                <ProjectSettingsView
                  project={currentProject}
                  members={members}
                  labels={labels}
                  milestones={milestones}
                  onProjectUpdated={handleProjectUpdated}
                  onMembersUpdated={handleRefreshMembers}
                  onLabelsUpdated={handleRefreshLabels}
                  onProjectDeleted={handleProjectDeleted}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Global Modals & Drawers */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        projects={projects}
        currentProject={currentProject}
        issues={issues}
        members={members}
        onSelectProject={(proj) => setCurrentProject(proj)}
        onSelectIssue={(issue) => setSelectedIssue(issue)}
        onChangeView={(view) => setActiveView(view)}
        onOpenCreateIssue={() => setIsCreateIssueOpen(true)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        activities={activities}
        issues={issues}
        onSelectIssue={(issue) => setSelectedIssue(issue)}
      />

      {isCreateProjectOpen && (
        <CreateProjectModal
          onClose={() => setIsCreateProjectOpen(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}

      {isCreateIssueOpen && currentProject && (
        <CreateIssueModal
          projectId={currentProject.id}
          labels={labels}
          members={members}
          onClose={() => setIsCreateIssueOpen(false)}
          onIssueCreated={handleIssueCreated}
        />
      )}

      {selectedIssue && currentProject && (
        <IssueDetailModal
          issue={selectedIssue}
          projectId={currentProject.id}
          labels={labels}
          members={members}
          allIssues={issues}
          onClose={() => setSelectedIssue(null)}
          onIssueUpdated={handleIssueUpdated}
          onIssueDeleted={handleIssueDeleted}
        />
      )}

      {/* Global Toasts */}
      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BugzillaApp />
    </AuthProvider>
  )
}
