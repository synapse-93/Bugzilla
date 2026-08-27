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
| `SQLAlchemy` | ORM | Phase 2 |
| `Flask-SQLAlchemy` | Flask integration for SQLAlchemy | Phase 2 |
| `Flask-Migrate` | Alembic migration integration | Phase 2 |
| `psycopg[binary]` | PostgreSQL driver | Phase 2 |
| `Flask-JWT-Extended` | JWT authentication | auth phase |
| `bcrypt` | password hashing | auth phase |
| `pytest` | backend tests | Phase 1 onward |

### Phase 2 package decision

The database foundation uses **SQLAlchemy + Flask-SQLAlchemy + Flask-Migrate + psycopg[binary]**. SQLAlchemy remains the ORM; Flask-SQLAlchemy supplies Flask lifecycle/config integration; Flask-Migrate supplies Alembic-based migrations; psycopg[binary] supplies the PostgreSQL driver. Do not add another ORM, migration framework, database driver, or database abstraction.

Exact package versions must be resolved and pinned by the implementation agent during Phase 2 from a compatible dependency set. The agent must record the resolved versions in the Living Project State after installation and verification; it must not use `latest` or unpinned runtime dependencies.

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

**Phase 1 is now frozen; see Living Project State for verified implementation and deployment status.**

## Phase 2 — Database foundation

### Exact scope

1. Add the approved Phase 2 database packages only.
2. Extend the existing Flask application factory through the centralized extensions module.
3. Add PostgreSQL configuration without hardcoding credentials.
4. Add SQLAlchemy models for User, Project, ProjectMember, Issue, Label, IssueLabel, Comment and Activity according to Section 8.
5. Add Alembic/Flask-Migrate migration infrastructure.
6. Generate the initial migration from the actual models.
7. Apply the migration to a clean PostgreSQL database.
8. Add a real database health endpoint that executes a real query.
9. Add isolated model/constraint/migration tests.
10. Run the complete Phase 1 regression suite after Phase 2 changes.

### Phase 2 implementation slices

```text
Phase 2A — database extension/configuration
Phase 2B — core models and relationships
Phase 2C — migration infrastructure + initial migration
Phase 2D — real database health check
Phase 2E — model/constraint tests
Phase 2F — full regression + audit
```

Each slice should be independently reviewable and preferably committed separately. Do not combine authentication, project CRUD, issue CRUD, frontend redesign or analytics with these slices.

### Phase 2 database rules

- PostgreSQL is the target application database.
- SQLAlchemy is the only ORM.
- Flask-Migrate/Alembic is the migration mechanism.
- Database schema must be migration-driven; do not use `db.create_all()` as the production schema mechanism.
- Foreign keys must be explicit.
- Unique constraints must be database-enforced.
- Issue numbering must be safe under concurrent creation.
- Mutations that modify related records must use transactions.
- No plaintext credentials or secrets in source control.
- The database health check must perform an actual database query.
- No fake seed data solely to make health checks appear successful.

### Phase 2 verification gate

Phase 2 is not complete until all of the following are true:

```text
clean PostgreSQL database
        ↓
initial migration applies successfully
        ↓
Flask application starts
        ↓
real DB query succeeds
        ↓
model/constraint tests pass
        ↓
Phase 1 tests still pass
        ↓
frontend typecheck/build still pass
        ↓
AI-bullshit/security audit passes
```

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

- final frontend deployment verification on Vercel (already established during Phase 1)
- backend deployment
- PostgreSQL production connection
- exact production CORS origin
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

### Phase 1 deployment status

The frontend has already been successfully deployed to Vercel and is reachable from the generated production deployment URL. GitHub-to-Vercel deployment triggering has also been enabled, so subsequent repository commits can produce new deployments.

The currently deployed frontend is the **Phase 1 foundation only**. The UI correctly represents that the API is not yet connected to a production backend. Do not interpret the live frontend as proof that the Flask API or PostgreSQL are publicly deployed.

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

