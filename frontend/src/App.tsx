import { useMemo, useState } from 'react'
import {
  BarChart3,
  Bell,
  CircleDot,
  Filter,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Menu,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react'

type Status = 'Open' | 'In Progress' | 'In Review' | 'Resolved'

type Issue = {
  id: string
  title: string
  status: Status
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  assignee: string
  labels: string[]
}

const initialIssues: Issue[] = [
  {
    id: 'BUG-142',
    title: 'Login fails after password reset',
    status: 'In Progress',
    priority: 'Critical',
    assignee: 'Aditya',
    labels: ['auth', 'backend'],
  },
  {
    id: 'BUG-139',
    title: 'Dashboard takes too long to load',
    status: 'Open',
    priority: 'High',
    assignee: 'Rahul',
    labels: ['performance'],
  },
  {
    id: 'BUG-137',
    title: 'Comment editor loses focus',
    status: 'In Review',
    priority: 'Medium',
    assignee: 'Priya',
    labels: ['frontend', 'ux'],
  },
  {
    id: 'BUG-131',
    title: 'CSV import rejects empty optional fields',
    status: 'Resolved',
    priority: 'Low',
    assignee: 'Arjun',
    labels: ['import'],
  },
]

const nav = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Issues', icon: ListTodo },
  { label: 'Board', icon: FolderKanban },
  { label: 'Analytics', icon: BarChart3 },
]

export default function App() {
  const [issues, setIssues] = useState(initialIssues)
  const [active, setActive] = useState('Overview')
  const [query, setQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  const filteredIssues = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return issues
    return issues.filter((issue) =>
      `${issue.id} ${issue.title} ${issue.priority} ${issue.assignee} ${issue.labels.join(' ')}`
        .toLowerCase()
        .includes(q),
    )
  }, [issues, query])

  const counts = useMemo(
    () => ({
      total: issues.length,
      critical: issues.filter((x) => x.priority === 'Critical').length,
      active: issues.filter((x) => x.status === 'In Progress').length,
      resolved: issues.filter((x) => x.status === 'Resolved').length,
    }),
    [issues],
  )

  function createIssue(title: string) {
    const next = issues.length + 143
    setIssues([
      {
        id: `BUG-${next}`,
        title,
        status: 'Open',
        priority: 'Medium',
        assignee: 'Unassigned',
        labels: ['bug'],
      },
      ...issues,
    ])
    setShowModal(false)
    setActive('Issues')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark">B</div>
          <div>
            <div className="brand-name">Bugzilla</div>
            <div className="brand-subtitle">Developer workspace</div>
          </div>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <div className="workspace-card">
          <div className="workspace-icon">E</div>
          <div className="workspace-copy">
            <strong>Ember</strong>
            <span>Core workspace</span>
          </div>
          <span className="status-dot" />
        </div>

        <nav className="nav-list">
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${active === label ? 'active' : ''}`}
              onClick={() => {
                setActive(label)
                setMobileNav(false)
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="nav-section-label">Workspace</div>
        <button className="nav-item"><CircleDot size={17} /><span>My issues</span></button>
        <button className="nav-item"><Users size={17} /><span>Team</span></button>

        <div className="sidebar-footer">
          <button className="nav-item"><Settings size={17} /><span>Settings</span></button>
          <div className="profile-chip">
            <div className="avatar">A</div>
            <div className="profile-copy">
              <strong>Aditya</strong>
              <span>Admin</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span><span>/</span><strong>{active}</strong>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search issues..." />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button"><Bell size={17} /></button>
            <button className="avatar small">A</button>
          </div>
        </header>

        <section className="page-content">
          <div className="hero-row">
            <div>
              <div className="eyebrow">EMBER / CORE</div>
              <h1>{active}</h1>
              <p>{active === 'Overview' ? 'See what needs attention across your projects.' : 'Track software issues through a clear, collaborative workflow.'}</p>
            </div>
            <button className="primary-button" onClick={() => setShowModal(true)}><Plus size={17} /> New issue</button>
          </div>

          {active === 'Overview' && (
            <>
              <div className="stats-grid">
                <Stat label="Total issues" value={counts.total} detail="Across this workspace" />
                <Stat label="Critical" value={counts.critical} detail="Needs immediate attention" />
                <Stat label="In progress" value={counts.active} detail="Currently being worked on" />
                <Stat label="Resolved" value={counts.resolved} detail="Recently completed" />
              </div>

              <div className="content-grid">
                <section className="panel issues-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Recent issues</h2>
                      <span>{filteredIssues.length} visible</span>
                    </div>
                    <button className="ghost-button" onClick={() => setActive('Issues')}>View all</button>
                  </div>
                  <div className="issue-list">
                    {filteredIssues.slice(0, 5).map((issue) => <IssueRow key={issue.id} issue={issue} />)}
                  </div>
                </section>

                <section className="panel activity-panel">
                  <div className="panel-header">
                    <div><h2>Activity</h2><span>Latest workspace changes</span></div>
                  </div>
                  <div className="activity-list">
                    <Activity text="Aditya assigned BUG-142 to Rahul" time="12 min ago" />
                    <Activity text="Priya commented on BUG-137" time="28 min ago" />
                    <Activity text="BUG-131 was marked resolved" time="1 h ago" />
                    <Activity text="New project member added" time="3 h ago" />
                  </div>
                </section>
              </div>
            </>
          )}

          {active === 'Issues' && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div><h2>Issues</h2><span>{filteredIssues.length} results</span></div>
                <div className="filter-actions"><button className="ghost-button"><Filter size={15} /> Filter</button><button className="ghost-button">Sort</button></div>
              </div>
              <div className="issue-table">
                <div className="table-head"><span>ID</span><span>Issue</span><span>Status</span><span>Priority</span><span>Assignee</span></div>
                {filteredIssues.map((issue) => (
                  <div className="table-row" key={issue.id}>
                    <span className="issue-id">{issue.id}</span>
                    <div><strong>{issue.title}</strong><div className="labels">{issue.labels.map((label) => <span key={label}>{label}</span>)}</div></div>
                    <StatusPill status={issue.status} />
                    <PriorityPill priority={issue.priority} />
                    <span>{issue.assignee}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === 'Board' && <Board issues={issues} setIssues={setIssues} />}

          {active === 'Analytics' && (
            <div className="analytics-grid">
              <section className="panel chart-card">
                <div className="panel-header"><div><h2>Issues by status</h2><span>Current distribution</span></div></div>
                <div className="bars">
                  {(['Open', 'In Progress', 'In Review', 'Resolved'] as Status[]).map((status) => {
                    const count = issues.filter((x) => x.status === status).length
                    return <div className="bar-row" key={status}><span>{status}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(14, (count / Math.max(issues.length, 1)) * 100)}%` }} /></div><strong>{count}</strong></div>
                  })}
                </div>
              </section>
              <section className="panel insight-card">
                <div className="panel-header"><div><h2>Health snapshot</h2><span>Simple signals for triage</span></div></div>
                <div className="health-stat"><strong>72%</strong><span>of active issues are assigned</span></div>
                <div className="health-stat"><strong>4</strong><span>issues need review</span></div>
                <div className="health-stat"><strong>1.8d</strong><span>average time to resolution</span></div>
              </section>
            </div>
          )}
        </section>
      </main>

      {showModal && <CreateIssueModal onClose={() => setShowModal(false)} onCreate={createIssue} />}
    </div>
  )
}

