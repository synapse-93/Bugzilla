import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Project, Issue, Label, ProjectMember, Activity, Milestone, IssueStatus } from './types'
import { api } from './api/client'
import { Header } from './components/Header'
import { Sidebar, SidebarContent, ActiveView } from './components/Sidebar'
import { AuthModal } from './components/AuthModal'
import { ProjectOverview } from './components/ProjectOverview'
import { IssueList } from './components/IssueList'
import { KanbanBoard } from './components/KanbanBoard'
import { AnalyticsView } from './components/AnalyticsView'
import { MilestonesView } from './components/MilestonesView'
import { ProjectSettingsView } from './components/ProjectSettingsView'
import { CollaboratorDiscoveryView } from './components/CollaboratorDiscoveryView'
import { ProfileView } from './components/ProfileView'
import { InvitationsModal } from './components/InvitationsModal'
import { CreateIssueModal } from './components/CreateIssueModal'
import { CreateProjectModal } from './components/CreateProjectModal'
import { IssueDetailModal } from './components/IssueDetailModal'
import { CommandPalette } from './components/CommandPalette'
import { NotificationsDrawer } from './components/NotificationsDrawer'
import { StackedLogo } from './components/StackedLogo'
import { Sheet, SheetContent } from './components/ui/sheet'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { FolderPlus, PlusCircle, Loader2 } from 'lucide-react'
import { Toaster, toast } from 'sonner'

