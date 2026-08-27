import pytest
from app import create_app
from app.extensions import db
from app.models import (
    User,
    Project,
    ProjectMember,
    Issue,
    Label,
    IssueLabel,
    Comment,
    Activity,
)


def test_user_model_metadata():
    """Verify User model column properties, uniqueness, and password methods."""
    user = User(username="testuser", email="test@example.com")
    user.set_password("SecurePassword123!")
    assert user.password_hash != "SecurePassword123!"
    assert user.check_password("SecurePassword123!") is True
    assert user.check_password("WrongPassword") is False

    data = user.to_dict(include_email=True)
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "password_hash" not in data

    data_no_email = user.to_dict(include_email=False)
    assert "email" not in data_no_email


def test_project_model_metadata():
    """Verify Project model fields and serialization."""
    project = Project(
        name="Bugzilla Redux",
        key="BUG",
        description="A modern issue tracker",
        created_by=1,
    )
    data = project.to_dict()
    assert data["name"] == "Bugzilla Redux"
    assert data["key"] == "BUG"
    assert data["description"] == "A modern issue tracker"
    assert data["created_by"] == 1


def test_project_member_model_metadata():
    """Verify ProjectMember model roles and constraints."""
    pm = ProjectMember(project_id=1, user_id=2, role="MAINTAINER")
    data = pm.to_dict()
    assert data["project_id"] == 1
    assert data["user_id"] == 2
    assert data["role"] == "MAINTAINER"

    # Unique constraint verification
    constraints = [c.name for c in pm.__table__.constraints if hasattr(c, "columns")]
    assert "uq_project_member" in constraints


def test_issue_model_metadata():
    """Verify Issue model identifier formatting and constraints."""
    project = Project(name="Bugzilla", key="BUG")
    issue = Issue(
        project=project,
        project_id=1,
        issue_number=42,
        title="Crash on null pointer",
        description="Stack trace attached",
        issue_type="BUG",
        status="OPEN",
        priority="HIGH",
        severity="CRITICAL",
    )
    assert issue.identifier == "BUG-42"
    data = issue.to_dict()
    assert data["identifier"] == "BUG-42"
    assert data["issue_number"] == 42
    assert data["title"] == "Crash on null pointer"
    assert data["status"] == "OPEN"
    assert data["priority"] == "HIGH"
    assert data["severity"] == "CRITICAL"

    constraints = [c.name for c in issue.__table__.constraints if hasattr(c, "columns")]
    assert "uq_project_issue_number" in constraints


def test_label_and_issue_label_metadata():
    """Verify Label and IssueLabel model constraints."""
    label = Label(project_id=1, name="backend", color="#3b82f6")
    data = label.to_dict()
    assert data["name"] == "backend"
    assert data["color"] == "#3b82f6"

    label_constraints = [c.name for c in label.__table__.constraints if hasattr(c, "columns")]
    assert "uq_project_label_name" in label_constraints

    il = IssueLabel(issue_id=1, label_id=2)
    il_constraints = [c.name for c in il.__table__.constraints if hasattr(c, "columns")]
    assert "uq_issue_label" in il_constraints


def test_comment_model_metadata():
    """Verify Comment model fields and serialization."""
    comment = Comment(
        issue_id=1,
        author_id=2,
        body="Fixed in commit abc1234",
    )
    data = comment.to_dict()
    assert data["issue_id"] == 1
    assert data["author_id"] == 2
    assert data["body"] == "Fixed in commit abc1234"


def test_activity_model_metadata():
    """Verify Activity model metadata serialization and parsing."""
    activity = Activity(
        issue_id=1,
        actor_id=2,
        action_type="STATUS_CHANGED",
        old_value="OPEN",
        new_value="RESOLVED",
    )
    activity.set_metadata({"resolution": "FIXED", "reason": "Merged PR"})
    assert activity.get_metadata() == {"resolution": "FIXED", "reason": "Merged PR"}

    data = activity.to_dict()
    assert data["action_type"] == "STATUS_CHANGED"
    assert data["old_value"] == "OPEN"
    assert data["new_value"] == "RESOLVED"
    assert data["metadata"] == {"resolution": "FIXED", "reason": "Merged PR"}


def test_all_tables_registered_in_sqlalchemy_metadata():
    """Verify all 8 entity tables and relationships are properly registered."""
    app = create_app("testing")
    with app.app_context():
        expected_tables = {
            "users",
            "projects",
            "project_members",
            "issues",
            "labels",
            "issue_labels",
            "comments",
            "activities",
        }
        actual_tables = set(db.metadata.tables.keys())
        assert expected_tables.issubset(actual_tables)
