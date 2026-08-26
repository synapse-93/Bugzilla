# Bugzilla Backend

Production-oriented API for authentication, projects, issues, collaboration, workflow, and analytics.

## Core resources

- Users
- Projects
- Issues
- Comments
- Labels
- Assignments
- Activity events

## Core issue states

`OPEN` → `IN_PROGRESS` → `IN_REVIEW` → `RESOLVED` → `CLOSED`

## Deployment requirements

- Production database connection via environment variable
- Configurable CORS origin
- Health endpoint
- Secure authentication/session handling
- Input validation
- Structured error responses
- No secrets committed to the repository