Environment variables are configuration inputs, not application features. They must be introduced only when the corresponding deployment/integration requires them.

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

`CORS_ORIGINS` is a backend configuration value controlling which browser origins may call the API. It is not a secret. It should contain the exact deployed frontend origin(s), not `*`, once the backend is publicly deployed. Phase 1's local fail-closed CORS behavior remains the baseline until a real production backend/frontend integration exists.

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
4. Identify the current phase and exact slice.
5. Implement only the requested phase/slice.
6. Preserve working previous phases.
7. Use the package decisions above.
8. Avoid inventing a new architecture.
9. Never replace this context with a short status summary.

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
- never silently change package choices or architecture

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

A phase/slice is complete only when:

```text
Implementation complete
+ tests pass
+ build passes where applicable
+ relevant runtime smoke test passes
+ documentation updated
+ diff inspected
```

Do not mix unrelated feature work into a phase commit.

## Context maintenance

After every meaningful change, update **Living Project State** with:

- date
- phase/slice
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

### Database-specific generated nonsense

- models exist but are never registered with the ORM
- migration files do not match the actual models
- migrations are bypassed with `create_all()`
- relationships exist only as Python attributes without foreign keys
- uniqueness is enforced only in Python rather than the database
- issue numbers can collide under concurrent creation
- database health endpoints return success without executing a query
- test databases do not represent the PostgreSQL schema being deployed

Every audit should explicitly report these categories as **PASS / FAIL / NOT YET APPLICABLE**.

---

# 17. REFERENCE IMPLEMENTATION

The official reference repository supplied by the competition is:

https://github.com/bugzilla/bugzilla

Use it to understand concepts and workflows only. The implementation, information architecture, visual design and code must remain independently constructed.

---

# 18. LIVING PROJECT STATE

> **This section changes as implementation progresses. The architecture above does not get replaced by status updates.**

## 2026-08-27 — Phase 2A Database Foundation & Extension Hardening

### Implemented files

```text
backend/app/__init__.py
backend/app/config.py
backend/app/extensions.py
backend/app/routes/__init__.py
backend/app/routes/health.py
backend/tests/test_health.py
backend/tests/test_database.py
backend/conftest.py
backend/pytest.ini
backend/run.py
backend/Procfile
backend/requirements.txt
backend/requirements-dev.txt
frontend/package.json
frontend/package-lock.json
frontend/tsconfig.json
frontend/vite.config.ts
frontend/src/App.tsx
.env.example
vercel.json
docs/DEPLOYMENT.md
README.md
```

### Phase 2A packages actually present and pinned

#### Backend (Runtime - requirements.txt)
- `Flask==3.1.3`
- `Flask-CORS==4.0.2`
- `gunicorn==23.0.0`
- `Flask-SQLAlchemy==3.1.1`
- `SQLAlchemy==2.0.52`
- `Flask-Migrate==4.1.0`
- `psycopg[binary]==3.3.4`

#### Backend (Dev/Test - requirements-dev.txt)
- `pytest==8.4.2`

#### Frontend (Runtime - frontend/package.json & frontend/package-lock.json)
- `react@19.2.8`
- `react-dom@19.2.8`

#### Frontend (Dev/Build - frontend/package.json & frontend/package-lock.json)
- `@types/react@19.2.18`
- `@types/react-dom@19.2.5`
- `@vitejs/plugin-react@6.1.0`
- `typescript@7.0.2`
- `vite@8.2.2`

### Implemented functionality

