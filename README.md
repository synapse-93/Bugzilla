# Kaizen

> **"Issue tracking, refined."**

Kaizen is a focused, developer-first issue tracking workspace built around the real engineering workflow: capture issues, prioritize them, move work through a Kanban pipeline, collaborate with teammates, and understand project progress from one place.

The project combines a polished React frontend with an authoritative Flask REST API and PostgreSQL-backed persistence. The interface is intentionally minimal and technical rather than overloaded with generic SaaS decoration.

---

## 1. What Kaizen Provides

Kaizen brings the core parts of day-to-day software issue management into one workspace:

- **Project Workspaces** — Create and manage projects with canonical issue keys, roles, labels, and milestones.
- **Issue Management** — Create, edit, assign, prioritize, label, search, filter, sort, and transition issues through their lifecycle.
- **Kanban Workflow** — Move issues through `OPEN`, `IN_PROGRESS`, `IN_REVIEW`, `RESOLVED`, and `CLOSED` stages with drag-and-drop workflow management.
- **Issue Details & Collaboration** — Rich issue details, Markdown descriptions, comments, attachments, activity history, and issue relationships such as `BLOCKS`, `BLOCKED_BY`, `RELATED`, and `DUPLICATE`.
- **Milestones & Sprints** — Track larger development goals with progress, completion ratios, and deadline/overdue indicators.
- **Dashboard & Analytics** — Project KPIs, workflow distribution, severity breakdowns, resolution rate, recent activity, and analytics views.
- **Developer Collaboration** — Discover developers by skills, manage invitations, team membership, roles, and developer profiles.
- **Notifications & Activity** — Keep track of changes, comments, invitations, and other project activity inside the application.
- **Command Palette & Keyboard-first UX** — `Ctrl+K` / `⌘K`, `/`, `C`, and `Escape` shortcuts for fast navigation and actions.

---

## 2. Architecture

Kaizen uses a clear separation between the frontend presentation layer and the authoritative backend:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                              KAIZEN UI                                  │
│  React • TypeScript • Vite • Tailwind CSS • Radix UI • Lucide Icons    │
│                                                                         │
│  Landing → Authentication → Dashboard → Issues → Kanban → Analytics   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     │ REST /api/*
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           KAIZEN BACKEND                                │
│  Flask • SQLAlchemy • PostgreSQL • Alembic • JWT • OAuth              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Backend

- Python / Flask REST API
- SQLAlchemy ORM
- PostgreSQL persistence
- Alembic migrations
- JWT-based authentication/session handling
- OAuth integrations
- CORS validation

### Frontend

- React + TypeScript
- Vite
- Tailwind CSS
- Radix UI primitives
- Recharts for analytics
- `@dnd-kit` for Kanban interactions
- Responsive layout for desktop, tablet, and mobile

The frontend communicates with the existing Flask API rather than replacing the backend with a mock or hosted database layer.

---

## 3. Authentication

Kaizen currently supports:

- **GitHub OAuth** — OAuth-based GitHub authentication with verified identity mapping and GitHub profile information.
- **Email & Password** — Traditional account authentication with secure password handling.
- **Guest Sandbox** — Instant guest access for evaluation/testing without creating a normal account.
- **Password Recovery** — Password reset workflow through the existing backend authentication flow.
- **OAuth Username Onboarding** — New OAuth users complete their Kaizen username setup before entering the application.

### OAuth identity handling

GitHub identities are resolved using stable provider identity information rather than relying on the user's chosen Kaizen username. GitHub-linked profiles can also automatically receive their GitHub profile URL and avatar when available.

Google OAuth is **not part of the current Kaizen authentication UI**.

---

## 4. Frontend Experience

Kaizen uses one visual system across the entire product instead of treating the landing page, authentication, and application as unrelated designs.

### Landing page

The landing page is a single long-scroll editorial experience introducing the product through:

- restrained abstract geometric artwork
- scroll-driven transitions
- product capabilities
- workflow storytelling
- subtle technical visual motifs
- minimal calls to action

The design deliberately avoids generic SaaS marketing patterns, fake social proof, unnecessary illustrations, and excessive visual effects.

### Authentication

The login/signup experience inherits the same Kaizen visual language with a quieter presentation focused on the authentication form and subtle abstract geometry.

### Application workspace

The authenticated application uses the same:

- near-black/graphite foundation
- white and muted-gray typography
- restrained indigo accent
- subtle 1px borders
- technical metadata styling
- spacing and component hierarchy
- restrained motion language

The UI becomes denser inside the workspace because information density and productivity matter more there.

---

## 5. Responsive Design

The frontend is designed to reflow rather than simply shrink across screen sizes.

Validated target sizes include:

- **393 × 873 px** mobile
- **768 px** tablet
- **1280 px** desktop
- larger desktop resolutions

Responsive behavior includes:

- mobile navigation drawer
- reflowed dashboard layouts
- internally scrollable tables/boards where necessary
- responsive dialogs/modals
- adaptive analytics layouts
- zero unintended horizontal page overflow

---

## 6. Reliability & UX Details

The frontend has been audited for common production issues such as stale user state, duplicate submissions, missing loading states, and inconsistent project context.

Important behavior includes:

- user-scoped state is cleared during logout/account switching
- switching accounts rebuilds the authenticated workspace so previous-user state does not remain visible
- switching projects clears stale issue/modal/filter context
- mutation controls prevent duplicate submissions during active requests
- API failures surface concise user-facing errors
- loading states use local controls/skeletons where appropriate
- empty states provide useful next actions instead of unexplained blank regions
- authentication form state is reset appropriately and passwords are not persisted in browser storage

---

## 7. Local Development

### Prerequisites

- Node.js 18+
- npm
- Python 3.10+
- PostgreSQL for normal deployment/development (SQLite can be used for local testing where configured)

### Backend

```bash
cd backend
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
python run.py
```

Backend development server:

```text
http://127.0.0.1:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend development server:

```text
http://localhost:3000
```

The development setup proxies `/api` requests to the Flask backend.

---

## 8. Verification

The current project is verified with:

```bash
# Frontend typecheck
npm run typecheck --workspace=frontend

# Frontend production build
npm run build --workspace=frontend

# Backend tests
pytest -v backend/tests
```

Latest verification results during the final frontend QA pass:

- **Frontend typecheck:** 0 errors
- **Frontend production build:** passed
- **Backend test suite:** 75 passed, 2 skipped

---

## 9. Design Philosophy

Kaizen is designed as a focused engineering workspace rather than a generic SaaS template.

The visual direction is intentionally restrained:

- **Near-black / graphite foundation**
- **White and muted-gray typography**
- **One restrained indigo accent**
- **Thin borders and deliberate spacing**
- **Technical/editorial details without visual clutter**
- **Subtle motion instead of flashy animation**
- **Abstract geometry used as a recurring visual motif**
- **Responsive layouts designed for real use**

The principle is simple:

> **Make the interface feel fast, clear, and intentional — without adding visual noise for its own sake.**

---

## 10. Project Status

Kaizen is a functional full-stack issue tracking application with a real Flask backend, persistent database model, authentication flows, project/issue management, collaboration features, responsive frontend, and production-oriented UI polish.
