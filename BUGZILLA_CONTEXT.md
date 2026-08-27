# BUGZILLA — Master Project Context

> **AUTHORITATIVE BASELINE FOR THE ENTIRE PROJECT**
>
> Read this file completely before making changes. It defines the product, architecture, technology choices, data model, API design, workflows, UI structure, deployment plan, implementation phases, and AI-agent rules. After every meaningful implementation change, update the **Living Project State** section to describe what actually exists. Do not invent competing architecture without explicitly recording a justified change.

---

# 1. PROJECT IDENTITY

**Working name:** Bugzilla

**Competition:** CloneFest Mission 2 — Developer Tool Reconstruction – Bugzilla

**Reference repository:** https://github.com/bugzilla/bugzilla

**Submission deadline:** 30 August 2026, 23:59

## Mission interpretation

The reference repository is used to understand the underlying problem and developer workflows. The final product must be an **independent modern reconstruction**, not a copy of Bugzilla's existing UI/UX or source implementation.

The product should feel like a modern developer workspace rather than a legacy issue tracker.

## Competition priorities

1. Real end-to-end functionality
2. Excellent judge-facing experience
3. Reliable public deployment
4. Coherent technical architecture
5. Meaningful differentiation from the reference
6. Visual polish

Avoid spending the limited competition time on infrastructure or abstractions that do not improve one of these priorities.

---

# 2. PRODUCT DEFINITION

## Product statement

Bugzilla is a modern collaborative software issue-management workspace for development teams. It lets a team organize projects, report and triage bugs, assign work, track progress through a controlled lifecycle, discuss issues, inspect history, and understand project health through dashboards and analytics.

## Primary users

- Developers
- Maintainers/team leads
- Project administrators
- Reviewers/stakeholders

## Primary user journey

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
Move through workflow
      ↓
Resolve / close
      ↓
Dashboard + analytics reflect actual project state
```

## Product principle

The system should make the **state of software work immediately understandable**. A judge should be able to understand an issue's importance, owner, current state, history and next action without hunting through screens.

---

# 3. FEATURE SCOPE

## Tier 1 — Must work

These are the features that form the complete demonstration:

- User registration/login
- Authentication persistence
- Project creation
- Project membership
- Project switching
- Issue creation
- Issue editing
- Issue deletion
- Issue identifier generation
- Issue type
- Priority
- Severity
- Status workflow
- Issue assignment
- Labels
- Issue detail view
- Comments
- Activity history
- Issue list
- Search
- Filtering
- Sorting
- Dashboard
- Kanban workflow view
- Production persistence

## Tier 2 — Strongly preferred

- Project overview
- Member management
- Recent activity
- Assigned-to-me view
- Useful issue statistics
- Analytics charts
- Overdue/workflow indicators
- Reopen resolved/closed issues
- Good loading/empty/error states
- Responsive layout

## Tier 3 — Differentiation / innovation

Implement the highest-value items that can be completed reliably:

### Smart triage

Given an issue title and description, provide useful suggestions for:

- issue type
- priority
- severity
- labels

The user must be able to review/accept suggestions. Suggestions must not silently overwrite user choices.

If implemented using deterministic logic, call it rules-based smart triage. Do not label a rules engine as AI.

### Similar issue detection

If time permits, identify likely related/duplicate issues using a practical text-similarity approach. This is a recommendation, not an automatic destructive merge.

### Workflow insights

If time permits, surface useful information such as:

- issues stuck in a status too long
- high-severity unresolved issues
- workload distribution
- resolution trends

## Explicitly cut unless time is abundant

- Real-time chat
- Complex notification infrastructure
- Email delivery system
- Microservices
- GraphQL
- WebSockets unless a compelling demo feature requires them
- Kubernetes/container orchestration beyond what deployment requires
- Elaborate permission systems beyond project roles
- Anything that adds code volume without improving the competition demo

---

# 4. COMPLETE SYSTEM ARCHITECTURE

## 4.1 High-level architecture

```text
                              ┌───────────────────┐
                              │      Browser      │
                              └─────────┬─────────┘
                                        │ HTTPS
                                        ▼
                         ┌──────────────────────────┐
                         │ Vercel                   │
                         │ React + Vite Frontend   │
                         ├──────────────────────────┤
                         │ Routing                  │
                         │ Pages                    │
                         │ Components               │
                         │ UI state                 │
                         │ API client               │
                         │ Domain types             │
                         └────────────┬─────────────┘
                                      │ JSON REST
                                      ▼
                         ┌──────────────────────────┐
                         │ Flask Backend            │
                         ├──────────────────────────┤
                         │ Routes / Blueprints      │
                         │ Authentication           │
                         │ Authorization            │
                         │ Validation               │
                         │ Business services       │
                         │ Error handling           │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │ SQLAlchemy               │
                         │ Persistence / ORM        │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │ PostgreSQL               │
                         │ Persistent application   │
                         │ data                     │
                         └──────────────────────────┘
