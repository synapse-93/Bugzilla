from unittest.mock import patch
from app import create_app
from app.models.user import User


def test_auth_register_validation_failure():
    """Verify registration fails with structured 400 when missing fields or invalid email."""
    app = create_app("testing")
    client = app.test_client()

    response = client.post("/api/auth/register", json={
        "username": "ab",  # too short
        "email": "invalid-email",
        "password": "123",  # too short
    })
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "username" in data["error"]["details"]
    assert "email" in data["error"]["details"]
    assert "password" in data["error"]["details"]


def test_auth_login_validation_failure():
    """Verify login fails with 400 when missing credentials."""
    app = create_app("testing")
    client = app.test_client()

    response = client.post("/api/auth/login", json={})
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_auth_me_unauthorized():
    """Verify /api/auth/me returns 401 when no token is provided."""
    app = create_app("testing")
    client = app.test_client()

    response = client.get("/api/auth/me")
    assert response.status_code == 401
    data = response.get_json()
    assert data["error"]["code"] == "UNAUTHORIZED"
