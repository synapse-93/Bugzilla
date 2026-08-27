import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Project, Issue, Label, ProjectMember, IssueStatus } from './types'
import { api } from './api/client'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { AuthModal } from './components/AuthModal'
import { IssueList } from './components/IssueList'
import { KanbanBoard } from './components/KanbanBoard'
import { AnalyticsView } from './components/AnalyticsView'
import { ProjectSettingsView } from './components/ProjectSettingsView'
import { CreateIssueModal } from './components/CreateIssueModal'
import { CreateProjectModal } from './components/CreateProjectModal'
import { IssueDetailModal } from './components/IssueDetailModal'
import { FolderPlus, Layers, PlusCircle } from 'lucide-react'
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
  const [loadingIssues, setLoadingIssues] = useState(false)

  // View state
  const [activeView, setActiveView] = useState<'issues' | 'board' | 'analytics' | 'settings'>('issues')
  const [filters, setFilters] = useState<Record<string, string | undefined>>({})

  // Modals state
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

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

  // Load Issues, Labels, Members when Current Project changes
  useEffect(() => {
    if (!currentProject) {
      setIssues([])
      setLabels([])
      setMembers([])
      return
    }

    loadProjectData(currentProject.id, filters)
  }, [currentProject?.id, filters])

  const loadProjectData = async (projectId: number, activeFilters: Record<string, string | undefined>) => {
    setLoadingIssues(true)
    try {
      const [issuesRes, labelsRes, membersRes] = await Promise.all([
        api.issues.list(projectId, activeFilters),
        api.labels.list(projectId),
        api.projects.getMembers(projectId),
      ])
      setIssues(issuesRes.issues)
      setLabels(labelsRes.labels)
      setMembers(membersRes.members)
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

  const handleStatusUpdate = async (issue: Issue, newStatus: IssueStatus) => {
    if (!currentProject) return
    try {
      const res = await api.issues.update(currentProject.id, issue.id, { status: newStatus })
      setIssues(issues.map((i) => (i.id === issue.id ? res.issue : i)))
    } catch (err) {
      console.error('Failed to update issue status:', err)
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
  }

  const handleIssueUpdated = (updated: Issue) => {
    setIssues(issues.map((i) => (i.id === updated.id ? updated : i)))
    setSelectedIssue(updated)
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
  }

  const handleProjectCreated = (newProj: Project) => {
    setProjects([...projects, newProj])
    setCurrentProject(newProj)
    setActiveView('issues')
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
    setActiveView('issues')
  }

  if (authLoading) {
    return (
      <div className="auth-overlay">
        <div className="loading-box">Initializing Bugzilla...</div>
      </div>
    )
  }

  if (!user) {
    return <AuthModal />
  }

  return (
    <div className="app-container">
      <Sidebar
        projects={projects}
        currentProject={currentProject}
        onSelectProject={(proj) => setCurrentProject(proj)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        activeView={activeView}
        onChangeView={(view) => setActiveView(view as any)}
      />

      <main className="app-main">
        <Header
          currentProject={currentProject}
          onOpenCreateIssue={() => setIsCreateIssueOpen(true)}
          activeView={activeView}
        />

        <div className="view-content">
          {!currentProject ? (
            <div className="empty-box py-8">
              <FolderPlus size={40} className="text-muted" />
              <h3>No Project Selected</h3>
              <p className="mb-4">Create your first project to start tracking issues.</p>
              <button
                className="btn-primary"
                onClick={() => setIsCreateProjectOpen(true)}
              >
                <PlusCircle size={16} />
                <span>Create New Project</span>
              </button>
            </div>
          ) : (
            <>
              {activeView === 'issues' && (
                <IssueList
                  issues={issues}
                  labels={labels}
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  onFilterChange={(newFilters) => setFilters(newFilters)}
                  loading={loadingIssues}
                />
              )}

              {activeView === 'board' && (
                <KanbanBoard
                  issues={issues}
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  onUpdateStatus={handleStatusUpdate}
                />
              )}

              {activeView === 'analytics' && (
                <AnalyticsView projectId={currentProject.id} />
              )}

              {activeView === 'settings' && (
                <ProjectSettingsView
                  project={currentProject}
                  members={members}
                  labels={labels}
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

      {/* Modals */}
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
          onClose={() => setSelectedIssue(null)}
          onIssueUpdated={handleIssueUpdated}
          onIssueDeleted={handleIssueDeleted}
        />
      )}
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
