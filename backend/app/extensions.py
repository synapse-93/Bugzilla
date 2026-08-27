from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy


class SafeSQLAlchemy(SQLAlchemy):
    """SQLAlchemy extension that registers cleanly even when database URL is unset."""
    def init_app(self, app: Flask) -> None:
        if not app.config.get("SQLALCHEMY_DATABASE_URI") and not app.config.get("SQLALCHEMY_BINDS"):
            app.extensions["sqlalchemy"] = self
            app.teardown_appcontext(self._teardown_session)
            return
        super().init_app(app)


cors = CORS()
db = SafeSQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
