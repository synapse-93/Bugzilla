import pytest
from app import create_app
from app.config import TestingConfig
from app.extensions import db
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.issue import Issue
from app.models.milestone import Milestone
from app.models.invitation import Invitation
from app.models.notification import Notification
from app.models.issue_relationship import IssueRelationship


class InMemoryTestingConfig(TestingConfig):
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


@pytest.fixture
def app():
    app = create_app(InMemoryTestingConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def test_guest_auth_and_profile_flow(client):
    # 1. Guest register
    res = client.post("/api/auth/guest", json={"username": "guestuser1", "password": "GuestPassword123"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["username"] == "guestuser1"
    assert data["user"]["auth_provider"] == "GUEST"
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Update Profile & Open to Work
    prof_res = client.patch("/api/auth/profile", json={
        "display_name": "Guest One",
        "bio": "Open source contributor",
        "skills": ["React", "Python", "Flask"],
        "github_url": "https://github.com/guestone",
        "is_open_to_work": True,
    }, headers=headers)
    assert prof_res.status_code == 200
    prof_data = prof_res.get_json()["user"]
    assert prof_data["display_name"] == "Guest One"
    assert prof_data["is_open_to_work"] is True
    assert "React" in prof_data["skills"]

    # 3. Open Collaborator Discovery
    disc_res = client.get("/api/users/collaborators?skill=React", headers=headers)
    assert disc_res.status_code == 200
    collaborators = disc_res.get_json()["collaborators"]
    assert len(collaborators) >= 1
    assert any(c["username"] == "guestuser1" for c in collaborators)


def test_password_recovery_and_email_verification_flow(client):
    # 1. Register email user
    res = client.post("/api/auth/register", json={
        "username": "emailuser",
        "email": "user@example.com",
        "password": "Password123!",
    })
    assert res.status_code == 201
    user_data = res.get_json()["user"]
    assert user_data["is_email_verified"] is False

    # 2. Forgot password request
    forgot_res = client.post("/api/auth/forgot-password", json={"email": "user@example.com"})
    assert forgot_res.status_code == 200

    # 3. Retrieve user from db to test reset token
    user = User.query.filter_by(email="user@example.com").first()
    assert user.reset_password_token is not None

    # 4. Reset password
    reset_res = client.post("/api/auth/reset-password", json={
        "token": user.reset_password_token,
        "password": "NewSecretPassword123!",
    })
    assert reset_res.status_code == 200

    # 5. Login with new password
    login_res = client.post("/api/auth/login", json={
        "email": "user@example.com",
        "password": "NewSecretPassword123!",
    })
    assert login_res.status_code == 200


def test_project_key_canonical_suffix_and_invitation_flow(client):
    # Register Owner
    reg1 = client.post("/api/auth/register", json={"username": "owner1", "email": "owner1@test.com", "password": "Password123!"})
    token1 = reg1.get_json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Register Collaborator
    reg2 = client.post("/api/auth/register", json={"username": "collab1", "email": "collab1@test.com", "password": "Password123!"})
    token2 = reg2.get_json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Owner 1 creates project with key "TEST"
    p1 = client.post("/api/projects", json={"name": "Alpha Project", "key": "TEST"}, headers=headers1)
    assert p1.status_code == 201
    proj1_data = p1.get_json()["project"]
    assert proj1_data["key"] == "TEST"
    assert proj1_data["display_key"] == "TEST"
    project_id = proj1_data["id"]

    # Another user also creates project with key "TEST" -> server generates canonical unique suffix (e.g. TEST-xx)
    p2 = client.post("/api/projects", json={"name": "Beta Project", "key": "TEST"}, headers=headers2)
    assert p2.status_code == 201
    proj2_data = p2.get_json()["project"]
    assert proj2_data["key"].startswith("TEST-")
    assert proj2_data["display_key"] == "TEST"

    # Owner 1 invites Collaborator to Alpha Project
    invite_res = client.post(f"/api/projects/{project_id}/invitations", json={
        "username": "collab1",
        "role": "DEVELOPER",
    }, headers=headers1)
    assert invite_res.status_code == 201
    invite_id = invite_res.get_json()["invitation"]["id"]

    # Collaborator sees pending invitation and in-app notification
    my_invites = client.get("/api/invitations/my", headers=headers2)
    assert my_invites.status_code == 200
    assert len(my_invites.get_json()["invitations"]) == 1

    my_notifs = client.get("/api/notifications", headers=headers2)
    assert my_notifs.status_code == 200
    assert my_notifs.get_json()["unread_count"] >= 1

    # Collaborator accepts invitation
    accept_res = client.post(f"/api/invitations/{invite_id}/accept", headers=headers2)
    assert accept_res.status_code == 200

    # Verify Collaborator is now a Project Member
    members_res = client.get(f"/api/projects/{project_id}/members", headers=headers1)
    assert members_res.status_code == 200
    member_usernames = [m["user"]["username"] for m in members_res.get_json()["members"]]
    assert "collab1" in member_usernames


def test_milestones_and_issue_relationships(client):
    # Setup owner & project
    reg = client.post("/api/auth/register", json={"username": "mowner", "email": "mowner@test.com", "password": "Password123!"})
    headers = {"Authorization": f"Bearer {reg.get_json()['access_token']}"}

    proj = client.post("/api/projects", json={"name": "Milestone Proj", "key": "MILE"}, headers=headers)
    project_id = proj.get_json()["project"]["id"]

    # Create Milestone
    m_res = client.post(f"/api/projects/{project_id}/milestones", json={
        "name": "v1.0 Launch",
        "description": "Initial stable release",
    }, headers=headers)
    assert m_res.status_code == 201
    milestone_id = m_res.get_json()["milestone"]["id"]

    # Create two issues
    i1_res = client.post(f"/api/projects/{project_id}/issues", json={"title": "Setup DB schema"}, headers=headers)
    i2_res = client.post(f"/api/projects/{project_id}/issues", json={"title": "Build Auth API"}, headers=headers)
    i1_id = i1_res.get_json()["issue"]["id"]
    i2_id = i2_res.get_json()["issue"]["id"]

    # Link issues via Issue Relationship (BLOCKS)
    rel_res = client.post(f"/api/projects/{project_id}/issues/{i1_id}/relationships", json={
        "target_issue_id": i2_id,
        "relationship_type": "BLOCKS",
    }, headers=headers)
    assert rel_res.status_code == 201
    assert rel_res.get_json()["relationship"]["relationship_type"] == "BLOCKS"

    # List relationships
    rel_list = client.get(f"/api/projects/{project_id}/issues/{i1_id}/relationships", headers=headers)
    assert rel_list.status_code == 200
    assert len(rel_list.get_json()["relationships"]) == 1
