# BUGZILLA — Master Project Context

> **AUTHORITATIVE BASELINE FOR THE ENTIRE PROJECT**
>
> This file is the source of truth for the implementation plan. Read it before making changes. The implementation agent must preserve this architecture unless a concrete technical reason requires a change. Every meaningful implementation change must update the **Living Project State** at the end of this file with what actually exists, what was tested, and what remains. Never claim a feature works unless it is implemented and verified.

---

# 1. PROJECT IDENTITY

**Working name:** Bugzilla

**Competition:** CloneFest Mission 2 — Developer Tool Reconstruction: Bugzilla

**Reference repository:** https://github.com/bugzilla/bugzilla

**Submission deadline:** 30 August 2026, 23:59

## Mission interpretation

Use the reference repository to understand the underlying developer problem and workflows. Do **not** reproduce Bugzilla's source code, legacy UI, or existing UX. The result must be an independent modern issue-management product.

## Competition priorities

1. End-to-end functionality
2. Excellent judge-facing experience
3. Reliable public deployment
4. Coherent architecture
5. Meaningful differentiation
6. Visual polish

The project is time constrained. Prefer a smaller complete feature over a large partially implemented system.

---

# 2. PRODUCT DEFINITION

## Product statement

Bugzilla is a modern collaborative software issue-management workspace. A development team can create projects, report and triage issues, assign work, track a controlled lifecycle, collaborate through comments, inspect activity history, and understand project health through dashboards and analytics.

## Primary users

- Developers
- Maintainers / team leads
- Project administrators
- Reviewers / stakeholders

## Primary demonstration journey

```text
Register / Login
      ↓
Workspace / Projects
      ↓
Open project
      ↓
Create or discover issue
      ↓
Triage issue
      ↓
Assign issue
      ↓
Work on issue
      ↓
Comment / collaborate
      ↓
Change workflow state
      ↓
Resolve / close
      ↓
Dashboard and analytics reflect real state
```

## Product principle

A judge should immediately understand an issue's identifier, title, type, priority, severity, status, owner, history and next action without hunting through the application.

---

# 3. FEATURE SCOPE

## Tier 1 — Must work

These constitute the complete core demonstration:

- Registration
- Login
- Persistent authentication state
- Project creation
- Project membership
- Project switching
- Issue creation
- Issue editing
- Issue deletion
- Project-scoped issue identifiers
- Issue type
- Priority
- Severity
- Status workflow
- Assignment
- Labels
- Issue detail page
- Comments
- Activity history
- Issue list
- Search
- Filtering
- Sorting
- Project dashboard
- Kanban workflow view
- PostgreSQL persistence
- Public deployment

## Tier 2 — Strongly preferred

- Project overview
- Member management
- Recent activity
- Assigned-to-me view
- Useful issue statistics
- Analytics charts
- Overdue / stale issue indicators
- Reopen resolved/closed issues
- Excellent loading, empty and error states
- Responsive layout

## Tier 3 — Differentiation

Implement only after Tier 1 is stable.

### Smart triage

Given title + description, provide suggestions for issue type, priority, severity and labels. Suggestions must be reviewable and must never silently overwrite user selections.

If implemented using deterministic rules, describe it as **rules-based smart triage**, not AI.

### Similar issue detection

Use practical text similarity to suggest related or possibly duplicate issues. It is advisory only; never automatically merge/delete issues.

### Workflow insights

Useful derived signals may include:

- high-severity unresolved issues
- issues stuck in a state too long
- workload distribution
- resolution trends
- project health indicators

## Cut unless genuinely useful and time remains

- Real-time chat
- Email infrastructure
- Complex notifications
- Microservices
- GraphQL
- WebSockets
- Kubernetes
- elaborate permission hierarchies
- unnecessary abstraction layers
- duplicate libraries that solve the same problem

---

# 4. SYSTEM ARCHITECTURE

## 4.1 Target architecture

