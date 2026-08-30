# Kaizen

> **"Issue tracking, refined."**

Kaizen is a fast, minimalist, engineering-grade issue tracker and project management platform built for modern software teams. Inspired by the depth of classic bug tracking systems and modernized into a focused, low-latency developer workstation.

---

## 1. Core Architecture

Kaizen is architected as an authoritative REST API backend coupled with a responsive, zero-latency React client:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Kaizen Client                                 │
│  React 18 • TypeScript • Vite • Radix UI • Tailwind CSS • Lucide Icons  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Typed REST Client (/api/*)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Kaizen Backend                                │
│   Flask 3.x • SQLAlchemy • PostgreSQL • Alembic • JWT • Authlib (OAuth) │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Backend**: Python / Flask REST API with PostgreSQL persistence, strict CORS validation, JWT session security, and OAuth provider integrations.
- **Frontend**: Single-page application built with React, TypeScript, and Vite, using a unified design system with compact typography, 1px borders, and restrained dark themes.

---

## 2. Key Features

- **Project Workspaces**: Multi-project tenancy with canonical keys (e.g. `KZ-101`), team roles (`ADMIN`, `DEVELOPER`, `REPORTER`), custom labels, and milestone iterations.
- **Engineering Command Center**: Dashboard featuring real-time KPI metrics, issue resolution rate, status distribution, severity breakdown, and live project activity audit trail.
- **Issue Management**: Filterable table with multi-criteria search (status, priority, severity, assignee, label), custom presets, and inline sorting.
- **Kanban Workflow**: Drag-and-drop board powered by `@dnd-kit` with optimistic updates, rollback safeguards, and quick status progression triggers.
- **Milestones & Sprints**: Milestone tracking with progress bars, issue completion ratios, and overdue date indicators.
- **Issue Detail & Audit Trail**: Full issue editor with markdown descriptions, comment feeds with editing/deletion, relationship graphs (`BLOCKS`, `BLOCKED_BY`, `RELATED`, `DUPLICATE`), and file attachments.
- **Collaborator Discovery**: In-app talent network allowing teams to discover open-to-work developers by skills and invite them to projects.
- **In-App Project Invitations**: Controlled modal for accepting or declining team invitations with zero external redirects.
- **Developer Profile**: Public developer profiles with bio, skill tags, portfolio links, and an "Open to Collaborate" toggle.
- **Command Palette & Keyboard First**: Global `Ctrl+K` / `⌘K` or `/` quick actions, `C` for new issue, and Escape to dismiss overlays.

---

## 3. Authentication & Security

- **Google OAuth 2.0**: PKCE-based Google login with identity verification and automatic username reservation.
- **GitHub OAuth**: Full GitHub identity token exchange and handle mapping.
- **Email & Password**: Argon2 / bcrypt-backed secure password authentication.
- **Guest Sandbox Sessions**: Instant 1-click isolated guest sandbox access for evaluation and testing.
- **Password Recovery**: Email token-based reset and password update workflow.

---

## 4. Local Development

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+
- PostgreSQL (optional in development; SQLite supported for local testing)

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
*Backend runs on `http://127.0.0.1:5000`.*

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000` with Vite proxying `/api` requests to Flask.*

### Running Tests
```bash
# Frontend Typecheck & Build
npm run typecheck --workspace=frontend
npm run build --workspace=frontend

# Backend Test Suite
pytest -v backend/tests
```

---

## 5. Design Philosophy

Kaizen is designed as a developer workstation rather than a generic SaaS template:
- **Near-black background** with crisp 1px borders.
- **Dense information hierarchy** avoiding oversized empty cards.
- **No decorative AI-generated bloat**, glowing gradient blobs, or heavy animation libraries.
- **Subtle procedural workflow visualization** on entry illustrating the continuous cycle: `issue → triage → resolve → deploy`.
- **Full accessibility** with semantic HTML, keyboard focus rings, and strict `prefers-reduced-motion` adherence.
