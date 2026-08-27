# BUGZILLA — Master Project Context

> This file is the persistent technical context for the project. AI coding agents MUST read it completely before making changes and MUST update it after every meaningful implementation change.

## 1. Project

- Working name: **Bugzilla**
- Competition: CloneFest Mission 2 — Developer Tool Reconstruction (Bugzilla)
- Submission deadline: **30 August 2026, 23:59**
- Goal: build an original modern developer issue-tracking platform inspired by the underlying problem solved by Bugzilla. Do not reproduce Bugzilla's existing UI/UX or implementation.

Competition priorities:

1. Real working functionality
2. Strong judge-facing UX
3. Reliable deployment
4. Coherent architecture
5. Meaningful innovation
6. Polish

This is a competition build. Avoid unnecessary enterprise complexity and abstractions that do not improve the submission.

## 2. Current State

### Deployment foundation

**VERIFIED WORKING** — minimal React/Vite frontend deployed on Vercel.

The deployment foundation must be preserved while new phases are added.

### Backend

Not started.

### Database

Not started.

### Authentication

Not started.

### Product features

Not started.

## 3. Required Development Workflow

The project is primarily implemented by AI coding agents.

For every phase:

1. Read this file completely.
2. Follow the architecture, package and logic decisions documented here.
3. Implement the current task.
4. Test the implementation.
5. Commit the work.
6. Update this file so it accurately reflects the repository after the change.
7. Deployment is performed and verified before the phase is considered complete.

Do not claim a feature is complete because a UI exists or the code compiles. Verify the actual behaviour.

## 4. Architecture

Target system:

```text
Browser
   |
   v
React + Vite frontend
   |
   | HTTPS JSON REST API
   v
Flask backend
   |
   v
SQLAlchemy
   |
   v
PostgreSQL
```

The frontend and backend are independently deployable.

The first backend milestone is deliberately small: a Flask service with `GET /health`. Do not add database/auth/product functionality during the backend-foundation phase unless required by a later explicitly requested phase.

## 5. Frontend Stack

Approved packages:

- `react` — UI
- `react-dom` — React rendering
- `vite` — development server and production build
- `typescript` — static typing
- `lucide-react` — icons

Planned packages, to be added only when their phase requires them:

- `react-router-dom` — client-side routing for real multi-page application flow
- `axios` — only if the API layer genuinely needs it; native `fetch` is preferred otherwise

Do not introduce multiple libraries for the same responsibility. Do not add state-management libraries without a concrete need.

## 6. Backend Stack

Approved backend stack:

- Python 3.11+
- `Flask` — HTTP API
- `Flask-CORS` — frontend/backend cross-origin communication
- `SQLAlchemy` — ORM/database access
- `psycopg` — PostgreSQL driver
- `Flask-JWT-Extended` — authentication
- `bcrypt` — password hashing

Do not switch to FastAPI/Django/GraphQL/MongoDB/etc. without an explicit architecture decision.

## 7. Database Architecture

Target database: PostgreSQL.

Core entities:

```text
User
Project
ProjectMember
Issue
Label
IssueLabel
Comment
Activity
```

Relationships:

```text
User ───< ProjectMember >─── Project
User ───< Issue (creator/assignee)
Project ───< Issue
Issue ───< Comment
User ───< Comment
Issue ───< Activity
User ───< Activity
Issue >──< Label
```

Exact fields, constraints and indexes are to be defined before the database phase is implemented.

## 8. Core Issue Logic

Every issue must support at minimum:

- project-scoped identifier such as `BUG-142`
- title
- description
- type
- status
- priority
- severity
- project
- creator
- assignee
- labels
- created timestamp
- updated timestamp

Core workflow:

```text
OPEN -> IN_PROGRESS -> IN_REVIEW -> RESOLVED -> CLOSED
```

The backend is the source of truth for issue state once the backend phase is implemented.

## 9. Core Judge Workflow

The primary complete demonstration should be:

```text
Login
  -> Project
  -> Create issue
  -> Assign issue
  -> Comment
  -> Change status
  -> Resolve/close
  -> Dashboard reflects the change
```