```text
                              ┌─────────────────────┐
                              │       Browser       │
                              └──────────┬──────────┘
                                         │ HTTPS
                                         ▼
                    ┌────────────────────────────────────┐
                    │ Vercel                             │
                    │ React + Vite + TypeScript         │
                    │                                    │
                    │ Pages / Components / Routing       │
                    │ UI state / Forms                    │
                    │ API client / Domain types           │
                    └────────────────┬───────────────────┘
                                     │ HTTPS JSON REST
                                     ▼
                    ┌────────────────────────────────────┐
                    │ Flask API                          │
                    │                                    │
                    │ Routes / Auth / Authorization      │
                    │ Validation / Services              │
                    │ Error handling / Analytics         │
                    └────────────────┬───────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────────┐
                    │ SQLAlchemy                         │
                    │ ORM / relationships / transactions │
                    └────────────────┬───────────────────┘
                                     │ PostgreSQL protocol
                                     ▼
                    ┌────────────────────────────────────┐
                    │ PostgreSQL                         │
                    │ persistent source of truth         │
                    └────────────────────────────────────┘
```

The frontend and backend are independently deployable. Vercel hosts the frontend. The Flask backend is deployed separately using a WSGI-compatible service. PostgreSQL is the production database.

## 4.2 Request flow

```text
Browser
  ↓
React page/component
  ↓
API client
  ↓ HTTPS JSON
Flask route / blueprint
  ↓
JWT authentication
  ↓
Project authorization
  ↓
Request validation
  ↓
Service / domain logic
  ↓
SQLAlchemy transaction
  ↓
PostgreSQL
  ↓
Serialized JSON response
  ↓
API client
  ↓
React state / UI
```

Routes remain thin. Business rules belong in services/domain code. The browser is never the security boundary and never the authoritative source of persisted state.

## 4.3 Responsibility boundaries

### Frontend

Owns presentation, navigation, form state, local UI state, loading/error/empty states and API interaction through the API layer.

Does not own authorization, project membership, issue lifecycle truth or persistence.

### API client

Centralizes base URL handling, HTTP requests, authentication headers, JSON parsing and normalized errors. Components must not scatter duplicate raw `fetch()` implementations.

### Backend

Owns authentication, authorization, validation, business rules, issue lifecycle enforcement, membership rules, persistence, activity generation and analytics queries.

### Database

Owns durable application state and relational integrity.

---

# 5. FRONTEND ARCHITECTURE

## Technology

- React
- Vite
- TypeScript
- Native browser `fetch`
- Lucide React icons
- React Router for multi-page application routing
- Recharts for analytics

## Planned structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── router.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── issues/
│   │   ├── projects/
│   │   └── dashboard/
│   ├── layouts/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── ProjectOverviewPage.tsx
│   │   ├── IssuesPage.tsx
│   │   ├── IssueDetailPage.tsx
│   │   ├── KanbanPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   └── ProjectSettingsPage.tsx
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   ├── issues.ts
│   │   ├── comments.ts
│   │   └── analytics.ts
│   ├── hooks/
│   ├── types/
│   ├── lib/
│   ├── assets/
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Planned routes

```text
/login
/register
/
/projects
/projects/:projectId
/projects/:projectId/issues
/projects/:projectId/issues/:issueId
/projects/:projectId/kanban
/projects/:projectId/analytics
/projects/:projectId/settings
```

The route names may change if the same information architecture is preserved.

## Frontend state strategy

Start with React state/context. Server data remains authoritative. Add a dedicated state-management library only if an actual cross-page state requirement justifies it. Do not introduce Redux, Zustand or MobX merely because an AI coding agent prefers them.

## UI architecture

Build a consistent design system using reusable local components. Do not introduce a large UI framework simply to implement buttons, inputs, cards and dialogs.

Required states for real data screens:

- initial loading
- successful data
- empty data
- request failure
- mutation pending
- mutation failure
- permission denied where applicable

---

# 6. BACKEND ARCHITECTURE