```

## 4.2 Architectural responsibility

### Frontend

Responsible for:

- Rendering the interface
- Navigation
- User interaction
- Local UI state
- Form state
- Calling the API through the API layer
- Presenting loading/error/empty states
- Rendering server data
- Optimistic UI only where failure can be safely reconciled

The frontend is **not** the source of truth for authorization, issue state, project membership or persistence.

### API layer

Responsible for:

- HTTP communication
- Authentication headers/token handling
- Request serialization
- Response parsing
- Consistent API errors
- Keeping backend details out of UI components

### Flask backend

Responsible for:

- Authentication
- Authorization
- Validation
- Business rules
- Issue workflow enforcement
- Project membership rules
- Persistence orchestration
- Analytics queries
- Activity generation

### Service layer

Contains business logic that should not be buried inside HTTP route functions.

### SQLAlchemy

Responsible for translating application operations into database operations through the defined models and relationships.

### PostgreSQL

The persistent source of truth for users, projects, issues and collaboration data.

---

# 5. FRONTEND ARCHITECTURE

## Technology

React + Vite + TypeScript.

## Planned structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── router.tsx
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── api/
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

## Responsibilities

- `app/` — application bootstrap and routing
- `components/` — reusable UI components
- `layouts/` — shared application layouts
- `pages/` — route-level screens
- `api/` — backend communication only
- `hooks/` — reusable React behaviour
- `types/` — shared frontend/domain TypeScript types
- `lib/` — small reusable utilities

Components should not contain duplicated raw `fetch()` calls to backend endpoints. API calls belong in the API layer.

## Routing

Use `react-router-dom` when real application routes are introduced.

Planned routes:

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

Exact route names may be adjusted during implementation if the same information architecture is preserved.

## Frontend state

Start with React state/context and API responses. Do not add Redux/Zustand/etc. unless a concrete state requirement appears that justifies it.

Server data remains authoritative. Avoid duplicating the same server state across many unrelated components.

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
│   ├── schemas/
│   ├── services/
│   ├── errors/
│   └── utils/
├── tests/
├── requirements.txt
└── run.py
```

## Request flow

```text
HTTP request
    ↓
Route / Blueprint
    ↓
Authentication
    ↓
Authorization
    ↓
Input validation
    ↓
Service / business logic
    ↓
SQLAlchemy
    ↓
PostgreSQL
    ↓
Service result
    ↓
JSON response
```

Routes should stay thin. Business rules belong in services/domain logic where practical.

---

# 7. APPROVED TECHNOLOGY & PACKAGES

The following is the baseline package decision. Agents should use these rather than inventing alternatives.

## Frontend runtime/build

| Package | Purpose |
|---|---|
| `react` | UI framework |
| `react-dom` | Browser rendering |
| `vite` | Development server and production build |
| `typescript` | Static typing |
| `lucide-react` | Consistent interface icons |

## Frontend planned packages

| Package | Purpose | Add when |
|---|---|---|
| `react-router-dom` | Client-side routing | Multi-route application phase |
| `recharts` | Analytics charts | Analytics phase |

Prefer native `fetch` for HTTP. **Do not add Axios unless a concrete requirement appears.**

Do not add a state-management package unless justified.

Do not add a UI component library simply to avoid implementing basic UI components.

## Backend

| Package | Purpose |
|---|---|
| `Flask` | REST API server |
| `Flask-CORS` | Frontend/backend CORS |
| `SQLAlchemy` | ORM and persistence abstraction |
| `psycopg` | PostgreSQL driver |
| `Flask-JWT-Extended` | JWT authentication |
| `bcrypt` | Password hashing |

## Development/testing

Use the minimum tooling needed for reliable testing. `pytest` is the default backend test framework.

Additional packages may be introduced only when a real feature requires them and the context file records the reason.

## Explicit competing technologies not planned

Do not casually introduce:

- Redux / Zustand / MobX
- Axios alongside native fetch without justification
- FastAPI / Django
- MongoDB
- Prisma
- GraphQL
- Firebase/Supabase as a replacement backend
- Multiple ORM libraries
- Multiple authentication systems
- Multiple chart libraries
- Multiple UI frameworks

An architectural change is allowed if there is a real technical reason, but it must be documented before silently becoming the new architecture.

---

# 8. DATABASE ARCHITECTURE

## Database

PostgreSQL.

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

Planned fields:

- `id`
- `username`
- `email`
- `password_hash`
- `created_at`
- `updated_at`

Constraints:

- `id` primary key
- email unique
- username unique
- password never stored plaintext

## Project

Planned fields:

- `id`
- `name`
- `key`
- `description`
- `created_by`
- `created_at`
- `updated_at`

Constraints:

- project key unique
- creator references User

The project key is used for human-readable issue identifiers such as `BUG-142`.

## ProjectMember

Planned fields:

- `project_id`
- `user_id`
- `role`
- `joined_at`

Composite uniqueness:

```text
(project_id, user_id)
```

## Issue

Planned fields:

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

Project-scoped uniqueness:

```text
(project_id, issue_number)
```

Human-readable key:

```text
{project.key}-{issue.issue_number}
```

## Label

- `id`
- `project_id`
- `name`
- `created_at`

Project-scoped uniqueness on label name.

## IssueLabel

Association table:

```text
issue_id
label_id
```

Composite uniqueness prevents duplicate assignment.

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

`metadata` may store structured information needed to explain changes, such as old/new status or old/new assignee.

## Database rules

- Foreign keys must be explicit.
- Important lookup fields should be indexed.
- Issue number generation must be safe for concurrent creation at the competition's expected scale.
- Database state, not frontend state, is authoritative.

---

# 9. ROLES & AUTHORIZATION

## Project roles

### ADMIN

- Manage project settings
- Manage members
- Change member roles
- Full issue management

### MAINTAINER

- Manage issues
- Assign issues
- Change workflow state
- Manage labels
- Moderate project workflow

### DEVELOPER

- View project
- Create issues
- Edit issues where permitted
- Comment
- Work on assigned issues
- Change appropriate workflow states

### VIEWER

- Read project and issue information
- No destructive or workflow-changing operations

## Authorization principle

Authorization must be enforced on the backend. Frontend role checks are for UX only and are never the security boundary.

---

# 10. AUTHENTICATION ARCHITECTURE

Authentication uses JWT through `Flask-JWT-Extended`.

Flow:

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
Verify credentials
   ↓
Issue JWT
   ↓
Frontend stores authentication state
   ↓
Authenticated API requests
   ↓
Backend verifies JWT
   ↓
Authorization checks
   ↓
Protected operation
```

Planned endpoints:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Logout behaviour should invalidate/remove the client authentication state. Do not claim server-side token revocation unless actually implemented.

---

# 11. ISSUE DOMAIN

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

## Resolution

Examples:

```text
FIXED
DUPLICATE
WONT_FIX
CANNOT_REPRODUCE
INVALID
```

## Core transition model

```text
OPEN
  ↓
IN_PROGRESS
  ↓
IN_REVIEW
  ↓
RESOLVED
  ↓
CLOSED
```

Reopening a resolved/closed issue returns it to `OPEN` or the appropriate active state according to the implemented workflow.

The backend validates workflow transitions. The frontend must not assume a transition succeeded until the API confirms it.

---

# 12. CORE BUSINESS LOGIC

## Create project

```text
Authenticate
→ validate project data
→ verify unique project key
→ create Project
→ add creator as ADMIN
→ persist
→ return project
```

## Add project member

```text
Authenticate
→ authorize ADMIN/appropriate role
→ verify target user exists
→ verify user is not already a member
→ create ProjectMember
→ return membership
```

## Create issue

```text
Authenticate
→ verify project membership
→ validate title and required fields
→ validate optional references
→ generate next project-scoped issue number
→ create Issue
→ create Activity("issue_created")
→ persist transaction
→ return normalized issue
```

## Assign issue

```text
Authenticate
→ verify project access
→ verify target assignee belongs to project
→ update assignee
→ create Activity("issue_assigned")
→ persist
→ return updated issue
```

## Change status

```text
Authenticate
→ authorize action
→ validate requested transition
→ update status
→ set/clear resolution fields as appropriate
→ update timestamps
→ create Activity("status_changed")
→ persist
→ return updated issue
```

## Add comment

```text
Authenticate
→ verify project/issue access
→ validate non-empty body
→ create Comment
→ create Activity("comment_added")
→ persist
→ return comment
```

## Add/remove label

```text
Authenticate
→ verify project access
→ verify label belongs to project
→ update IssueLabel association
→ create Activity
→ persist
```

## Delete issue

Deletion permissions are role-controlled. The operation must remove dependent records according to the defined relationship behaviour or reject the operation cleanly. Never leave the UI claiming deletion succeeded if the backend failed.

---

# 13. ACTIVITY SYSTEM

Every meaningful issue change should create an activity event.

Examples:

```text
issue_created
issue_updated
status_changed
priority_changed
severity_changed
assignee_changed
label_added
label_removed
comment_added
resolved
closed
reopened
```

The activity timeline is derived from persisted Activity records, not hardcoded frontend history.

---

# 14. API ARCHITECTURE

Base path:

```text
/api
```

## Health

```text
GET /api/health
```

Returns JSON indicating service availability.

## Authentication

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
GET    /api/issues/:issueId
PATCH  /api/issues/:issueId
DELETE /api/issues/:issueId
PATCH  /api/issues/:issueId/status
PATCH  /api/issues/:issueId/assignee
```

