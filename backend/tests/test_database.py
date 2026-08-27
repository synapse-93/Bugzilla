import os
import pytest
from sqlalchemy import text
from app import create_app
from app.config import (
    Config,
    DevelopmentConfig,
    ProductionConfig,
    TestingConfig,
    normalize_database_url,
)
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
    if uri is not None:
        assert uri.startswith("postgresql+psycopg://")
        assert "sqlite" not in uri.lower()
    else:
        assert uri is None


def test_production_config_with_explicit_database_url_succeeds(monkeypatch):
    """Verify ProductionConfig successfully loads and normalizes when DATABASE_URL is provided."""
    test_db_url = "postgres://testuser:testpass@localhost:5432/testdb"
    monkeypatch.setenv("DATABASE_URL", test_db_url)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-only-jwt-secret-for-pytest")

    # Class-level access normalizes postgres:// to postgresql+psycopg://
    expected_uri = "postgresql+psycopg://testuser:testpass@localhost:5432/testdb"
    assert ProductionConfig.SQLALCHEMY_DATABASE_URI == expected_uri

    # App factory configuration loading
    app = create_app("production")
    assert app.config["SQLALCHEMY_DATABASE_URI"] == expected_uri
    assert app.config["TESTING"] is False
    assert app.config["DEBUG"] is False


def test_production_config_without_database_url_fails(monkeypatch):
    """Verify ProductionConfig fails loudly when DATABASE_URL is missing."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-only-jwt-secret-for-pytest")

    with pytest.raises(ValueError) as exc_info:
        _ = ProductionConfig.SQLALCHEMY_DATABASE_URI
    assert "DATABASE_URL environment variable is required in production configuration." in str(exc_info.value)

    with pytest.raises(ValueError) as exc_info:
        create_app("production")
    assert "DATABASE_URL environment variable is required in production configuration." in str(exc_info.value)


def test_production_config_with_whitespace_database_url_fails(monkeypatch):
    """Verify ProductionConfig rejects empty or whitespace-only DATABASE_URL."""
    monkeypatch.setenv("DATABASE_URL", "   ")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-only-jwt-secret-for-pytest")

    with pytest.raises(ValueError) as exc_info:
        _ = ProductionConfig.SQLALCHEMY_DATABASE_URI
    assert "DATABASE_URL environment variable is required in production configuration." in str(exc_info.value)

    with pytest.raises(ValueError) as exc_info:
        create_app("production")
    assert "DATABASE_URL environment variable is required in production configuration." in str(exc_info.value)


def test_app_factory_development_constructible():
    """Verify create_app('development') constructs with DEBUG=True, TESTING=False."""
    app = create_app("development")
    assert app.config["DEBUG"] is True
    assert app.config["TESTING"] is False
    assert "sqlalchemy" in app.extensions


def test_app_factory_development_with_database_url(monkeypatch):
    """Verify DevelopmentConfig normalizes DATABASE_URL when supplied."""
    monkeypatch.setenv("DATABASE_URL", "postgres://devuser:devpass@localhost:5432/devdb")
    app = create_app("development")
    assert app.config["SQLALCHEMY_DATABASE_URI"] == "postgresql+psycopg://devuser:devpass@localhost:5432/devdb"


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
