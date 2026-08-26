# Bugzilla

Modern developer issue tracking platform inspired by the core workflows of Bugzilla.

## Mission 2 scaffold

This repository is structured for a rapid, production-oriented build:

- `frontend/` — modern web application and developer workspace UI
- `backend/` — API, authentication, issue workflow, collaboration, and analytics
- `docs/` — architecture, workflow, and deployment notes
- `.github/` — CI checks

## Planned core workflow

Project → Issue → Assignment → Comment → Status changes → Resolution → Analytics

## Development

See the component READMEs in `frontend/` and `backend/` for local setup instructions.

## Deployment principle

The application is intended to be deployed from the beginning. Production environment variables, health checks, CORS, and database connectivity should be verified before feature work is considered complete.
