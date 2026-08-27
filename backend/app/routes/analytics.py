from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from app.extensions import db
from app.models.issue import Issue
from app.models.project import Project
from app.utils.auth import require_project_access
from app.utils.errors import api_error

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/projects/<int:project_id>/analytics/summary", methods=["GET"])
@jwt_required()
@require_project_access()
def get_analytics_summary(project_id: int):
    """Aggregate high-level metric counts for the project."""
    project = Project.query.get(project_id)
    if not project:
        return api_error("NOT_FOUND", "Project not found", 404)

    total_issues = Issue.query.filter_by(project_id=project_id).count()
    open_issues = Issue.query.filter(
        Issue.project_id == project_id,
        Issue.status.in_(["OPEN", "IN_PROGRESS", "IN_REVIEW"])
    ).count()
    resolved_issues = Issue.query.filter(
        Issue.project_id == project_id,
        Issue.status.in_(["RESOLVED", "CLOSED"])
    ).count()
    critical_issues = Issue.query.filter(
        Issue.project_id == project_id,
        Issue.severity == "CRITICAL",
        Issue.status.in_(["OPEN", "IN_PROGRESS", "IN_REVIEW"])
    ).count()

    return jsonify({
        "summary": {
            "total": total_issues,
            "open": open_issues,
            "resolved": resolved_issues,
            "critical": critical_issues,
            "members": len(project.members),
            "labels": len(project.labels),
        }
    }), 200


@analytics_bp.route("/projects/<int:project_id>/analytics/status", methods=["GET"])
@jwt_required()
@require_project_access()
def get_status_distribution(project_id: int):
    """Issue counts grouped by status."""
    rows = db.session.query(
        Issue.status, func.count(Issue.id)
    ).filter(
        Issue.project_id == project_id
    ).group_by(Issue.status).all()

    distribution = {status: 0 for status in ["OPEN", "IN_PROGRESS", "IN_REVIEW", "RESOLVED", "CLOSED"]}
    for status, count in rows:
        distribution[status] = count

    return jsonify({"distribution": distribution}), 200


@analytics_bp.route("/projects/<int:project_id>/analytics/priority", methods=["GET"])
@jwt_required()
@require_project_access()
def get_priority_distribution(project_id: int):
    """Issue counts grouped by priority."""
    rows = db.session.query(
        Issue.priority, func.count(Issue.id)
    ).filter(
        Issue.project_id == project_id
    ).group_by(Issue.priority).all()

    distribution = {priority: 0 for priority in ["URGENT", "HIGH", "MEDIUM", "LOW"]}
    for priority, count in rows:
        distribution[priority] = count

    return jsonify({"distribution": distribution}), 200
