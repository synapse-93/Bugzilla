from datetime import timedelta
from unittest.mock import MagicMock, patch
import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.config import Config, DevelopmentConfig, ProductionConfig, TestingConfig
from app.models.user import User


def test_production_config_with_explicit_secret_succeeds(monkeypatch):
    """Verify ProductionConfig successfully loads when JWT_SECRET_KEY is provided."""
    test_secret = "test-only-jwt-secret-for-pytest"
    monkeypatch.setenv("JWT_SECRET_KEY", test_secret)
    monkeypatch.setenv("DATABASE_URL", "postgresql://produser:prodpass@localhost:5432/proddb")

    # Class-level access
    assert ProductionConfig.JWT_SECRET_KEY == test_secret

    # App factory configuration loading
    app = create_app("production")
    assert app.config["JWT_SECRET_KEY"] == test_secret
    assert app.config["TESTING"] is False
    assert app.config["DEBUG"] is False


def test_production_config_without_secret_fails(monkeypatch):
    """Verify ProductionConfig fails loudly when JWT_SECRET_KEY is missing."""
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)

    with pytest.raises(ValueError) as exc_info:
        _ = ProductionConfig.JWT_SECRET_KEY
    assert "JWT_SECRET_KEY environment variable is required in production configuration." in str(exc_info.value)

    with pytest.raises(ValueError) as exc_info:
        create_app("production")
    assert "JWT_SECRET_KEY environment variable is required in production configuration." in str(exc_info.value)


def test_production_config_with_empty_or_whitespace_secret_fails(monkeypatch):
    """Verify ProductionConfig rejects empty or whitespace-only JWT_SECRET_KEY."""
    monkeypatch.setenv("JWT_SECRET_KEY", "   ")

    with pytest.raises(ValueError) as exc_info:
        _ = ProductionConfig.JWT_SECRET_KEY
    assert "JWT_SECRET_KEY environment variable is required in production configuration." in str(exc_info.value)


def test_known_insecure_default_secret_string_not_in_active_config():
    """Verify the known insecure default string does not exist in any config class."""
    insecure_default = "dev-jwt-secret-key-change-in-production"

    # Base Config
    assert not hasattr(Config, "JWT_SECRET_KEY")

    # DevelopmentConfig
    assert getattr(DevelopmentConfig, "JWT_SECRET_KEY", None) != insecure_default

    # TestingConfig
    assert getattr(TestingConfig, "JWT_SECRET_KEY", None) != insecure_default


def test_jwt_token_creation_and_verification_with_explicit_secret(monkeypatch):
    """Verify JWT token can be created and verified using the configured secret."""
    test_secret = "test-only-jwt-secret-for-pytest-32bytes"
    monkeypatch.setenv("JWT_SECRET_KEY", test_secret)

    app = create_app("testing")
    client = app.test_client()

    with app.app_context():
        token = create_access_token(identity="123")
        assert isinstance(token, str)
        assert len(token) > 20

    # Protected endpoint access with valid token
    mock_user = MagicMock()
    mock_user.id = 123
    mock_user.email = "test@example.com"
    mock_user.username = "testuser"
    mock_user.display_name = "Test User"
    mock_user.to_dict.return_value = {
        "id": 123,
        "email": "test@example.com",
        "username": "testuser",
        "display_name": "Test User",
        "created_at": "2026-01-01T00:00:00",
    }

    with patch("app.routes.auth.get_current_user", return_value=mock_user):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["user"]["id"] == 123
        assert data["user"]["email"] == "test@example.com"


def test_jwt_invalid_token_returns_structured_401():
    """Verify invalid token format or tampered signature returns structured 401."""
    app = create_app("testing")
    client = app.test_client()

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid.malformed.token"},
    )
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data
    assert data["error"]["code"] == "INVALID_TOKEN"


def test_jwt_missing_token_returns_structured_401():
    """Verify missing Authorization header returns structured 401."""
    app = create_app("testing")
    client = app.test_client()

    response = client.get("/api/auth/me")
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_jwt_expired_token_returns_structured_401():
    """Verify expired JWT token returns structured 401 TOKEN_EXPIRED."""
    app = create_app("testing")
    client = app.test_client()

    with app.app_context():
        # Create token that is already expired
        expired_token = create_access_token(
            identity="user-123",
            expires_delta=timedelta(seconds=-1),
        )

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data
    assert data["error"]["code"] == "TOKEN_EXPIRED"