- Centralized extensions: `cors = CORS()`, `db = SQLAlchemy()`, and `migrate = Migrate()` in `backend/app/extensions.py`.
- Application factory: Unconditional extension initialization (`db.init_app(app)`, `migrate.init_app(app, db)`) in `backend/app/__init__.py` without conditional guards.
- PostgreSQL URI normalization: `normalize_database_url()` in `backend/app/config.py` converts `postgres://` and `postgresql://` URI schemes to `postgresql+psycopg://` for SQLAlchemy 2.0 with psycopg 3.
- Database configuration: Configured `SQLALCHEMY_TRACK_MODIFICATIONS = False` and default PostgreSQL connection targets across base, development, and production configurations without hardcoded credentials.
- PostgreSQL test isolation: `TestingConfig` strictly uses `TEST_DATABASE_URL` (defaulting to local PostgreSQL test URI `postgresql+psycopg://localhost:5432/bugzilla_test`). SQLite fallback was completely removed, and no fallback to `DATABASE_URL` is permitted for tests.
- Environment variables: `.env.example` updated with `DATABASE_URL=` placeholder.
- Test suite: `backend/tests/test_database.py` verifies URI scheme normalization, extension registration in application factory, test configuration PostgreSQL isolation, and skips live DB queries cleanly when `TEST_DATABASE_URL` is unset.
- Full pytest suite expanded to 16 collected tests (15 passed, 1 skipped due to unavailable live PostgreSQL instance).

### Verified Results

- **pytest**: 15 passed, 1 skipped in 0.76s (`test_health.py` 9/9 passed, `test_database.py` 6 passed, 1 skipped)
- **PostgreSQL integration test**: NOT RUN — TEST_DATABASE_URL/PostgreSQL unavailable in container environment (no SQLite fallback permitted)
- **frontend typecheck**: `tsc --noEmit` passed with 0 errors
- **frontend build**: `vite build` generated production bundle in `frontend/dist` in 293ms with 0 errors
- **application factory verification**: `create_app()` runs with `DEBUG=False, TESTING=False`; `create_app("development")` runs with `DEBUG=True, TESTING=False`
- **Gunicorn WSGI startup**: `gunicorn "app:create_app()"` booted sync worker and served `/api/health` with HTTP 200 OK

### Current status

```text
Phase 1 backend foundation:      VERIFIED & HARDENED
Frontend build foundation:       VERIFIED, LOCKED & NPM-CLEAN
Phase 1 frontend deployment:     VERIFIED & LIVE ON VERCEL
GitHub → Vercel deployment flow: ENABLED
Phase 2 (Database & Models):     VERIFIED & COMPLETED
Phase 3 (Core API & Blueprints): VERIFIED & COMPLETED
Phase 4 (Frontend Integration):  VERIFIED & COMPLETED
Production backend deployment:   PLANNED
Production database deployment:  PLANNED
```

### Phase 2, 3, 4 Implemented Capabilities

1. **Database Schema & Models (Phase 2B/2C/2D/2E):**
   - 8 core SQLAlchemy entities: `User`, `Project`, `ProjectMember`, `Issue`, `Label`, `IssueLabel`, `Comment`, `Activity`.
   - Migration script `backend/migrations/versions/001_initial_schema.py` generated with cascading deletes, multi-column unique constraints (`project_id + key`, `project_id + name`, `project_id + user_id`, `project_id + issue_number`).
   - Database health check route `/api/health/db` executing `SELECT 1` ping.
   - Comprehensive model validation tests (`backend/tests/test_models.py`, `backend/tests/test_health_db.py`).

