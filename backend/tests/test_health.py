import pytest
from app import create_app
from app.config import TestingConfig


@pytest.fixture
def app():
    """Create testing application instance."""
    app = create_app(TestingConfig)
    return app


@pytest.fixture
def client(app):
    """Create test client for request execution."""
    return app.test_client()


def test_app_factory_creates_app(app):
    """Test that application factory creates Flask application successfully."""
    assert app is not None
    assert app.config["TESTING"] is True


def test_health_endpoint_status_code(client):
    """Test that GET /api/health returns HTTP 200."""
    response = client.get("/api/health")
    assert response.status_code == 200


def test_health_endpoint_is_json(client):
    """Test that GET /api/health returns JSON response."""
    response = client.get("/api/health")
    assert response.is_json


def test_health_endpoint_payload(client):
    """Test that GET /api/health returns status ok."""
    response = client.get("/api/health")
    data = response.get_json()
    assert data is not None
    assert data.get("status") == "ok"


def test_health_endpoint_cors_approved_origin(client):
    """Test that GET /api/health returns exact CORS header for approved origin."""
    response = client.get("/api/health", headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"
    assert response.is_json
    data = response.get_json()
    assert data == {"status": "ok"}


def test_health_endpoint_cors_unapproved_origin(client):
    """Test that GET /api/health does not grant CORS headers to unapproved origins."""
    response = client.get("/api/health", headers={"Origin": "http://unauthorized-origin.com"})
    assert response.status_code == 200
    assert "Access-Control-Allow-Origin" not in response.headers
    assert response.is_json
    data = response.get_json()
    assert data == {"status": "ok"}

