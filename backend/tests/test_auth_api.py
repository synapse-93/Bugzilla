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


def test_auth_cors_options_preflight_no_redirect(monkeypatch):
    """Verify OPTIONS /api/auth/register returns 200 with CORS headers and no redirect."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-only-jwt-secret-for-pytest")
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb")
    app = create_app("production")
    client = app.test_client()

    response = client.options(
        "/api/auth/register",
        headers={
            "Origin": "https://bugzilla-foundation.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == "https://bugzilla-foundation.vercel.app"
    assert "Location" not in response.headers


def test_auth_cors_options_login_preflight_no_redirect(monkeypatch):
    """Verify OPTIONS /api/auth/login returns 200 with CORS headers and no redirect."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-only-jwt-secret-for-pytest")
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb")
    app = create_app("production")
    client = app.test_client()

    response = client.options(
        "/api/auth/login",
        headers={
            "Origin": "https://bugzilla-foundation.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == "https://bugzilla-foundation.vercel.app"
    assert "Location" not in response.headers


def test_auth_trailing_slash_no_redirect(monkeypatch):
    """Verify routes with trailing slashes do not issue 301/308 redirects."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-only-jwt-secret-for-pytest")
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb")
    app = create_app("production")
    client = app.test_client()

    response = client.options(
        "/api/auth/register/",
        headers={
            "Origin": "https://bugzilla-foundation.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == 200
    assert "Location" not in response.headers


def test_production_cors_methods_and_headers(monkeypatch):
    """Verify production CORS configuration explicitly allows required methods, headers, and no wildcard."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-only-jwt-secret-for-pytest")
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb")
    app = create_app("production")
    client = app.test_client()

    prod_origin = "https://bugzilla-foundation.vercel.app"
    response = client.options(
        "/api/auth/login",
        headers={
            "Origin": prod_origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type,Authorization",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == prod_origin
    assert response.headers.get("Access-Control-Allow-Origin") != "*"
    assert response.headers.get("Access-Control-Allow-Credentials") == "true"
    
    allow_methods = response.headers.get("Access-Control-Allow-Methods", "")
    for method in ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]:
        assert method in allow_methods

    # Unapproved origin test
    unauth_resp = client.options(
        "/api/auth/login",
        headers={
            "Origin": "https://malicious-site.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert "Access-Control-Allow-Origin" not in unauth_resp.headers