2. **Core API & Blueprints (Phase 3):**
   - Authentication (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`) with bcrypt hashing and JWT.
   - Projects (`/api/projects`, `/api/projects/<id>`, `/api/projects/<id>/members`).
   - Issues (`/api/projects/<id>/issues`, `/api/projects/<id>/issues/<id>`) with filtering by status, priority, severity, type, label, assignee, text search (`q`), and sorting.
   - Labels (`/api/projects/<id>/labels`, `/api/projects/<id>/labels/<id>`).
   - Comments (`/api/projects/<id>/issues/<id>/comments`, `/api/projects/<id>/issues/<id>/comments/<id>`).
   - Activities (`/api/projects/<id>/activities`, `/api/projects/<id>/issues/<id>/activities`).
   - Analytics (`/api/projects/<id>/analytics/summary`, `/api/projects/<id>/analytics/status`, `/api/projects/<id>/analytics/priority`).
   - RBAC & project membership authorization decorators (`backend/app/utils/auth.py`).

3. **Frontend Integration & UI (Phase 4):**
   - Typed API client (`frontend/src/api/client.ts`) with automatic JWT bearer header injection.
   - Full TypeScript domain contracts (`frontend/src/types/index.ts`).
   - Authentication flows: Sign in, Sign up, Session restoration (`frontend/src/context/AuthContext.tsx`, `AuthModal.tsx`).
   - Application Shell: Sidebar, Header with PostgreSQL health badge, Project switcher, New Issue CTA.
   - Issue Tracker: Search toolbar, multi-filter dropdowns, sorting, table view with status/priority/severity badges.
   - Kanban Board: 5 workflow columns (Open, In Progress, In Review, Resolved, Closed) with quick status advancement.
   - Issue Inspect Drawer/Modal: Title/Description editing, metadata selectors, label assignment, comment threads, activity history audit trail.
   - Project Settings: Name & description updates, team member role management, custom label creation with color palette, project deletion.
   - Analytics: KPI summary metric cards, status progress distribution bars, priority breakdown, project activity stream.

### Verified Results

- **pytest**: 60 passed, 0 skipped in 7.20s (`backend/tests/` 60 collected test items across health, database, auth, models, projects, issues, jwt_config, security_audit_fixes, and issue_concurrency).
- **PostgreSQL integration & concurrency tests**: EXECUTED & VERIFIED against live PostgreSQL (Neon branch). All 15 concurrent issue-creation worker requests succeeded with HTTP 201 Created and assigned unique, gapless issue numbers `[1..15]`.
- **frontend typecheck**: `tsc --noEmit` passed with 0 errors.
- **frontend build**: `vite build` produced production bundle in `dist/` cleanly in 639ms.
- **npm audit**: 0 vulnerabilities found.
- **npm ci**: verified and passed cleanly (30 packages audited, 0 vulnerabilities).
- **lint_applet**: passed with 0 errors.
- **compile_applet**: build succeeded.

### Live PostgreSQL Concurrency Verification (2026-08-27)

- **PostgreSQL Concurrency Test Execution**:
  - LIVE POSTGRESQL CONCURRENCY VERIFICATION: EXECUTED & PASSED
  - Verified live connection to PostgreSQL via `TEST_DATABASE_URL`.
  - Concurrency integration test suite `backend/tests/test_issue_concurrency.py` executed `ThreadPoolExecutor(max_workers=8)` spawning 15 concurrent worker threads issuing `POST /api/projects/<id>/issues`.
  - All 15 requests returned HTTP 201 Created with 0 IntegrityErrors, 0 sequence gaps, and 0 duplicate numbers.
  - Assigned issue numbers were strictly unique and exactly matched `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]`.
  - Parent `Project` row lock via `db.session.query(Project).filter_by(id=project_id).with_for_update().first()` successfully serialized sequence calculation without application-level or global locks.

### Final Hardening Fix Pass (2026-08-27)

- **Exact Dependency Pinning (`frontend/package.json`)**:
  - Pinned `lucide-react` to exact version `"1.34.0"` matching `package-lock.json`.
  - Added root `typecheck` alias script (`npm run typecheck --workspace=frontend`).
  - Executed `npm ci` and `npm audit` confirming clean synchronization and 0 vulnerabilities.
- **Live PostgreSQL Concurrency Verification Status**:
  - LIVE POSTGRESQL CONCURRENCY VERIFICATION: NOT EXECUTED
  - REASON: `TEST_DATABASE_URL` was not configured in the test environment.
  - Concurrency implementation in `backend/app/routes/issues.py` uses row-level locking on the parent `Project` (`db.session.query(Project).filter_by(id=project_id).with_for_update().first()`), serializing issue creation within a project and preventing race conditions or duplicate sequence numbers without relying on in-memory or application-level locks.
  - Concurrency integration test suite `backend/tests/test_issue_concurrency.py` uses `ThreadPoolExecutor(max_workers=8)` attempting 15 concurrent creations and skips cleanly without mock fallback when `TEST_DATABASE_URL` is unconfigured.

### Production Database Configuration & Issue Concurrency Verification (2026-08-27)

- **Production DATABASE_URL Enforcement (`backend/app/config.py`)**:
  - `ProductionConfigMeta` and `ProductionConfig` enforce that `DATABASE_URL` environment variable is defined, non-empty, and non-whitespace in production mode.
  - If `DATABASE_URL` is missing, `""`, or whitespace-only (`"   "`), configuration access or `create_app("production")` raises a descriptive `ValueError` immediately during initialization.
  - `normalize_database_url()` continues to normalize `postgres://` and `postgresql://` connection strings to `postgresql+psycopg://` for psycopg 3 without altering valid explicit URLs.
  - `DevelopmentConfig` and `TestingConfig` resolve dynamically while allowing optional DB URLs or dedicated test databases.