## Comments

```text
GET    /api/issues/:issueId/comments
POST   /api/issues/:issueId/comments
PATCH  /api/comments/:commentId
DELETE /api/comments/:commentId
```

## Labels

```text
GET    /api/projects/:projectId/labels
POST   /api/projects/:projectId/labels
PATCH  /api/labels/:labelId
DELETE /api/labels/:labelId
POST   /api/issues/:issueId/labels/:labelId
DELETE /api/issues/:issueId/labels/:labelId
```

## Activity

```text
GET /api/issues/:issueId/activity
```

## Analytics

```text
GET /api/projects/:projectId/analytics/overview
GET /api/projects/:projectId/analytics/trends
```

Exact endpoint details may be expanded before implementation, but the overall API responsibility should remain consistent.

---

# 15. API RESPONSE & ERROR CONVENTIONS

Successful JSON responses should be predictable.

Example:

```json
{
  "data": {},
  "message": "Success"
}
```

Errors should be structured, for example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": {}
  }
}
```

Typical status codes:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

Do not leak internal stack traces into normal production API responses.

---

# 16. SEARCH, FILTERING & SORTING

Issue lists should support:

- text search
- status
- priority
- severity
- issue type
- assignee
- labels
- sorting

For real backend data, filtering/searching should be represented as API query parameters rather than downloading the entire database into the browser.

Example shape:

```text
GET /api/projects/:projectId/issues?query=login&status=OPEN&priority=HIGH&sort=updated_at&order=desc
```

Pagination can be added when needed; do not create unnecessary pagination complexity before the issue list is functional.

---

# 17. FRONTEND PRODUCT STRUCTURE

## Application shell

The main authenticated application should provide:

- project/workspace navigation
- current project context
- global search entry point if implemented
- user/account controls
- responsive sidebar/navigation
- consistent page header/content area

## Dashboard

Show information derived from actual backend data:

- total issues
- open issues
- in-progress issues
- resolved/closed issues
- critical/high severity issues
- assigned-to-me issues
- recent activity
- status distribution

## Issue list

Show at minimum:

- issue key
- title
- type
- status
- priority
- severity
- assignee
- labels
- updated time

Support search/filter/sort.

## Issue detail

Show:

- key
- title
- description
- type
- status
- priority
- severity
- assignee
- labels
- timestamps
- comments
- activity history

Core metadata should be editable without forcing unnecessary navigation.

## Create/edit issue

Required:

- title
- description where appropriate
- issue type
- priority
- severity

Optional:

- assignee
- labels

Use clear validation and explicit submission feedback.

## Kanban

Columns correspond to the issue workflow.

```text
OPEN | IN_PROGRESS | IN_REVIEW | RESOLVED | CLOSED
```

Moving an issue must eventually use the real status API and persist the change. Do not implement a drag/drop visual that only changes local state.

## Analytics

Use real backend-derived metrics and charts. No hardcoded production-looking numbers.

---

# 18. SMART TRIAGE ARCHITECTURE

The preferred implementation is deliberately simple and reliable.

```text
Issue title + description
          ↓
Triage engine
          ↓
Suggested type
Suggested priority
Suggested severity
Suggested labels
          ↓
User reviews suggestions
          ↓
User accepts/edits
          ↓
