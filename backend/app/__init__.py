import os
from flask import Flask

try:
    # pyrefly: ignore [missing-import]
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from app.config import config_by_name, Config
from app.extensions import cors, db, migrate, jwt
from app.utils.errors import APIError, api_error
from app.routes.health import health_bp
from app.routes.auth import auth_bp
from app.routes.projects import projects_bp
from app.routes.issues import issues_bp
from app.routes.labels import labels_bp
from app.routes.comments import comments_bp
from app.routes.activities import activities_bp
from app.routes.analytics import analytics_bp
from app.routes.invitations import invitations_bp
from app.routes.notifications import notifications_bp
from app.routes.milestones import milestones_bp
from app.routes.relationships import relationships_bp
import app.models  # noqa: F401


def create_app(config_name=None):
    """Application factory for Bugzilla backend."""
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "default")

    app = Flask(__name__)
    app.url_map.strict_slashes = False

    # Load configuration
    if isinstance(config_name, str):
        config_class = config_by_name.get(config_name, Config)
        app.config.from_object(config_class)
    elif config_name is not None:
        app.config.from_object(config_name)
    else:
        app.config.from_object(Config)

    # Ensure database configuration defaults
    app.config.setdefault("SQLALCHEMY_DATABASE_URI", Config.SQLALCHEMY_DATABASE_URI)
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)

    # Initialize extensions
    cors_origins = app.config.get("CORS_ORIGINS", [])
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": cors_origins}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # JWT Error handlers returning consistent API error schema
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return api_error("TOKEN_EXPIRED", "The access token has expired", 401)

    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return api_error("INVALID_TOKEN", f"Invalid access token: {error_string}", 401)

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return api_error("UNAUTHORIZED", f"Authorization header with Bearer token is required: {error_string}", 401)

    # Global API error handler
    @app.errorhandler(APIError)
    def handle_api_error(err):
        return err.to_response()

    # Register blueprints
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(projects_bp, url_prefix="/api")
    app.register_blueprint(issues_bp, url_prefix="/api")
    app.register_blueprint(labels_bp, url_prefix="/api")
    app.register_blueprint(comments_bp, url_prefix="/api")
    app.register_blueprint(activities_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(invitations_bp, url_prefix="/api")
    app.register_blueprint(notifications_bp, url_prefix="/api")
    app.register_blueprint(milestones_bp, url_prefix="/api")
    app.register_blueprint(relationships_bp, url_prefix="/api")

    return app
