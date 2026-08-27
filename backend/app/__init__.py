import os
from flask import Flask
from app.config import config_by_name, Config
from app.extensions import cors
from app.routes.health import health_bp


def create_app(config_name=None):
    """Application factory for Bugzilla backend."""
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "default")

    app = Flask(__name__)

    # Load configuration
    if isinstance(config_name, str):
        config_class = config_by_name.get(config_name, Config)
        app.config.from_object(config_class)
    elif config_name is not None:
        app.config.from_object(config_name)
    else:
        app.config.from_object(Config)

    # Initialize extensions
    cors_origins = app.config.get("CORS_ORIGINS", [])
    cors.init_app(app, resources={r"/api/*": {"origins": cors_origins}})

    # Register blueprints
    app.register_blueprint(health_bp, url_prefix="/api")

    return app