## Planned structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── extensions.py
│   ├── routes/
│   │   ├── health.py
│   │   ├── auth.py
│   │   ├── projects.py
│   │   ├── issues.py
│   │   ├── comments.py
│   │   ├── labels.py
│   │   └── analytics.py
│   ├── models/
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── issue.py
│   │   ├── label.py
│   │   ├── comment.py
│   │   └── activity.py
│   ├── schemas/
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── project_service.py
│   │   ├── issue_service.py
│   │   └── analytics_service.py
│   ├── errors/
│   └── utils/
├── tests/
├── requirements.txt
└── run.py
```

Do not create every planned directory in advance. Create files when the corresponding feature phase begins.

---

# 7. APPROVED PACKAGES

## Frontend baseline

| Package | Purpose | Timing |
|---|---|---|
| `react` | UI framework | baseline |
| `react-dom` | browser rendering | baseline |
| `vite` | development/build | baseline |
| `typescript` | static typing | baseline |
| `lucide-react` | icons | baseline |
| `react-router-dom` | routing | routing phase |
| `recharts` | analytics charts | analytics phase |

Use native `fetch` for HTTP. **Do not add Axios without a concrete requirement.**

## Backend baseline

| Package | Purpose | Timing |
|---|---|---|
| `Flask` | REST API | Phase 1 |
| `Flask-CORS` | CORS | Phase 1 |
| `gunicorn` | production WSGI server | Phase 1 |
| `SQLAlchemy` | ORM | database phase |
| `psycopg` | PostgreSQL driver | database phase |
| `Flask-JWT-Extended` | JWT authentication | auth phase |
| `bcrypt` | password hashing | auth phase |
| `pytest` | backend tests | Phase 1 onward |

## Package decision rule

Every new package must have a concrete feature-level reason. Record it in the Living Project State. Do not allow an AI agent to add libraries because they are popular, convenient, or included in generated boilerplate.

Do not introduce competing stacks such as FastAPI/Django, MongoDB, Prisma, GraphQL, Firebase/Supabase replacement backends, multiple ORMs, multiple authentication systems or multiple chart/UI frameworks.

---

# 8. DATABASE MODEL

PostgreSQL is the production source of truth.

## Core entities

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

## Relationships

```text
User ─────< ProjectMember >───── Project
User ─────< Issue (creator)
User ─────< Issue (assignee)
Project ──< Issue
Issue ────< Comment
User ─────< Comment
Issue ────< Activity
User ─────< Activity
Issue >────< Label
```

## User

Fields:

- `id` primary key
- `username` unique
- `email` unique
- `password_hash`
- `created_at`
- `updated_at`

Never store plaintext passwords.

## Project

Fields:

- `id`
- `name`
- `key` unique
- `description`
- `created_by` foreign key to User
- `created_at`
- `updated_at`

Project key creates human-readable identifiers such as `BUG-142`.

## ProjectMember

Fields:

- `project_id`
- `user_id`
- `role`
- `joined_at`

Unique constraint on `(project_id, user_id)`.

## Issue

Fields:

- `id`
- `project_id`
- `issue_number`
- `title`
- `description`
- `issue_type`
- `status`
- `priority`
- `severity`
- `creator_id`
- `assignee_id`
- `resolution`
- `created_at`
- `updated_at`
- `resolved_at`

Unique constraint on `(project_id, issue_number)`.

Human-readable identifier:

```text
{project.key}-{issue.issue_number}
```

Issue numbering must be generated safely for concurrent creation.

## Label

- `id`
- `project_id`
- `name`
- `created_at`

Label names are unique within a project.

## IssueLabel

Association table containing `issue_id` and `label_id`; prevent duplicate assignments.

## Comment

- `id`
- `issue_id`
- `author_id`
- `body`
- `created_at`
- `updated_at`

## Activity

- `id`
- `issue_id`
- `actor_id`
- `action_type`
- `metadata`
- `created_at`

Metadata stores structured old/new information where useful, such as status or assignee changes.

## Database rules

- Explicit foreign keys
- Appropriate indexes for project/issue lookup
- Transactional mutations
- Database constraints for uniqueness/integrity
- Backend is authoritative

---

# 9. AUTHENTICATION AND AUTHORIZATION

## Roles

### ADMIN

Project settings, membership, roles and full issue management.

### MAINTAINER

Issue management, assignment, workflow and labels.

### DEVELOPER

View, create, comment and work on issues according to project permissions.

### VIEWER

Read-only access.

Authorization is enforced on the backend. Frontend role checks are UX only.

## JWT flow

```text
Register
 ↓
Validate input
 ↓
Hash password with bcrypt
 ↓
Create User
 ↓
Login
 ↓
Verify password
 ↓
Issue JWT
 ↓
Frontend stores authentication state
 ↓
Authenticated API request
 ↓
Backend verifies JWT
 ↓
Project authorization
 ↓
