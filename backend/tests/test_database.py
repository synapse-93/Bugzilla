import os
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


def test_database_extensions_registered_in_app_factory():
    """Test that SQLAlchemy and Migrate extensions are registered in the app factory."""
    app = create_app("testing")
    assert "sqlalchemy" in app.extensions
    assert "migrate" in app.extensions


def test_testing_config_uses_test_database_url_without_sqlite_or_prod_fallback():
    """Test that TestingConfig is isolated to TEST_DATABASE_URL without SQLite or prod fallback."""
    uri = TestingConfig.SQLALCHEMY_DATABASE_URI
    assert uri is not None
    assert uri.startswith("postgresql+psycopg://")
    assert "sqlite" not in uri.lower()


@pytest.mark.skipif(
    not os.environ.get("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL not set; skipping live PostgreSQL integration test",
)
def test_postgres_live_connection_if_configured():
    """Execute a real query against PostgreSQL only if TEST_DATABASE_URL is provided."""
    app = create_app("testing")
    with app.app_context():
        result = db.session.execute(text("SELECT 1")).scalar()
        assert result == 1
