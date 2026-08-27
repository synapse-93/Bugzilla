from unittest.mock import patch
from sqlalchemy.exc import OperationalError
from app import create_app


def test_health_liveness_endpoint():
    """Verify /api/health returns 200 and alive status."""
    app = create_app("testing")
    client = app.test_client()
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data == {"status": "ok"}


def test_health_db_unconfigured():
    """Verify /api/health/db returns 503 when SQLALCHEMY_DATABASE_URI is not set."""
    app = create_app("testing")
    app.config["SQLALCHEMY_DATABASE_URI"] = None
    client = app.test_client()
    response = client.get("/api/health/db")
    assert response.status_code == 503
    data = response.get_json()
    assert data["status"] == "degraded"
    assert data["database"] == "unconfigured"


def test_health_db_reachable():
    """Verify /api/health/db returns 200 when database executes SELECT 1."""
    app = create_app("testing")
    app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql+psycopg://user:pass@localhost:5432/bugzilla"
    client = app.test_client()

    with patch("app.extensions.db.session.execute") as mock_execute:
        mock_result = mock_execute.return_value
        mock_result.scalar.return_value = 1

        response = client.get("/api/health/db")
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "ok"
        assert data["database"] == "reachable"


def test_health_db_failure_returns_503_without_leaking_credentials():
    """Verify /api/health/db returns 503 safe JSON on connection failure without credential leakage."""
    app = create_app("testing")
    app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql+psycopg://secretuser:secretpassword@localhost:5432/bugzilla"
    client = app.test_client()

    with patch("app.extensions.db.session.execute") as mock_execute:
        mock_execute.side_effect = OperationalError("connection failed", {}, Exception("refused"))

        response = client.get("/api/health/db")
        assert response.status_code == 503
        data = response.get_json()
        assert data["status"] == "error"
        assert data["database"] == "unavailable"
        assert "secretpassword" not in str(data)
        assert "secretuser" not in str(data)