Protected operation
```

Endpoints:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Logout clears client authentication state. Do not claim server-side revocation unless it is implemented.

---

# 10. ISSUE DOMAIN AND WORKFLOW

## Issue types

```text
BUG
FEATURE
TASK
IMPROVEMENT
```

## Statuses

```text
OPEN
IN_PROGRESS
IN_REVIEW
RESOLVED
CLOSED
```

## Priority

```text
URGENT
HIGH
MEDIUM
LOW
```

## Severity

```text
CRITICAL
HIGH
MEDIUM
LOW
```

## Resolutions

```text
FIXED
DUPLICATE
WONT_FIX
INVALID
WORKS_FOR_ME
```

## Normal lifecycle

```text
OPEN → IN_PROGRESS → IN_REVIEW → RESOLVED → CLOSED
```

Useful reverse transitions must be explicitly supported by backend rules, particularly reopening resolved/closed issues.

Status changes create Activity records.

---

# 11. API CONTRACT BASELINE

All application endpoints use `/api`.

## Health

```text
GET /api/health
→ 200
→ {"status":"ok"}
```

## Auth

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

## Projects

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:projectId
PATCH  /api/projects/:projectId
DELETE /api/projects/:projectId
GET    /api/projects/:projectId/members
POST   /api/projects/:projectId/members
PATCH  /api/projects/:projectId/members/:userId
DELETE /api/projects/:projectId/members/:userId
```

## Issues

```text
GET    /api/projects/:projectId/issues
POST   /api/projects/:projectId/issues
GET    /api/projects/:projectId/issues/:issueId
PATCH  /api/projects/:projectId/issues/:issueId
DELETE /api/projects/:projectId/issues/:issueId
```

List endpoint supports server-side search/filter/sort parameters once implemented.

## Comments

```text
GET  /api/projects/:projectId/issues/:issueId/comments
POST /api/projects/:projectId/issues/:issueId/comments
PATCH /api/projects/:projectId/issues/:issueId/comments/:commentId
DELETE /api/projects/:projectId/issues/:issueId/comments/:commentId
```

## Analytics

```text
GET /api/projects/:projectId/analytics/summary
GET /api/projects/:projectId/analytics/status
GET /api/projects/:projectId/analytics/priority
```

Exact response fields must be documented when implemented; do not invent frontend assumptions first and force the backend to match later.

## API error shape

