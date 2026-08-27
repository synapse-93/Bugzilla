import pytest
from sqlalchemy import text
from app import create_app
from app.config import TestingConfig, normalize_database_url
from app.extensions import db, migrate


def test_normalize_database_url_postgres_scheme():
    """Test that postgres:// URLs are converted to postgresql+psycopg://."""
    url = "postgres://user:secret@localhost:5432/bugzilla"
    normalized = normalize_database_url(url)
    assert normalized == "postgresql+psycopg://user:secret@localhost:5432/bugzilla"


def test_normalize_database_url_postgresql_scheme():
    """Test that postgresql:// URLs are converted to postgresql+psycopg://."""
    url = "postgresql://user:secret@localhost:5432/bugzilla"
    normalized = normalize_database_url(url)
    assert normalized == "postgresql+psycopg://user:secret@localhost:5432/bugzilla"


def test_normalize_database_url_already_psycopg():
    """Test that already specified postgresql+psycopg:// URLs are preserved."""
    url = "postgresql+psycopg://user:secret@localhost:5432/bugzilla"
    normalized = normalize_database_url(url)
    assert normalized == url


def test_normalize_database_url_none_or_empty():
    """Test that None or empty URLs return None."""
    assert normalize_database_url(None) is None
    assert normalize_database_url("") is None


def test_database_extensions_initialized():
    """Test that SQLAlchemy and Migrate extensions are properly bound to the app."""
    app = create_app(TestingConfig)
    with app.app_context():
        assert "sqlalchemy" in app.extensions
        assert "migrate" in app.extensions
        # Verify db engine can execute a query
        result = db.session.execute(text("SELECT 1")).scalar()
        assert result == 1


def test_app_factory_handles_no_database_uri():
    """Test that app factory initializes cleanly even without a database URI."""
    class NoDbConfig:
        TESTING = True
        SQLALCHEMY_DATABASE_URI = None

    app = create_app(NoDbConfig)
    client = app.test_client()
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}
