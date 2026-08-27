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


class DevelopmentConfigMeta(type):
    """Metaclass for dynamic environment variable resolution in development."""
    def __dir__(cls):
        return super().__dir__() + ["SQLALCHEMY_DATABASE_URI", "JWT_SECRET_KEY"]

    @property
    def SQLALCHEMY_DATABASE_URI(cls):
        if "SQLALCHEMY_DATABASE_URI" in cls.__dict__:
            return cls.__dict__["SQLALCHEMY_DATABASE_URI"]
        return normalize_database_url(os.environ.get("DATABASE_URL"))

    @property
    def JWT_SECRET_KEY(cls):
        if "JWT_SECRET_KEY" in cls.__dict__:
            return cls.__dict__["JWT_SECRET_KEY"]
        return os.environ.get(
            "JWT_SECRET_KEY",
            "dev-local-development-jwt-secret-not-for-production"
        )


class DevelopmentConfig(Config, metaclass=DevelopmentConfigMeta):
    """Development configuration."""
    DEBUG = True

    def __dir__(self):
        return super().__dir__() + ["SQLALCHEMY_DATABASE_URI", "JWT_SECRET_KEY"]

    def __getattr__(self, name):
        if name in ("SQLALCHEMY_DATABASE_URI", "JWT_SECRET_KEY"):
            return getattr(self.__class__, name)
        raise AttributeError(f"{self.__class__.__name__} object has no attribute {name}")


class ProductionConfigMeta(type):
    """Metaclass ensuring JWT_SECRET_KEY and DATABASE_URL are explicitly defined in environment for production."""
    def __dir__(cls):
        return super().__dir__() + ["JWT_SECRET_KEY", "SQLALCHEMY_DATABASE_URI"]

    @property
    def JWT_SECRET_KEY(cls):
        if "JWT_SECRET_KEY" in cls.__dict__:
            secret = str(cls.__dict__["JWT_SECRET_KEY"]).strip()
        else:
            secret = os.environ.get("JWT_SECRET_KEY", "").strip()
        if not secret:
            raise ValueError(
                "JWT_SECRET_KEY environment variable is required in production configuration."
            )
        return secret

    @property
    def SQLALCHEMY_DATABASE_URI(cls):
        if "SQLALCHEMY_DATABASE_URI" in cls.__dict__:
            raw_url = str(cls.__dict__["SQLALCHEMY_DATABASE_URI"]).strip()
        else:
            raw_url = os.environ.get("DATABASE_URL", "").strip()
        if not raw_url:
            raise ValueError(
                "DATABASE_URL environment variable is required in production configuration."
            )
        return normalize_database_url(raw_url)


class ProductionConfig(Config, metaclass=ProductionConfigMeta):
    """Production configuration."""
    DEBUG = False

    def __dir__(self):
        return super().__dir__() + ["JWT_SECRET_KEY", "SQLALCHEMY_DATABASE_URI"]

    def __getattr__(self, name):
        if name in ("JWT_SECRET_KEY", "SQLALCHEMY_DATABASE_URI"):
            return getattr(self.__class__, name)
        raise AttributeError(f"{self.__class__.__name__} object has no attribute {name}")


class TestingConfigMeta(type):
    """Metaclass for dynamic environment variable resolution in testing."""
    def __dir__(cls):
        return super().__dir__() + ["SQLALCHEMY_DATABASE_URI"]

    @property
    def SQLALCHEMY_DATABASE_URI(cls):
        if "SQLALCHEMY_DATABASE_URI" in cls.__dict__:
            return cls.__dict__["SQLALCHEMY_DATABASE_URI"]
        return normalize_database_url(os.environ.get("TEST_DATABASE_URL"))


class TestingConfig(Config, metaclass=TestingConfigMeta):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
    JWT_SECRET_KEY = "test-only-jwt-secret-for-pytest-32bytes"

    def __dir__(self):
        return super().__dir__() + ["SQLALCHEMY_DATABASE_URI"]

    def __getattr__(self, name):
        if name == "SQLALCHEMY_DATABASE_URI":
            return getattr(self.__class__, name)
        raise AttributeError(f"{self.__class__.__name__} object has no attribute {name}")


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    # A missing/unknown environment must never silently enable debug mode.
    "default": ProductionConfig,
}