function Stat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="stat-card"><span className="stat-label">{label}</span><strong>{value}</strong><span className="stat-detail">{detail}</span></div>
}

function IssueRow({ issue }: { issue: Issue }) {
  return <div className="issue-row"><div className="issue-main"><span className="issue-id">{issue.id}</span><strong>{issue.title}</strong><div className="labels">{issue.labels.map((label) => <span key={label}>{label}</span>)}</div></div><StatusPill status={issue.status} /><PriorityPill priority={issue.priority} /></div>
}

function Activity({ text, time }: { text: string; time: string }) {
  return <div className="activity-item"><div className="activity-dot" /><div><strong>{text}</strong><span>{time}</span></div></div>
}

function StatusPill({ status }: { status: Status }) {
  return <span className={`pill status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>
}

function PriorityPill({ priority }: { priority: Issue['priority'] }) {
  return <span className={`pill priority-${priority.toLowerCase()}`}>{priority}</span>
}

function Board({ issues, setIssues }: { issues: Issue[]; setIssues: React.Dispatch<React.SetStateAction<Issue[]>> }) {
  const columns: Status[] = ['Open', 'In Progress', 'In Review', 'Resolved']
  return <div className="board-grid">{columns.map((status) => <div className="board-column" key={status}><div className="board-column-head"><div><strong>{status}</strong><span>{issues.filter((x) => x.status === status).length}</span></div><button className="icon-button"><Plus size={15} /></button></div>{issues.filter((x) => x.status === status).map((issue) => <div className="board-card" key={issue.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', issue.id)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData('text/plain'); setIssues((all) => all.map((x) => x.id === id ? { ...x, status } : x)) }}><span className="issue-id">{issue.id}</span><strong>{issue.title}</strong><div className="board-card-footer"><PriorityPill priority={issue.priority} /><span>{issue.assignee}</span></div></div>)}</div>)}</div>
}

function CreateIssueModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string) => void }) {
  const [title, setTitle] = useState('')
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">NEW ISSUE</div><h2>Create issue</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><label className="form-label">Title<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Describe the issue clearly" /></label><div className="modal-actions"><button className="ghost-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!title.trim()} onClick={() => onCreate(title.trim())}>Create issue</button></div></div></div>
}