This end-to-end path takes priority over secondary features.

## 10. Main Product Areas

### Dashboard

- issue counts
- critical/high priority counts
- status distribution
- recent activity
- assigned-to-me issues

### Issues

- searchable list
- filtering
- sorting
- create/edit/delete

### Issue detail

- description
- status
- priority
- severity
- assignee
- labels
- comments
- activity history

### Kanban

Workflow columns. Moving an issue changes its actual status once the API exists.

### Analytics

Calculated from real stored data. Never present hardcoded numbers as live analytics.

### Collaboration

- comments
- activity timeline
- optional watchers/followers
- optional mentions

### Differentiation

A possible smart-triage feature can suggest type/priority/severity/labels/assignee from issue information. If deterministic rules are used, describe it honestly as rules-based triage rather than fake AI.

## 11. API Conventions

Base path:

```text
/api
```

JSON request/response bodies.

Use conventional REST methods:

```text
GET
POST
PATCH
DELETE
```

Use meaningful HTTP status codes and structured JSON errors.

Never silently convert API failure into a successful UI state.

## 12. Environment Variables

Track environment variables for deployment correctness.

Only add variables that the implementation actually consumes.

Frontend:

```text
VITE_API_URL
```

Backend when required:

```text
DATABASE_URL
JWT_SECRET
CORS_ORIGINS
```

## 13. AI Implementation Rules

The coding agent is responsible for implementation, but must follow this architecture rather than inventing a competing stack.

Do not:

- create fake functionality
- present hardcoded/mock data as live data
- leave placeholder functions and call them complete
- add decorative buttons with no real behaviour
- create dead integrations
- swallow important errors
- introduce unnecessary dependencies
- duplicate libraries for the same responsibility
- overengineer simple competition features
- modify unrelated working systems without a reason

Restructuring existing code is allowed when required by the approved architecture.

## 14. AI-Agent Context Rule

After every meaningful implementation change, update this file with the actual current state.

The update must include, where applicable:

- current phase
- completed features
- packages actually installed and their purposes
- files/areas changed
- API endpoints introduced
- database changes
- environment variables actually required
- deployment state
- tests performed
- known issues
- next phase/task

The file must describe reality, not intended future functionality.

## 15. Phase Plan

### Phase 0 — Deployment foundation

**DONE / VERIFIED**

Minimal React/Vite frontend deployed on Vercel.

### Phase 1 — Backend foundation

**NEXT**

Create a clean Flask backend with:

- application entry point
- configuration
- CORS configuration
- `GET /health`
- production-friendly startup
- minimal dependencies

Do not implement authentication, database models, issue CRUD, dashboard or other product features in this phase.

Acceptance:

- backend starts locally
- `/health` returns JSON success
- production backend can be deployed independently
- no unnecessary dependencies
- existing Vercel frontend remains unaffected

### Phase 2 — Frontend ↔ Backend connection

Connect the existing frontend to the deployed backend health endpoint. Add the API abstraction and a real connection status indicator.

### Phase 3 — Database foundation

Add PostgreSQL + SQLAlchemy and verify a real production database connection/persistence path.

### Phase 4 — Authentication

Implement registration/login/session protection using the approved backend stack.

### Phase 5 — Projects + core issues

Implement projects and the complete issue CRUD/lifecycle.

### Phase 6 — Collaboration

Comments, activity history, assignment and labels.

### Phase 7 — Product UX

Dashboard, issue detail, issue list/search/filtering and Kanban.

### Phase 8 — Analytics + differentiation

Real-data analytics and smart triage/other high-value innovation if time permits.

### Phase 9 — Final hardening

End-to-end production testing, responsive testing, demo flow, README and submission preparation.

## 16. Current Task For AI Studio

The next agent prompt should instruct AI Studio to read this file and implement **Phase 1 — Backend foundation** only.

Do not redesign the frontend during this phase.
Do not add product features early.
Do not introduce an alternative backend stack.

## 17. Final Quality Standard

A feature is considered real only when its actual logic works end-to-end at the level appropriate to the current phase.

The final project should contain useful code, not code volume. Every dependency, abstraction and feature should have a concrete purpose.
