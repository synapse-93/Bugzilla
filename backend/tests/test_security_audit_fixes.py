import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.issue import Issue
from app.models.label import Label, IssueLabel
from app.models.comment import Comment
from app.models.activity import Activity
from sqlalchemy.exc import IntegrityError
from unittest.mock import patch


from app.config import TestingConfig


class InMemoryTestingConfig(TestingConfig):
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


@pytest.fixture
def app_with_db():
    """Create test application with in-memory SQLite database."""
    app = create_app(InMemoryTestingConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def seed_data(app_with_db):
    """Seed test users, projects, memberships, labels, and issue."""
    with app_with_db.app_context():
        # User 1: Admin / Developer in Project 1
        user1 = User(username="alice", email="alice@example.com")
        user1.set_password("Password123!")
        db.session.add(user1)

        # User 2: Developer in Project 1
        user2 = User(username="bob", email="bob@example.com")
        user2.set_password("Password123!")
        db.session.add(user2)

        # User 3: Belongs ONLY to Project 2 (foreign user to Project 1)
        user3 = User(username="charlie", email="charlie@example.com")
        user3.set_password("Password123!")
        db.session.add(user3)

        db.session.commit()

        # Project 1
        proj1 = Project(name="Project One", key="PROJ1", created_by=user1.id)
        db.session.add(proj1)
        # Project 2
        proj2 = Project(name="Project Two", key="PROJ2", created_by=user3.id)
        db.session.add(proj2)
        db.session.commit()

        # Memberships
        pm1 = ProjectMember(project_id=proj1.id, user_id=user1.id, role="ADMIN")
        pm2 = ProjectMember(project_id=proj1.id, user_id=user2.id, role="DEVELOPER")
        pm3 = ProjectMember(project_id=proj2.id, user_id=user3.id, role="ADMIN")
        db.session.add_all([pm1, pm2, pm3])

        # Labels
        lbl_p1 = Label(project_id=proj1.id, name="Frontend", color="#3b82f6")
        lbl_p2 = Label(project_id=proj2.id, name="Backend", color="#10b981")
        db.session.add_all([lbl_p1, lbl_p2])
        db.session.commit()

        # Issue in Project 1
        issue1 = Issue(
            project_id=proj1.id,
            issue_number=1,
            title="Initial Issue",
            description="Test issue description",
            issue_type="BUG",
            status="OPEN",
            priority="MEDIUM",
            severity="MEDIUM",
            creator_id=user1.id,
        )
        db.session.add(issue1)
        db.session.commit()

        return {
            "user1_id": user1.id,
            "user2_id": user2.id,
            "user3_id": user3.id,
            "proj1_id": proj1.id,
            "proj2_id": proj2.id,
            "lbl_p1_id": lbl_p1.id,
            "lbl_p2_id": lbl_p2.id,
            "issue1_id": issue1.id,
        }


def auth_headers(app, user_id):
    """Generate JWT Authorization header."""
    with app.app_context():
        token = create_access_token(identity=str(user_id))
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


# ==========================================
# 1. ASSIGNEE PROJECT-MEMBERSHIP VALIDATION
# ==========================================

def test_assignee_validation_create_valid_member(app_with_db, seed_data):
    """Valid project member can be assigned when creating an issue."""
    client = app_with_db.test_client()
    headers = auth_headers(app_with_db, seed_data["user1_id"])

    res = client.post(
        f"/api/projects/{seed_data['proj1_id']}/issues",
        headers=headers,
        json={"title": "New Bug", "assignee_id": seed_data["user2_id"]},
    )
    assert res.status_code == 201
    assert res.get_json()["issue"]["assignee_id"] == seed_data["user2_id"]


def test_assignee_validation_create_nonexistent_user(app_with_db, seed_data):
    """Assigning a nonexistent user ID fails with 404."""
    client = app_with_db.test_client()
    headers = auth_headers(app_with_db, seed_data["user1_id"])

    res = client.post(
        f"/api/projects/{seed_data['proj1_id']}/issues",
        headers=headers,
        json={"title": "New Bug", "assignee_id": 99999},
    )
    assert res.status_code == 404
    data = res.get_json()
    assert data["error"]["code"] == "NOT_FOUND"


def test_assignee_validation_create_foreign_user_fails(app_with_db, seed_data):
    """Assigning a user from another project fails with structured 400."""
    client = app_with_db.test_client()
    headers = auth_headers(app_with_db, seed_data["user1_id"])

    res = client.post(
        f"/api/projects/{seed_data['proj1_id']}/issues",
        headers=headers,
        json={"title": "New Bug", "assignee_id": seed_data["user3_id"]},
    )
    assert res.status_code == 400
    data = res.get_json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "assignee_id" in data["error"]["details"]


def test_assignee_validation_update_membership_and_unassign(app_with_db, seed_data):
    """Assigning foreign user in PATCH fails; assigning valid member and unassigning succeeds."""
    client = app_with_db.test_client()
    headers = auth_headers(app_with_db, seed_data["user1_id"])
    issue_url = f"/api/projects/{seed_data['proj1_id']}/issues/{seed_data['issue1_id']}"

    # Foreign user assignment fails
    res = client.patch(issue_url, headers=headers, json={"assignee_id": seed_data["user3_id"]})
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "VALIDATION_ERROR"

    # Nonexistent user fails with 404
    res = client.patch(issue_url, headers=headers, json={"assignee_id": 88888})
    assert res.status_code == 404

    # Valid member succeeds
    res = client.patch(issue_url, headers=headers, json={"assignee_id": seed_data["user2_id"]})
    assert res.status_code == 200
    assert res.get_json()["issue"]["assignee_id"] == seed_data["user2_id"]

    # Unassigning with null succeeds
    res = client.patch(issue_url, headers=headers, json={"assignee_id": None})
    assert res.status_code == 200
    assert res.get_json()["issue"]["assignee_id"] is None


# ==========================================
# 2. ISSUE LABEL PROJECT-BOUNDARY VALIDATION
# ==========================================

def test_label_boundary_validation_post_and_patch(app_with_db, seed_data):
    """Ensure labels must exist and belong to the project in both POST and PATCH."""
    client = app_with_db.test_client()
    headers = auth_headers(app_with_db, seed_data["user1_id"])
    issue_url = f"/api/projects/{seed_data['proj1_id']}/issues/{seed_data['issue1_id']}"

    # POST with foreign label fails atomically
    res = client.post(
        f"/api/projects/{seed_data['proj1_id']}/issues",
        headers=headers,
        json={"title": "Label Test", "label_ids": [seed_data["lbl_p2_id"]]},
    )
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "VALIDATION_ERROR"

    # POST with mixed valid + foreign label fails atomically
    res = client.post(
        f"/api/projects/{seed_data['proj1_id']}/issues",
        headers=headers,
        json={"title": "Label Test Mixed", "label_ids": [seed_data["lbl_p1_id"], seed_data["lbl_p2_id"]]},
    )
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "VALIDATION_ERROR"

    # PATCH with nonexistent label fails atomically
    res = client.patch(issue_url, headers=headers, json={"label_ids": [9999]})
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "VALIDATION_ERROR"

    # PATCH with valid label succeeds
    res = client.patch(issue_url, headers=headers, json={"label_ids": [seed_data["lbl_p1_id"]]})
    assert res.status_code == 200
    labels = res.get_json()["issue"]["labels"]
    assert len(labels) == 1
    assert labels[0]["id"] == seed_data["lbl_p1_id"]

    # PATCH with empty list [] clears labels
    res = client.patch(issue_url, headers=headers, json={"label_ids": []})
    assert res.status_code == 200
    assert len(res.get_json()["issue"]["labels"]) == 0


# ==========================================
# 3. ISSUE STATUS TRANSITION VALIDATION
# ==========================================

def test_status_transitions_valid_and_invalid(app_with_db, seed_data):
    """Enforce allowed workflow transitions and reject arbitrary status jumps."""
    client = app_with_db.test_client()
    headers = auth_headers(app_with_db, seed_data["user1_id"])
    issue_url = f"/api/projects/{seed_data['proj1_id']}/issues/{seed_data['issue1_id']}"

    # Invalid jump: OPEN -> CLOSED must fail with 400
    res = client.patch(issue_url, headers=headers, json={"status": "CLOSED"})
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "VALIDATION_ERROR"

    # Invalid jump: OPEN -> RESOLVED must fail with 400
    res = client.patch(issue_url, headers=headers, json={"status": "RESOLVED"})
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "VALIDATION_ERROR"

    # Valid step 1: OPEN -> IN_PROGRESS
    res = client.patch(issue_url, headers=headers, json={"status": "IN_PROGRESS"})
    assert res.status_code == 200
    assert res.get_json()["issue"]["status"] == "IN_PROGRESS"

    # Valid step 2: IN_PROGRESS -> IN_REVIEW
    res = client.patch(issue_url, headers=headers, json={"status": "IN_REVIEW"})
    assert res.status_code == 200
    assert res.get_json()["issue"]["status"] == "IN_REVIEW"

    # Valid step 3: IN_REVIEW -> RESOLVED
    res = client.patch(issue_url, headers=headers, json={"status": "RESOLVED", "resolution": "FIXED"})
    assert res.status_code == 200
    assert res.get_json()["issue"]["status"] == "RESOLVED"
    assert res.get_json()["issue"]["resolution"] == "FIXED"

    # Valid step 4: RESOLVED -> CLOSED
    res = client.patch(issue_url, headers=headers, json={"status": "CLOSED"})
    assert res.status_code == 200
    assert res.get_json()["issue"]["status"] == "CLOSED"

    # Valid reopen: CLOSED -> OPEN
    res = client.patch(issue_url, headers=headers, json={"status": "OPEN"})
    assert res.status_code == 200
    assert res.get_json()["issue"]["status"] == "OPEN"
    assert res.get_json()["issue"]["resolution"] is None
    assert res.get_json()["issue"]["resolved_at"] is None


# ==========================================
# 4. RESOLUTION/STATUS CONSISTENCY
# ==========================================

def test_resolution_status_consistency(app_with_db, seed_data):
    """Resolution cannot be set on open issues and is cleared upon reopening."""
    client = app_with_db.test_client()
    headers = auth_headers(app_with_db, seed_data["user1_id"])
    issue_url = f"/api/projects/{seed_data['proj1_id']}/issues/{seed_data['issue1_id']}"

    # Setting resolution on OPEN issue is rejected
    res = client.patch(issue_url, headers=headers, json={"resolution": "FIXED"})
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "VALIDATION_ERROR"

    # Move to IN_PROGRESS, then IN_REVIEW, then RESOLVED with WONT_FIX
    client.patch(issue_url, headers=headers, json={"status": "IN_PROGRESS"})
    client.patch(issue_url, headers=headers, json={"status": "IN_REVIEW"})
    res = client.patch(issue_url, headers=headers, json={"status": "RESOLVED", "resolution": "WONT_FIX"})
    assert res.status_code == 200
    data = res.get_json()["issue"]
    assert data["status"] == "RESOLVED"
    assert data["resolution"] == "WONT_FIX"
    assert data["resolved_at"] is not None

    # Invalid resolution string is rejected
    res = client.patch(issue_url, headers=headers, json={"resolution": "NONEXISTENT_RES"})
    assert res.status_code == 400

    # Reopening to IN_PROGRESS clears resolution and resolved_at
    res = client.patch(issue_url, headers=headers, json={"status": "IN_PROGRESS"})
    assert res.status_code == 200
    data = res.get_json()["issue"]
    assert data["status"] == "IN_PROGRESS"
    assert data["resolution"] is None
    assert data["resolved_at"] is None


# ==========================================
# 5. SORTING ALLOWLIST
# ==========================================

def test_sorting_allowlist_and_order(app_with_db, seed_data):
    """Sorting allowlist rejects unauthorized attributes with 400."""
    client = app_with_db.test_client()
    headers = auth_headers(app_with_db, seed_data["user1_id"])
    base_url = f"/api/projects/{seed_data['proj1_id']}/issues"

    # Valid sorts
    for field in ["created_at", "updated_at", "issue_number", "priority", "severity", "status", "title"]:
        res = client.get(f"{base_url}?sort={field}&order=asc", headers=headers)
        assert res.status_code == 200

    # Invalid sort field returns 400
    res = client.get(f"{base_url}?sort=__class__", headers=headers)
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "VALIDATION_ERROR"

    res = client.get(f"{base_url}?sort=password_hash", headers=headers)
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "VALIDATION_ERROR"

    # Invalid order returns 400
    res = client.get(f"{base_url}?sort=created_at&order=invalid_dir", headers=headers)
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "VALIDATION_ERROR"


# ==========================================
# 6. QUERY FILTER VALIDATION
# ==========================================

def test_query_filter_validation(app_with_db, seed_data):
    """Query filters reject malformed values with structured 400."""
    client = app_with_db.test_client()
    headers = auth_headers(app_with_db, seed_data["user1_id"])
    base_url = f"/api/projects/{seed_data['proj1_id']}/issues"

    # Invalid status
    res = client.get(f"{base_url}?status=GARBAGE", headers=headers)
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "VALIDATION_ERROR"

    # Invalid type
    res = client.get(f"{base_url}?type=GARBAGE", headers=headers)
    assert res.status_code == 400

    # Invalid priority
    res = client.get(f"{base_url}?priority=ULTRA", headers=headers)
    assert res.status_code == 400

    # Invalid severity
    res = client.get(f"{base_url}?severity=INSANE", headers=headers)
    assert res.status_code == 400

    # Invalid assignee_id (non-integer and not unassigned)
    res = client.get(f"{base_url}?assignee_id=notanint", headers=headers)
    assert res.status_code == 400

    # Invalid label_id (non-integer)
    res = client.get(f"{base_url}?label_id=abc", headers=headers)
    assert res.status_code == 400

    # Valid assignee_id=unassigned succeeds
    res = client.get(f"{base_url}?assignee_id=unassigned", headers=headers)
    assert res.status_code == 200

    # Valid filter succeeds
    res = client.get(f"{base_url}?status=OPEN&priority=MEDIUM", headers=headers)
    assert res.status_code == 200


# ==========================================
# 7. REGISTRATION UNIQUENESS RACE HANDLING
# ==========================================

def test_registration_integrity_error_handling(app_with_db):
    """IntegrityError during commit triggers transaction rollback and returns structured 409."""
    client = app_with_db.test_client()

    with patch("app.routes.auth.db.session.commit", side_effect=IntegrityError("mock", "params", "orig")):
        res = client.post("/api/auth/register", json={
            "username": "uniqueuser",
            "email": "unique@example.com",
            "password": "Password123!",
        })
        assert res.status_code == 409
        data = res.get_json()
        assert data["error"]["code"] == "CONFLICT"


# ==========================================
# 8. COMMENT EDIT ACTIVITY AUDIT
# ==========================================

def test_comment_edit_activity_audit(app_with_db, seed_data):
    """Editing a comment creates a COMMENT_UPDATED activity log entry atomically."""
    client = app_with_db.test_client()
    headers1 = auth_headers(app_with_db, seed_data["user1_id"])
    headers2 = auth_headers(app_with_db, seed_data["user2_id"])
    comments_url = f"/api/projects/{seed_data['proj1_id']}/issues/{seed_data['issue1_id']}/comments"

    # 1. Post a comment as user1
    res = client.post(comments_url, headers=headers1, json={"body": "Original comment content"})
    assert res.status_code == 201
    comment_id = res.get_json()["comment"]["id"]

    # 2. Try to edit comment as user2 (not author) -> 403 Forbidden
    res = client.patch(f"{comments_url}/{comment_id}", headers=headers2, json={"body": "Hacked content"})
    assert res.status_code == 403

    # 3. Edit comment as author (user1)
    res = client.patch(f"{comments_url}/{comment_id}", headers=headers1, json={"body": "Updated comment content"})
    assert res.status_code == 200
    assert res.get_json()["comment"]["body"] == "Updated comment content"

    # 4. Verify Activities recorded in DB
    with app_with_db.app_context():
        activities = Activity.query.filter_by(issue_id=seed_data["issue1_id"]).all()
        action_types = [a.action_type for a in activities]
        assert "COMMENT_ADDED" in action_types
        assert "COMMENT_UPDATED" in action_types

        update_act = next(a for a in activities if a.action_type == "COMMENT_UPDATED")
        assert update_act.actor_id == seed_data["user1_id"]
        assert update_act.old_value == "Original comment content"
        assert update_act.new_value == "Updated comment content"
        assert update_act.get_metadata() == {"comment_id": comment_id}
