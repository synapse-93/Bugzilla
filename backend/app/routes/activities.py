from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.issue import Issue
from app.models.activity import Activity
from app.utils.auth import require_project_access
from app.utils.errors import api_error

activities_bp = Blueprint("activities", __name__)


@activities_bp.route("/projects/<int:project_id>/issues/<int:issue_id>/activities", methods=["GET"])
@jwt_required()
@require_project_access()
def list_issue_activities(project_id: int, issue_id: int):
    """List activity timeline for a specific issue."""
    issue = Issue.query.filter_by(id=issue_id, project_id=project_id).first()
    if not issue:
        return api_error("NOT_FOUND", "Issue not found", 404)

    activities = Activity.query.filter_by(issue_id=issue_id).order_by(Activity.created_at.desc()).all()
    return jsonify({"activities": [a.to_dict() for a in activities]}), 200


@activities_bp.route("/projects/<int:project_id>/activities", methods=["GET"])
@jwt_required()
@require_project_access()
def list_project_activities(project_id: int):
    """List recent activity feed for the entire project."""
    activities = Activity.query.join(Issue).filter(
        Issue.project_id == project_id
    ).order_by(Activity.created_at.desc()).limit(50).all()

    return jsonify({"activities": [a.to_dict() for a in activities]}), 200
