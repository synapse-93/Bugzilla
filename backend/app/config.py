from datetime import timedelta
import os


def normalize_database_url(url: str | None) -> str | None:
    """Normalize database URL for SQLAlchemy with psycopg 3 driver."""
    if not url:
        return None
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


class Config:
    """Base configuration."""
    TESTING = False
    DEBUG = False

    # Configurable CORS origins for the frontend
    CORS_ORIGINS_RAW = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000",
    )
    CORS_ORIGINS = [
        origin.strip()
        for origin in CORS_ORIGINS_RAW.split(",")
        if origin.strip()
    ]

    # Database configuration
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = normalize_database_url(
        os.environ.get("DATABASE_URL")
    )

    # JWT Authentication configuration
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = normalize_database_url(
        os.environ.get("DATABASE_URL")
    )
    JWT_SECRET_KEY = os.environ.get(
        "JWT_SECRET_KEY",
        "dev-local-development-jwt-secret-not-for-production"
    )


class ProductionConfigMeta(type):
    """Metaclass ensuring JWT_SECRET_KEY is explicitly defined in environment for production."""
    def __dir__(cls):
        return super().__dir__() + ["JWT_SECRET_KEY"]

    @property
    def JWT_SECRET_KEY(cls):
        secret = os.environ.get("JWT_SECRET_KEY", "").strip()
        if not secret:
            raise ValueError(
                "JWT_SECRET_KEY environment variable is required in production configuration."
            )
        return secret


class ProductionConfig(Config, metaclass=ProductionConfigMeta):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = normalize_database_url(
        os.environ.get("DATABASE_URL")
    )

    def __dir__(self):
        return super().__dir__() + ["JWT_SECRET_KEY"]

    def __getattr__(self, name):
        if name == "JWT_SECRET_KEY":
            return self.__class__.JWT_SECRET_KEY
        raise AttributeError(f"{self.__class__.__name__} object has no attribute {name}")


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
    SQLALCHEMY_DATABASE_URI = normalize_database_url(
        os.environ.get("TEST_DATABASE_URL")
    )
    JWT_SECRET_KEY = "test-only-jwt-secret-for-pytest-32bytes"


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    # A missing/unknown environment must never silently enable debug mode.
    "default": ProductionConfig,
}