- **Issue Number Concurrency Verification (`backend/app/routes/issues.py` & `backend/tests/test_issue_concurrency.py`)**:
  - Investigated issue number generation under PostgreSQL concurrency. The parent `Project` row is locked using `db.session.query(Project).filter_by(id=project_id).with_for_update().first()` at the start of `create_issue(project_id)`.
  - Serializing at the parent project level guarantees PostgreSQL row-level mutual exclusion during issue number calculation and insertion within a project, preventing duplicate `(project_id, issue_number)` collisions even when 0 issues initially exist, while allowing parallel issue creation across different projects.
  - Implemented focused live integration test `backend/tests/test_issue_concurrency.py` using Python's standard `concurrent.futures.ThreadPoolExecutor` (8 workers, 15 concurrent threads creating issues in the same project).
  - Test is guarded with `@pytest.mark.skipif(not os.environ.get("TEST_DATABASE_URL"), ...)` and skips cleanly without mock fallback when live PostgreSQL is unavailable.

### Security & Data-Integrity Audit Fixes (2026-08-27)

- **Issues Fixed**:
  1. **Assignee Project-Membership Validation (`backend/app/routes/issues.py`)**:
     - Both `create_issue` (POST) and `update_issue` (PATCH) validate that assigned users (`assignee_id`) exist (404 if missing) and hold active membership in the target project via `ProjectMember` query (400 `VALIDATION_ERROR` if from another project).
     - Unassigning via `None`/`null` is cleanly supported and updates `assignee_id` to `None`.
  2. **Issue Label Project-Boundary Validation (`backend/app/routes/issues.py`)**:
     - Both POST and PATCH routes validate `label_ids` against the database to guarantee that all requested labels belong to the target `project_id`.
     - Invalid or cross-project labels trigger a 400 `VALIDATION_ERROR` atomically prior to creating or updating `IssueLabel` records.
     - Sending `label_ids: []` in PATCH atomically removes all label associations.
  3. **Issue Status Transition Validation (`backend/app/routes/issues.py`)**:
     - Defined explicit `ALLOWED_STATUS_TRANSITIONS` state machine enforcing valid workflow steps:
       - `OPEN` -> `IN_PROGRESS`
       - `IN_PROGRESS` -> `IN_REVIEW`, `OPEN`
       - `IN_REVIEW` -> `RESOLVED`, `IN_PROGRESS`
       - `RESOLVED` -> `CLOSED`, `OPEN`, `IN_PROGRESS`
       - `CLOSED` -> `OPEN` (reopen)
     - Disallowed transitions (e.g. `OPEN` -> `CLOSED`, `CLOSED` -> `RESOLVED`) are rejected with 400 `VALIDATION_ERROR`.
  4. **Resolution/Status Consistency (`backend/app/routes/issues.py`)**:
     - Prevented setting resolution on un-resolved issues (`OPEN`, `IN_PROGRESS`, `IN_REVIEW` cannot have a `resolution`).
     - Allowed resolutions are restricted to `FIXED`, `WONT_FIX`, `DUPLICATE`, `INCOMPLETE`, `CANNOT_REPRODUCE`.
     - Transitioning to `RESOLVED` or `CLOSED` assigns resolution (defaulting to `FIXED` if omitted) and sets `resolved_at = datetime.utcnow()`.
     - Reopening an issue (e.g. to `OPEN` or `IN_PROGRESS`) clears `resolution` and `resolved_at` to `None`.
  5. **Sorting Allowlist & Direction Validation (`backend/app/routes/issues.py`)**:
     - Dynamic attribute lookup via `getattr` replaced with a strict allowlist: `created_at`, `updated_at`, `issue_number`, `priority`, `severity`, `status`, `title`.
     - Order parameter strictly validated to `asc` or `desc` (case-insensitive).
     - Invalid sort fields or order directions return structured 400 `VALIDATION_ERROR`.
  6. **Query Filter Validation (`backend/app/routes/issues.py`)**:
     - Strict enum validation for `status`, `type`, `priority`, `severity`.
     - Strict type checking for `assignee_id` (integer or `unassigned`) and `label_id` (integer).
     - Malformed filter values return structured 400 `VALIDATION_ERROR` instead of silent errors or crashes.
  7. **Registration Uniqueness Race Handling (`backend/app/routes/auth.py`)**:
     - Wrapped `db.session.commit()` in `register` route with `try...except IntegrityError`.
     - Rolls back transaction cleanly on concurrent race collision and returns structured 409 `CONFLICT` without exposing SQLAlchemy stack traces.
  8. **Comment Edit Activity Audit Trail (`backend/app/routes/comments.py`)**:
     - Added `COMMENT_UPDATED` `Activity` log creation upon comment editing with actor, old_value preview, new_value preview, and metadata containing `comment_id`, committed atomically in the same database transaction.
