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


def test_real_oauth_and_complete_registration_flow(client, monkeypatch):
    import os
    from flask_jwt_extended import create_access_token
    from datetime import timedelta

    # 1. Test OAuth Initiate endpoints with and without config
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-google-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-google-client-secret")
    monkeypatch.setenv("GITHUB_CLIENT_ID", "test-github-client-id")
    monkeypatch.setenv("GITHUB_CLIENT_SECRET", "test-github-client-secret")

    g_init = client.get("/api/auth/google?json=1")
    assert g_init.status_code == 200
    assert "accounts.google.com" in g_init.get_json()["url"]
    assert "client_id=test-google-client-id" in g_init.get_json()["url"]

    gh_init = client.get("/api/auth/github?json=1")
    assert gh_init.status_code == 200
    assert "github.com/login/oauth/authorize" in gh_init.get_json()["url"]
    assert "client_id=test-github-client-id" in gh_init.get_json()["url"]

    # 2. Test Google Callback for NEW user (mock exchange_google_code)
    def mock_google_exchange(code, redirect_uri, client_id, client_secret):
        return {
            "email": "new.google.user@example.com",
            "name": "Google User",
            "picture": "https://lh3.googleusercontent.com/photo.jpg",
            "sub": "google-123456",
        }

    monkeypatch.setattr("app.routes.auth.exchange_google_code", mock_google_exchange)

    g_cb = client.get("/api/auth/google/callback?code=mock-code")
    assert g_cb.status_code == 302
    redirect_loc = g_cb.headers["Location"]
    assert redirect_loc.startswith("https://bugzilla-frontend.vercel.app/#oauth_pending=")
    assert "oauth_pending=" in redirect_loc
    assert "provider=GOOGLE" in redirect_loc

    # Extract pending token from redirect location
    import urllib.parse
    hash_part = redirect_loc.split("#")[1]
    params = dict(urllib.parse.parse_qsl(hash_part))
    pending_token = params["oauth_pending"]
    assert pending_token is not None

    # 3. Complete Registration with chosen unique username
    comp_res = client.post("/api/auth/oauth/complete-registration", json={
        "pending_token": pending_token,
        "username": "googler_dev",
    })
    assert comp_res.status_code == 201
    comp_data = comp_res.get_json()
    assert comp_data["user"]["username"] == "googler_dev"
    assert comp_data["user"]["email"] == "new.google.user@example.com"
    assert comp_data["user"]["auth_provider"] == "GOOGLE"
    assert comp_data["user"]["is_email_verified"] is True
    assert "access_token" in comp_data

    # 4. Subsequent Google OAuth Callback for EXISTING user -> signs in immediately
    g_cb2 = client.get("/api/auth/google/callback?code=mock-code")
    assert g_cb2.status_code == 302
    loc2 = g_cb2.headers["Location"]
    assert loc2.startswith("https://bugzilla-frontend.vercel.app/#auth_token=")
    assert "auth_token=" in loc2
    assert "oauth_pending=" not in loc2

    # 5. Test GitHub Callback for NEW user
    def mock_github_exchange(code, redirect_uri, client_id, client_secret):
        return {
            "login": "octo_developer",
            "name": "Octo Dev",
            "email": "octo@github.com",
            "avatar_url": "https://avatars.githubusercontent.com/u/123",
            "html_url": "https://github.com/octo_developer",
        }

    monkeypatch.setattr("app.routes.auth.exchange_github_code", mock_github_exchange)

    gh_cb = client.get("/api/auth/github/callback?code=mock-gh-code")
    assert gh_cb.status_code == 302
    gh_loc = gh_cb.headers["Location"]
    assert gh_loc.startswith("https://bugzilla-frontend.vercel.app/#oauth_pending=")
    assert "oauth_pending=" in gh_loc
    assert "provider=GITHUB" in gh_loc

    gh_params = dict(urllib.parse.parse_qsl(gh_loc.split("#")[1]))
    gh_pending_token = gh_params["oauth_pending"]

    # Duplicate username check
    dup_res = client.post("/api/auth/oauth/complete-registration", json={
        "pending_token": gh_pending_token,
        "username": "googler_dev",  # already used
    })
    assert dup_res.status_code == 409

    # Complete GitHub registration with unique username
    gh_comp = client.post("/api/auth/oauth/complete-registration", json={
        "pending_token": gh_pending_token,
        "username": "octo_dev_unique",
    })
    assert gh_comp.status_code == 201
    assert gh_comp.get_json()["user"]["username"] == "octo_dev_unique"
    assert gh_comp.get_json()["user"]["auth_provider"] == "GITHUB"

    # 6. Test Dynamic Preview Origin via State
    from app.routes.auth import build_oauth_state
    custom_preview = "https://bugzilla-frontend-qav3ksdrb-idealab-2062.vercel.app"
    preview_state = build_oauth_state(custom_preview)
    gh_preview_cb = client.get(f"/api/auth/github/callback?code=mock-gh-code&state={preview_state}")
    assert gh_preview_cb.status_code == 302
    assert gh_preview_cb.headers["Location"].startswith(f"{custom_preview}/#auth_token=")

    # 7. Test Logout
    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200


def test_comment_posting_and_editing_with_body_or_content_fields(client):
    # Setup owner & project & issue
    reg = client.post("/api/auth/register", json={"username": "commenter1", "email": "comm1@test.com", "password": "Password123!"})
    token = reg.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    proj = client.post("/api/projects", json={"name": "Comment Proj", "key": "COMM"}, headers=headers)
    project_id = proj.get_json()["project"]["id"]

    issue_res = client.post(f"/api/projects/{project_id}/issues", json={"title": "Fix comment bug"}, headers=headers)
    issue_id = issue_res.get_json()["issue"]["id"]

    # Post comment using {"content": "..."} payload (as sent from frontend)
    c1 = client.post(f"/api/projects/{project_id}/issues/{issue_id}/comments", json={
        "content": "This is a comment sent with content field",
    }, headers=headers)
    assert c1.status_code == 201
    assert c1.get_json()["comment"]["body"] == "This is a comment sent with content field"
    comment1_id = c1.get_json()["comment"]["id"]

    # Post comment using {"body": "..."} payload
    c2 = client.post(f"/api/projects/{project_id}/issues/{issue_id}/comments", json={
        "body": "This is a comment sent with body field",
    }, headers=headers)
    assert c2.status_code == 201
    assert c2.get_json()["comment"]["body"] == "This is a comment sent with body field"

    # Update comment using {"content": "..."}
    u1 = client.patch(f"/api/projects/{project_id}/issues/{issue_id}/comments/{comment1_id}", json={
        "content": "Updated comment content",
    }, headers=headers)
    assert u1.status_code == 200
    assert u1.get_json()["comment"]["body"] == "Updated comment content"

    # Verify comments list
    c_list = client.get(f"/api/projects/{project_id}/issues/{issue_id}/comments", headers=headers)
    assert c_list.status_code == 200
    assert len(c_list.get_json()["comments"]) == 2