Use a consistent JSON structure, for example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable explanation",
    "details": {}
  }
}
```

Do not expose stack traces in production responses.

---

# 12. PHASE PLAN

The project is intentionally built in isolated phases so every major layer can be verified before the next layer depends on it.

## Phase 1 — Deployment foundation

Goal: establish a working, independently testable base.

Backend:

- Flask application factory
- configuration
- CORS
- health endpoint
- pytest setup
- Gunicorn entry point

Frontend:

- existing Vite/React build must remain healthy
- `npm run build` must pass
- TypeScript compilation must pass

Verification:

- backend tests pass
- local Flask starts
- Gunicorn starts
- `/api/health` responds
- frontend production build passes

**Current Phase 1 implementation exists; see Living Project State.**

## Phase 2 — Database foundation

- SQLAlchemy integration
- PostgreSQL connection configuration
- models
- migrations/schema strategy
- transaction handling
- database health check
- isolated model tests

Verification before continuing:

- clean database initializes
- application starts with configured DB
- model tests pass
- production connection is verified

## Phase 3 — Authentication

- registration
- password hashing
- login
- JWT
- `/me`
- frontend auth state
- protected routes
- authentication error states

Verification:

- register → login → authenticated request
- invalid credentials rejected
- unauthenticated protected request rejected
- refresh/reload behavior works as designed

## Phase 4 — Projects and membership

- project CRUD
- unique project keys
- project membership
- roles
- authorization checks
- project switching UI

Verification:

- create project
- add/remove members
- role enforcement
- project isolation

## Phase 5 — Core issue management

- issue model
- issue number generation
- create/read/update/delete
- type/priority/severity/status
- assignment
- labels
- issue detail

Verification:

- full CRUD against PostgreSQL
- identifiers remain unique
- invalid transitions rejected
- permissions enforced

## Phase 6 — Collaboration and history

- comments
- activity events
- issue timeline
- editing/deletion rules

Verification:

- mutations produce expected activity
- comments persist and display
- activity is ordered and attributable

## Phase 7 — Search, filtering and workflow UI

- issue list
- search
- filters
- sorting
- pagination if needed
- Kanban
- drag/drop only if it adds real value and remains reliable

Verification:

- filters correspond to backend results
- status changes persist
- refresh preserves actual server state

## Phase 8 — Dashboard and analytics

- project summary
- issue counts
- status distribution
- priority/severity distribution
- workload
- trends where useful
- Recharts visualizations

Analytics must be calculated from real database state, not hardcoded demo numbers.

## Phase 9 — Innovation

Choose only high-value features that are reliable:

1. smart triage
2. similar issue detection
3. workflow insights

Each feature must have a visible user benefit and a clear fallback/error state.

## Phase 10 — Production hardening and competition demo

- frontend deployment on Vercel
- backend deployment
- PostgreSQL production connection
- CORS production origin
- environment variables
- end-to-end smoke test
- mobile/responsive check
- loading/error/empty state audit
- remove fake/demo data
- verify all critical links/routes
- final judge walkthrough

**Deployment is a feature, not a final-day activity.** Re-test the public deployment after every major integration phase.

---

# 13. DEPLOYMENT ARCHITECTURE

## Frontend

Vercel builds the Vite frontend from the repository.

Production frontend configuration uses:

```text
VITE_API_URL=<public backend URL>
```

Do not hardcode the production backend URL into source code.

## Backend

The Flask application exposes the application factory and is served through Gunicorn:

```text
web: gunicorn "app:create_app()"
```

The backend deployment must provide its PostgreSQL connection string and production CORS configuration through environment variables.

## Environment variables

Expected production configuration will include, as required by the implemented features:

```text
DATABASE_URL
JWT_SECRET_KEY
CORS_ORIGINS
```

Frontend:

```text
VITE_API_URL
```

`.env` files containing real secrets must never be committed. `.env.example` contains names/placeholders only.

## Deployment verification sequence

```text
1. Backend deploys
2. GET /api/health works publicly
3. Database connection works
4. Frontend deploys
5. Frontend can reach backend
6. Register/login works publicly
7. Create project works
8. Create issue works
9. Issue mutation persists after refresh
10. Comments/history work
11. Dashboard reflects database state
```

Do not wait until the final submission day to perform this sequence.

---

# 14. TESTING STRATEGY

Every major phase must have a verification boundary.

## Backend

Use pytest for:

- application factory
- endpoint status/payload
- validation
- authentication
- authorization
- service logic
- model relationships
- issue lifecycle
- database operations

## Frontend

At minimum verify:

```text
npm run build
npx tsc --noEmit
```

For user-facing flows, manually test the production build/public deployment.

## Integration smoke path

```text
Register
→ Login
→ Create project
→ Create issue
→ Assign issue
→ Change status
→ Add comment
→ Refresh
→ Confirm persisted state
→ Open dashboard
→ Confirm counts match issues
```

---

# 15. AI CODING AGENT OPERATING CONTRACT

This section exists specifically to prevent generated nonsense and context loss.

## Before coding

The agent must:

1. Read this entire file.
2. Read the current repository structure.
3. Inspect existing implementation before creating files.
4. Identify the current phase.
5. Implement only the requested phase/slice.
6. Preserve working previous phases.
7. Use the package decisions above.
8. Avoid inventing a new architecture.

## While coding

The agent must:

- implement real functionality, not mock screens
- connect new UI to real API endpoints when the phase requires it
- keep server state authoritative
- keep route handlers thin
- validate backend inputs
- use transactions for important mutations
- use consistent errors
- avoid duplicated API logic
- avoid dead code and unused dependencies
- avoid hardcoded fake analytics/data
- avoid claiming AI functionality without an actual model/algorithm
- avoid replacing working code with generated boilerplate

## Package discipline

Before adding a package, state:

```text
Package:
Reason:
Feature requiring it:
Why existing packages are insufficient:
```

If the reason is weak, do not add it.

## Phase isolation

A phase is complete only when:

```text
Implementation complete
+ tests pass
+ build passes
+ relevant runtime smoke test passes
+ documentation updated
```

Do not mix unrelated feature work into a phase commit.

## Context maintenance

After every meaningful change, update **Living Project State** with:

- date
- phase
- files added/changed
- packages added/changed
- functionality implemented
- tests run and actual results
- deployment result if tested
- known issues
- next exact phase/slice

Never rewrite or delete the architecture baseline merely to describe current implementation status.

---

# 16. AI-GENERATED BULLSHIT / REGRESSION AUDIT

The project must be audited for these failure patterns after each agent commit:

### Fake functionality

A button exists but does not call a real backend operation.

### Decorative backend

An endpoint returns hardcoded data unrelated to database state.

### Random package inflation

Libraries are added without a concrete requirement.

### Architecture drift

Agent silently changes Flask/PostgreSQL/React/Vite architecture.

### Context destruction

Agent replaces this baseline with a short status summary. **Never do this.**

### Duplicate systems

Two API clients, two auth mechanisms, multiple ORMs, multiple state systems or multiple UI libraries appear without justification.

### Fake AI

Rules, random values or simple string matching are presented as machine learning/AI.

### Unverified claims

Documentation says a feature works while tests/build/deployment do not demonstrate it.

### Hidden coupling

A supposedly isolated phase unexpectedly breaks previous phases.

### Deployment-only failure

Local code works but environment variables, paths, build configuration, CORS or production server configuration prevent public deployment.

Every audit should explicitly report these categories as **PASS / FAIL / NOT YET APPLICABLE**.

---

# 17. REFERENCE IMPLEMENTATION

The official reference repository supplied by the competition is:

https://github.com/bugzilla/bugzilla

Use it to understand concepts and workflows only. The implementation, information architecture, visual design and code must remain independently constructed.

---

# 18. LIVING PROJECT STATE

> **This section changes as implementation progresses. The architecture above does not get replaced by status updates.**

## 2026-08-27 — Phase 1 completed

### Implemented files

```text
backend/app/__init__.py
backend/app/config.py
backend/app/extensions.py
backend/app/routes/__init__.py
backend/app/routes/health.py
backend/tests/test_health.py
backend/conftest.py
backend/pytest.ini
backend/run.py
backend/Procfile
backend/requirements.txt
```

### Phase 1 packages actually present

```text
Flask
Flask-CORS
gunicorn
pytest
```

The current requirements file uses version ranges for these four packages. No database/auth package has been introduced yet.

### Implemented functionality

Application factory exists. CORS is configured through the extensions module. `GET /api/health` is registered at `/api/health` and returns HTTP 200 JSON:

```json
{"status":"ok"}
```

The repository contains four health/factory tests covering application creation, HTTP status, JSON response and payload.

### Reported verification

The Phase 1 implementation agent reported:

- pytest: 4/4 passing
- local Flask startup: successful
- Gunicorn startup: successful
- live health request: successful
- frontend `npm run build`: successful
- frontend `tsc --noEmit`: successful

These claims should be re-run when the environment is available; repository contents alone do not constitute CI evidence.

### Important audit note

The Phase 1 commit previously replaced this master context file with a much shorter summary. This version restores the detailed baseline and preserves the Phase 1 implementation state separately in this Living Project State section.

### Current status

```text
Phase 1 backend foundation:      COMPLETE
Frontend build foundation:      VERIFIED by agent report
Database:                        NOT STARTED
Authentication:                  NOT STARTED
Projects:                        NOT STARTED
Issues:                          NOT STARTED
Comments/activity:               NOT STARTED
Search/filtering:                NOT STARTED
Kanban:                          NOT STARTED
Analytics:                       NOT STARTED
Innovation:                      NOT STARTED
Production backend deployment:   NOT YET VERIFIED
Production frontend deployment:  NOT YET VERIFIED in this phase
```

### Next exact slice

**Phase 2 — Database foundation.** Add SQLAlchemy + psycopg, PostgreSQL configuration, models and database verification in an isolated commit. Do not implement authentication, projects, issues or UI redesign in the database-foundation commit.

---

# 19. CHANGE LOG

| Date | Change |
|---|---|
| 2026-08-27 | Detailed architecture baseline established |
| 2026-08-27 | Phase 1 backend foundation implemented |
| 2026-08-27 | Master context restored after accidental replacement by Phase 1 status summary |

**END OF AUTHORITATIVE CONTEXT**