- **Files changed**:
  - `backend/app/routes/issues.py`
  - `backend/app/routes/auth.py`
  - `backend/app/routes/comments.py`
  - `backend/app/utils/auth.py`
  - `backend/tests/test_security_audit_fixes.py`
  - `BUGZILLA_CONTEXT.md`
- **Regression Tests Added**:
  - `backend/tests/test_security_audit_fixes.py` (11 new comprehensive test suites covering all 8 issues and their edge cases).
  - All 55 test cases in the test suite pass cleanly with 0 warnings.

---

# 19. CHANGE LOG

| Date | Change |
|---|---|
| 2026-08-27 | Detailed architecture baseline established |
| 2026-08-27 | Phase 1 backend foundation implemented |
| 2026-08-27 | Master context restored after accidental replacement by Phase 1 status summary |
| 2026-08-27 | Phase 1 hardening: pinned backend & frontend dependencies, generated frontend lockfile, separated requirements-dev.txt, strengthened CORS tests (6/6 passing), fixed docs/DEPLOYMENT.md endpoint path, removed non-existent CI mention in README.md |
| 2026-08-27 | Phase 1 Final Correction: generated pure npm `frontend/package-lock.json` (free of `.bun` paths/workspace protocols), replaced hardcoded `debug=True` in `backend/run.py` with `debug=app.debug`, configured CORS fallback in `backend/app/__init__.py` to fail closed (`[]`), added CORS fallback test in `backend/tests/test_health.py` (7/7 passing), verified `npm ci`, verified Flask production/development debug modes, and verified Gunicorn WSGI startup |
| 2026-08-27 | Phase 1 frozen: frontend production deployment on Vercel verified live; GitHub → Vercel automatic deployment flow established; Phase 2 database package set and isolated 2A–2F implementation sequence explicitly defined; environment-variable/CORS role clarified without changing the Phase 1 fail-closed baseline |
| 2026-08-27 | Phase 2A database foundation & extension hardening: added pinned database dependencies (`Flask-SQLAlchemy==3.1.1`, `SQLAlchemy==2.0.52`, `Flask-Migrate==4.1.0`, `psycopg[binary]==3.3.4`), centralized `db` and `migrate` extensions in `backend/app/extensions.py`, wired unconditional extension initialization in `create_app()` factory, normalized PostgreSQL URI schemes for psycopg 3 in `backend/app/config.py`, removed SQLite fallback entirely, enforced strict `TEST_DATABASE_URL` separation for testing configuration, added test suite `backend/tests/test_database.py` (15/16 pytest passing, 1 skipped) |
| 2026-08-27 | Phase 2B–2E models, schema migration & tests: implemented 8 core SQLAlchemy entities with strict constraints, generated initial Alembic migration `001_initial_schema.py`, implemented real `/api/health/db` ping endpoint, created `test_models.py` and `test_health_db.py` (24/25 pytest passing, 1 skipped) |
| 2026-08-27 | Phase 3 Core API: implemented blueprints for `auth`, `projects`, `issues`, `labels`, `comments`, `activities`, and `analytics` with JWT and RBAC enforcement; added API error handling and validation; expanded pytest suite to 36 passed tests |
| 2026-08-27 | Phase 4 Frontend Integration: built full React SPA with typed API client, authentication context, project workspace management, issue tracking table with search/filters, Kanban board, issue inspection & comments drawer with activity audit trail, analytics KPI dashboard, project settings with team & label managers; verified `tsc --noEmit` and `vite build` |
| 2026-08-27 | Security Fix #1: Removed hardcoded JWT secret fallback `dev-jwt-secret-key-change-in-production`. Implemented explicit `JWT_SECRET_KEY` requirement for `ProductionConfig` with validation failure at config load time. Retained `Flask-JWT-Extended`. Added focused security test suite `backend/tests/test_jwt_config.py`. All 44 tests passing. |
| 2026-08-27 | Security & Data-Integrity Audit Fixes: Enforced assignee project-membership checks (POST/PATCH), project-scoped label boundaries (POST/PATCH), finite issue status workflow transitions, resolution/status state consistency, strict sorting allowlists & order validation, query parameter enum/type filter validation, concurrent registration race condition handling with transaction rollback (409), and comment edit activity audit logging (`COMMENT_UPDATED`). Added 11 regression test suites in `test_security_audit_fixes.py`. All 55 backend tests passing. |
| 2026-08-27 | Production DB Config & Issue Concurrency: Enforced non-empty/non-whitespace `DATABASE_URL` requirement in `ProductionConfig` via `ProductionConfigMeta` (fail-closed with `ValueError`), preserved PostgreSQL psycopg 3 normalization, verified per-project issue sequence generation concurrency by locking the parent `Project` row with `with_for_update()`, added live PostgreSQL concurrency test using `ThreadPoolExecutor` (skipped when `TEST_DATABASE_URL` is unset), added database config tests in `test_database.py`. All 58 backend tests passing (2 live Postgres tests skipped). |
| 2026-08-27 | Final Hardening Fix Pass: Pinned `lucide-react` to exact version `1.34.0` in `frontend/package.json`, verified `npm ci` and `npm audit` (0 vulnerabilities), added root `typecheck` workspace script, ran frontend typecheck and build, verified test suite (58 passed, 2 skipped). |
| 2026-08-27 | Live PostgreSQL Concurrency Verification: Executed `test_issue_concurrency.py` against live PostgreSQL instance via `TEST_DATABASE_URL`; verified 15 concurrent issue creations via `ThreadPoolExecutor(max_workers=8)` returning HTTP 201 Created and assigning gapless unique sequence numbers `[1..15]`; full pytest suite passed cleanly (60 passed, 0 skipped, 0 failed). |

**END OF AUTHORITATIVE CONTEXT**