Actual issue fields saved
```

Possible implementation options, chosen based on available time:

1. Deterministic rules based on keywords/severity signals.
2. Lightweight similarity/classification logic using existing data.
3. External model/API only if it can be integrated and deployed reliably within the competition timeframe.

Do not add a model/API merely to put "AI" on the UI.

---

# 19. ANALYTICS ARCHITECTURE

Analytics must originate from actual stored issue data.

```text
PostgreSQL
    ↓
Analytics service/query
    ↓
Flask endpoint
    ↓
JSON
    ↓
Frontend chart/cards
```

Examples:

- issues by status
- issues by priority
- issues by severity
- issues resolved over time
- workload by assignee
- average resolution time if timestamps are sufficient

Do not fabricate numbers.

---

# 20. DEPLOYMENT ARCHITECTURE

## Current verified layer

```text
GitHub
   ↓
Vercel
   ↓
React/Vite frontend
```

This is already working and should be treated as a known-good foundation.

## Final architecture

```text
                         GitHub
                       /        \
                      /          \
                     ▼            ▼
                Vercel       Backend Host
                Frontend          │
                     │            │
                     └── HTTPS ───┘
                                  │
                                  ▼
                              PostgreSQL
```

Frontend and backend are independently deployable.

## Deployment progression

```text
Frontend foundation             VERIFIED
        ↓
Backend /health                 VERIFY
        ↓
Frontend → Backend              VERIFY
        ↓
Database persistence            VERIFY
        ↓
Authentication                  VERIFY
        ↓
Core product                    VERIFY
        ↓
Final production workflow       VERIFY
```

Deployment is not a final-day activity.

---

# 21. ENVIRONMENT VARIABLES

Only variables actually consumed by the application should exist.

## Frontend

```text
VITE_API_URL
```

## Backend

```text
DATABASE_URL
JWT_SECRET
CORS_ORIGINS
```

If an additional variable is introduced, document its purpose and actual consumer in the Living Project State.

Environment variables are tracked primarily to prevent deployment/runtime failures and hidden dependencies.

---

# 22. TESTING STRATEGY

## Backend unit tests

Test business rules such as:

- valid/invalid status transitions
- project membership
- permission checks
- validation
- issue number generation
- triage logic where applicable

## API integration tests

Test:

- authentication
- project creation
- issue CRUD
- comments
- status transitions
- authorization failures
- persistence

## End-to-end demonstration test

```text
Register/login
→ create/open project
→ create issue
→ inspect issue
→ assign issue
→ comment
→ change status
→ resolve/close
→ refresh
→ verify persistence
→ dashboard reflects state
```

## Production verification

After each major deployment:

- open public frontend
- verify build loads
- verify API connection
- execute the relevant feature flow
- verify persistence when applicable

---

# 23. IMPLEMENTATION PHASES

The order is designed to minimize deployment/debugging risk.

## Phase 0 — Deployment foundation

**STATUS: COMPLETE / VERIFIED**

Minimal React/Vite application deployed on Vercel.

## Phase 1 — Backend foundation

Create:

- Flask application
- clean application factory/config structure
- CORS
- `/api/health`
- production startup
- minimal dependency set

**No product/database/auth features yet.**

Definition of done:

- local backend starts
- `/api/health` works
- backend deploys independently
- deployed health endpoint works
- Vercel frontend remains functional

## Phase 2 — Frontend ↔ backend

Create API client abstraction and connect the existing frontend to the backend health endpoint.

Definition of done:

- frontend can reach production backend
- connection failure is visible
- no hardcoded fake health status

## Phase 3 — Database foundation

Add PostgreSQL and SQLAlchemy.

Create base models/migrations/schema strategy and verify production DB connectivity.

Definition of done:

- backend can connect to production database
- a real persisted record can be created/read
- deployment works

## Phase 4 — Authentication + authorization

Implement users, password hashing, JWT, login/register/me and project-level authorization foundations.

Definition of done:

- register
- login
- authenticated request
- protected endpoint
- role check
- production persistence

## Phase 5 — Projects + memberships

Implement project CRUD, membership and roles.

Definition of done:

- create project
- project list
- project selection
- member management
- permission enforcement

## Phase 6 — Core issue system

Implement issue model, CRUD, identifiers, assignment, workflow, priority, severity and type.

Definition of done:

- create
- read
- update
- delete
- assign
- status transition
- persistence
- activity generation

## Phase 7 — Collaboration

Implement comments, labels and activity timeline.

Definition of done:

- comment persists
- labels persist
- activity accurately reflects changes

## Phase 8 — Main product UX

Implement:

- dashboard
- issue list
- issue detail
- create/edit UI
- Kanban
- search/filter/sort

Definition of done:

The primary judge workflow works completely through the deployed UI.

## Phase 9 — Analytics

Implement real-data analytics and useful project health views.

## Phase 10 — Differentiation

Implement smart triage and/or similar high-value innovation that can be completed reliably.

## Phase 11 — Final integration

- responsive testing
- error states
- empty states
- performance sanity checks
- production end-to-end workflow
- demo data
- README
- final submission checks

---

# 24. PHASE RULES

Each phase follows:

```text
Plan
 ↓
