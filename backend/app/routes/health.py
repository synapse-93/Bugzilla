import logging
from flask import Blueprint, jsonify, current_app
from sqlalchemy import text
from app.extensions import db

logger = logging.getLogger(__name__)
health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """Service liveness health check."""
    return jsonify({"status": "ok"}), 200


@health_bp.route("/health/db", methods=["GET"])
def database_health_check():
    """Real database connectivity check executing SELECT 1."""
    if not current_app.config.get("SQLALCHEMY_DATABASE_URI"):
        return jsonify({
            "status": "degraded",
            "database": "unconfigured",
            "message": "Database URL is not configured",
        }), 503

    try:
        # Execute real database ping
        result = db.session.execute(text("SELECT 1")).scalar()
        if result == 1:
            return jsonify({
                "status": "ok",
                "database": "reachable",
            }), 200
        return jsonify({
            "status": "error",
            "database": "unexpected_result",
        }), 500
    except Exception as exc:
        logger.error("Database health check failed: %s", exc.__class__.__name__)
        return jsonify({
            "status": "error",
            "database": "unavailable",
        }), 503
