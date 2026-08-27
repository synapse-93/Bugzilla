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


def test_health_endpoint_cors_headers(client):
    """Test that GET /api/health includes CORS headers when requested with Origin."""
    response = client.get("/api/health", headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 200
    assert "Access-Control-Allow-Origin" in response.headers

