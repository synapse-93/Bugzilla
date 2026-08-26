# Architecture

## Product model

Bugzilla is a modern developer issue-management platform. It extracts the essential workflow of legacy bug trackers while using a contemporary workspace-oriented experience.

## Core entities

```text
User
 ├── Project membership
 ├── Assigned issues
 └── Comments

Project
 ├── Issues
 ├── Labels
 └── Members

Issue
 ├── Assignee
 ├── Labels
 ├── Comments
 └── Activity history
```

## Core workflow

```text
OPEN → IN_PROGRESS → IN_REVIEW → RESOLVED → CLOSED
```

## Application flow

```text
Browser
  ↓
Frontend
  ↓ HTTPS
Backend API
  ↓
Database
```

The frontend must never depend on an unavailable local backend in production.

## Day 1 vertical slice

Login → Project → Create Issue → Assign → Comment → Change Status → Resolve

This flow must work against the deployed environment before secondary features are considered complete.