Implement
 ↓
Test locally
 ↓
Commit
 ↓
Audit repository
 ↓
Deploy
 ↓
Verify production
 ↓
Update context
 ↓
Next phase
```

Do not stack several unverified phases together.

The codebase can be restructured when necessary. Do not preserve bad architecture merely because it existed in an earlier phase.

---

# 25. AI CODING AGENT RULES

Before every task:

1. Read this file completely.
2. Read the relevant existing source files.
3. Understand the current Living Project State.
4. Follow the approved architecture and packages.
5. Implement the requested phase/task.

## Do not generate fake progress

Never:

- create UI that pretends a backend feature exists
- hardcode analytics and label them live
- use mock data as hidden production data
- make a button that only logs to console
- return empty placeholder arrays from "implemented" services
- import an AI SDK without actually using it
- create a service abstraction whose implementation is only a placeholder
- swallow API errors and show success
- claim persistence when using only local component state/localStorage
- implement authorization only in the frontend

## Dependency discipline

Use the approved packages. If a new package is genuinely required:

1. Use it only for the actual requirement.
2. Do not add a competing package.
3. Record it in the Living Project State.

## Scope discipline

Work on the current phase. Do not spend implementation time on cosmetic work unrelated to the current objective when core functionality is incomplete.

However, if the existing architecture genuinely prevents the requested feature from being implemented correctly, restructure it properly rather than adding a temporary hack.

## Truthfulness

The context file must describe **actual implemented state**, not plans disguised as completed work.

---

# 26. CONTEXT FILE MAINTENANCE

AI Studio owns the ongoing maintenance of this file.

After every meaningful implementation change, update the Living Project State with:

- current phase
- completed features
- packages actually installed
- package purpose
- files/areas changed
- API endpoints implemented
- database tables implemented
- environment variables actually required
- tests performed
- deployment status
- known issues
- next task
- important architecture changes

Do not erase the baseline architecture merely because the implementation is currently incomplete.

If an architecture decision changes, record:

```text
Original decision
New decision
Reason
Affected areas
Date/change
```

---

# 27. LIVING PROJECT STATE

> **AI STUDIO MUST UPDATE THIS SECTION AFTER EVERY MEANINGFUL CHANGE.**

## Current phase

Phase 0 — Deployment foundation complete. Phase 1 is next.

## Completed

- Minimal React/Vite frontend
- Vercel deployment foundation

## Packages actually used

To be populated/verified from the repository by AI Studio.

## Implemented API endpoints

To be populated as implemented.

## Implemented database tables

To be populated as implemented.

## Implemented features

To be populated as implemented.

## Deployment status

Frontend: **VERIFIED WORKING on Vercel**.
Backend: **NOT DEPLOYED**.
Database: **NOT CONNECTED**.

## Tests performed

To be updated after each implementation phase.

## Known issues

To be updated from actual repository/testing state.

## Next task

**Phase 1 — Backend foundation.**

---

# 28. CHANGE LOG

| Date | Change | Reason |
|---|---|---|
| 2026-08-27 | Master project architecture baseline created | Establish complete technical direction before implementation |

---

# 29. FINAL DEFINITION OF DONE

Bugzilla is ready for submission only when:

- the public frontend works
- the backend works in production
- the frontend communicates with the production backend
- real PostgreSQL persistence works
- authentication works
- project/member workflow works
- issue CRUD works
- issue lifecycle works
- comments/labels/activity work
- dashboard uses real data
- Kanban changes persist
- search/filtering works
- analytics use real data
- at least one meaningful differentiating feature works
- the primary judge workflow can be demonstrated from the public deployment
- there are no major fake/placeholder features disguised as complete functionality
- the README and project explanation match the actual implementation

**The final standard is a smaller amount of genuinely working software over a larger amount of impressive-looking but unreliable AI-generated code.**