function KaizenApp() {
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
  const [activeView, setActiveView] = useState<ActiveView>('overview')
  const [filters, setFilters] = useState<Record<string, string | undefined>>({})

  // Modals & Navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isInvitationsOpen, setIsInvitationsOpen] = useState(false)
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0)

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K and C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      } else if (e.key === '/' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      } else if (e.key.toLowerCase() === 'c' && !isInput && !e.metaKey && !e.ctrlKey && currentProject) {
        e.preventDefault()
        setIsCreateIssueOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentProject])

  // Load Projects & Pending Invitations on Auth
  useEffect(() => {
    if (!user) return

    async function loadInitialData() {
      setLoadingProjects(true)
      try {
        const [projRes, invRes] = await Promise.all([
          api.projects.list(),
          api.invitations.myInvitations().catch(() => ({ invitations: [] })),
        ])
        setProjects(projRes.projects)
        setPendingInvitationsCount(invRes.invitations.length)
        if (projRes.projects.length > 0 && !currentProject) {
          setCurrentProject(projRes.projects[0])
        }
      } catch (err) {
        console.error('Failed to load initial data:', err)
      } finally {
        setLoadingProjects(false)
      }
    }

    loadInitialData()
  }, [user])

  // Load Issues, Labels, Members, Activities, Milestones when Current Project changes
  useEffect(() => {
    if (!currentProject) {
      setIssues([])
      setLabels([])
      setMembers([])
      setActivities([])
      setMilestones([])
      return
    }

    loadProjectData(currentProject.id, filters)
  }, [currentProject?.id, filters])

  const loadProjectData = async (projectId: number, activeFilters: Record<string, string | undefined>) => {
    setLoadingIssues(true)
    try {
      const [issuesRes, labelsRes, membersRes, activitiesRes, milestonesRes] = await Promise.all([
        api.issues.list(projectId, activeFilters),
        api.labels.list(projectId),
        api.projects.getMembers(projectId),
        api.activities.listProject(projectId).catch(() => ({ activities: [] })),
        api.milestones.list(projectId).catch(() => ({ milestones: [] })),
      ])
      setIssues(issuesRes.issues)
      setLabels(labelsRes.labels)
      setMembers(membersRes.members)
      setActivities(activitiesRes.activities)
      setMilestones(milestonesRes.milestones)
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

  const handleRefreshMilestones = async () => {
    if (!currentProject) return
    try {
      const res = await api.milestones.list(currentProject.id)
      setMilestones(res.milestones)
    } catch (err) {
      console.error(err)
    }
  }

  // Kanban Status Update with Optimistic UI & Revert
  const handleStatusUpdate = async (issue: Issue, newStatus: IssueStatus) => {
    if (!currentProject) return
    const prevStatus = issue.status
    setIssues((prev) => prev.map((i) => (i.id === issue.id ? { ...i, status: newStatus } : i)))

    try {
      const res = await api.issues.update(currentProject.id, issue.id, { status: newStatus })
      setIssues((prev) => prev.map((i) => (i.id === issue.id ? res.issue : i)))
      toast.success(`Issue ${issue.identifier} moved to ${newStatus.replace('_', ' ')}`)
      handleRefreshActivities()
    } catch (err: any) {
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

  const handleDeleteMilestone = (milestoneId: number | string) => {
    setMilestones(milestones.filter((m) => String(m.id) !== String(milestoneId)))
  }

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/20 text-primary animate-pulse">
          <StackedLogo size={22} color="currentColor" />
        </div>
        <p className="text-[13px] font-semibold text-foreground tracking-tight">KAIZEN</p>
        <p className="text-[11px] text-muted-foreground">Initializing workspace...</p>
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
    <div className="flex min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Desktop Persistent Sidebar */}
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
        pendingInvitationsCount={pendingInvitationsCount}
        onOpenInvitations={() => setIsInvitationsOpen(true)}
      />

      {/* Mobile Drawer Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r border-sidebar-border bg-sidebar">
          <SidebarContent
            projects={projects}
            currentProject={currentProject}
            onSelectProject={(proj) => {
              setCurrentProject(proj)
              setIsMobileMenuOpen(false)
            }}
            onOpenCreateProject={() => {
              setIsMobileMenuOpen(false)
              setIsCreateProjectOpen(true)
            }}
            activeView={activeView}
            onChangeView={(view) => {
              setActiveView(view)
              setIsMobileMenuOpen(false)
            }}
            issueCount={issues.length}
            memberCount={members.length}
            labelCount={labels.length}
            pendingInvitationsCount={pendingInvitationsCount}
            onOpenInvitations={() => {
              setIsMobileMenuOpen(false)
              setIsInvitationsOpen(true)
            }}
            onNavigateMobile={() => setIsMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          currentProject={currentProject}
          activeView={activeView}
          onOpenCreateIssue={() => setIsCreateIssueOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          unreadNotificationsCount={pendingInvitationsCount > 0 ? pendingInvitationsCount : 0}
        />

        <main className="flex-1 overflow-y-auto p-3.5 md:p-6 lg:p-8">
          {activeView === 'collaborators' ? (
            <CollaboratorDiscoveryView currentProject={currentProject} projects={projects} />
          ) : activeView === 'profile' ? (
            <ProfileView />
          ) : !currentProject ? (
            <Card className="p-12 text-center border-dashed max-w-lg mx-auto my-12">
              <FolderPlus className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">No Project Selected</h3>
              <p className="text-[12.5px] text-muted-foreground mt-1 mb-5">
                Create a new project workspace to start tracking bugs, features, and milestones.
              </p>
              <Button onClick={() => setIsCreateProjectOpen(true)} className="gap-1.5 text-[12.5px]">
                <PlusCircle className="h-4 w-4" />
                <span>Create New Project</span>
              </Button>
            </Card>
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
        </main>
      </div>

      {/* Command Palette */}
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
        onOpenInvitations={() => setIsInvitationsOpen(true)}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        activities={activities}
        issues={issues}
        onSelectIssue={(issue) => setSelectedIssue(issue)}
        onOpenInvitations={() => setIsInvitationsOpen(true)}
      />

      {/* Invitations Modal */}
      <InvitationsModal
        isOpen={isInvitationsOpen}
        onClose={() => setIsInvitationsOpen(false)}
        onAccepted={(proj) => {
          setProjects((prev) => [...prev.filter((p) => p.id !== proj.id), proj])
          setCurrentProject(proj)
          setPendingInvitationsCount((prev) => Math.max(0, prev - 1))
        }}
      />

      {/* Create Project Modal */}
      {isCreateProjectOpen && (
        <CreateProjectModal
          onClose={() => setIsCreateProjectOpen(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}

      {/* Create Issue Modal */}
      {isCreateIssueOpen && currentProject && (
        <CreateIssueModal
          projectId={currentProject.id}
          labels={labels}
          members={members}
          onClose={() => setIsCreateIssueOpen(false)}
          onIssueCreated={handleIssueCreated}
        />
      )}

      {/* Issue Detail Modal */}
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

      {/* Global Toast Notifications */}
      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <KaizenApp />
    </AuthProvider>
  )
}
