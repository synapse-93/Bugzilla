# Bugzilla Context & Architecture

## 1. Product Model

Bugzilla is a modern developer issue-management and tracking platform. It captures the essential workflow of traditional developer bug trackers while providing a clean, workspace-oriented developer experience.

### Core Entities
- **User**: Authentication, project membership, assigned issues, comments.
- **Project**: Issues, custom labels, team members.
- **Issue**: Title, description, type, priority, severity, status, assignee, labels, comments, activity log.
- **Comment**: Discussion messages tied to issues and users.
- **Label**: Tagging taxonomy scoped to projects/issues.
- **Activity**: Audit trail of status transitions and updates.

### Core Issue Lifecycle
```text
OPEN → IN_PROGRESS → IN_REVIEW → RESOLVED → CLOSED
```

---

## 2. Target Architecture

```text
Browser / Client (React + Vite SPA)
    ↓ HTTPS / REST
Backend API (Flask + Gunicorn)
    ↓
Database (PostgreSQL / Managed Cloud SQL)
```

---

## 3. Technology Choices

- **Frontend**: React 18, Vite, TypeScript, modern dark workspace design.
- **Backend**: Python 3.11+, Flask Application Factory pattern, Flask-CORS, Gunicorn WSGI server.
- **Testing**: pytest for backend endpoint and unit verification.
- **Database (Phase 3+)**: PostgreSQL with connection string via `DATABASE_URL`.
- **Authentication (Phase 4+)**: JWT-based session handling.

---

## 4. Phase Roadmap

- **Phase 1 (Current)**: Backend Foundation (`GET /api/health`, Application Factory, CORS, Gunicorn WSGI, pytest suite).
- **Phase 2**: Frontend/Backend API Integration & Deployment Connectivity.
- **Phase 3**: Database Foundation & Schemas (PostgreSQL, Migrations, Core Models).
- **Phase 4**: Authentication & User Management.
- **Phase 5**: Projects & Issues Core CRUD & Workflow Transitions.
- **Phase 6**: Collaboration (Comments, Assignments, Activity Timeline).
- **Phase 7**: Labels, Filtering, Kanban View & Analytics.

---

## 5. Living Project State

### Phase 1 Status
**Completed** — Backend foundation established cleanly alongside the existing frontend.

### Backend Files Created
- `backend/app/__init__.py`: Flask Application Factory (`create_app`), config loading, CORS initialization, and blueprint registration.
- `backend/app/config.py`: Environment-aware configuration classes (`Config`, `DevelopmentConfig`, `ProductionConfig`, `TestingConfig`) with configurable `CORS_ORIGINS`.
- `backend/app/extensions.py`: Centralized extension instances (`cors = CORS()`).
- `backend/app/routes/__init__.py`: Routes package initialization.
- `backend/app/routes/health.py`: Blueprint definition for `GET /api/health` returning JSON `{"status": "ok"}`.
- `backend/tests/test_health.py`: Test suite verifying factory creation, status code 200, JSON format, and status payload.
- `backend/conftest.py`: Test path configuration ensuring clean imports across test runners.
- `backend/pytest.ini`: pytest configuration specifying `pythonpath = .` and `testpaths = tests`.
- `backend/run.py`: Local development entry point using the application factory.
- `backend/Procfile`: Production process definition (`web: gunicorn "app:create_app()"`).
- `backend/requirements.txt`: Minimal Phase 1 dependencies.

### Packages Installed & Purpose
- `Flask` (3.1.3): Core HTTP server, routing, and REST API foundation.
- `Flask-CORS` (4.0.2): Cross-Origin Resource Sharing middleware for independent frontend/backend communication.
- `gunicorn` (23.0.0): Production WSGI HTTP server for production deployment.
- `pytest` (8.4.2): Test framework for automated endpoint testing.

*Note: No database or authentication packages were installed in Phase 1, adhering strictly to scope.*

### Verified Endpoints
- `GET /api/health` → HTTP 200 OK, Content-Type: `application/json`, payload: `{"status": "ok"}`.

### Verification & Testing Results
- **Automated Tests (`pytest`)**: 4 passed in 0.16s:
  - `test_app_factory_creates_app` (PASSED)
  - `test_health_endpoint_status_code` (PASSED)
  - `test_health_endpoint_is_json` (PASSED)
  - `test_health_endpoint_payload` (PASSED)
- **Local Startup Verification**: Tested `python3 backend/run.py` on local port, verified real HTTP request via curl returning 200 OK with `{"status": "ok"}` and valid CORS headers.
- **Production WSGI Startup Verification**: Tested Gunicorn via `gunicorn "app:create_app()"`, verified real HTTP request via curl returning 200 OK with `{"status": "ok"}`.
- **Frontend Build Verification**: Built frontend via `npm run build` and `tsc --noEmit` with zero errors.

### Next Phase
- **Phase 2**: Frontend/Backend API Connectivity & Integration.
