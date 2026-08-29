from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.project import Project
from app.models.milestone import Milestone
from app.utils.auth import require_project_access
from app.utils.errors import api_error

milestones_bp = Blueprint("milestones", __name__)


@milestones_bp.route("/projects/<int:project_id>/milestones", methods=["GET"])
@jwt_required()
@require_project_access()
def list_milestones(project_id: int):
    """List all milestones in a project with completion calculations."""
    milestones = Milestone.query.filter_by(project_id=project_id).order_by(Milestone.created_at.desc()).all()
    return jsonify({"milestones": [m.to_dict() for m in milestones]}), 200


@milestones_bp.route("/projects/<int:project_id>/milestones", methods=["POST"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN", "MAINTAINER"])
def create_milestone(project_id: int):
    """Create a new project milestone."""
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    due_date_str = data.get("due_date")

    if not name or len(name) < 1 or len(name) > 100:
        return api_error("VALIDATION_ERROR", "Milestone name must be between 1 and 100 characters", 400)

    due_date = None
    if due_date_str:
        try:
            due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
        except Exception:
            pass

    milestone = Milestone(
        project_id=project_id,
        name=name,
        description=description if description else None,
        due_date=due_date,
        status="OPEN",
    )
    db.session.add(milestone)
    db.session.commit()

    return jsonify({"milestone": milestone.to_dict()}), 201


@milestones_bp.route("/projects/<int:project_id>/milestones/<int:milestone_id>", methods=["PATCH"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN", "MAINTAINER"])
def update_milestone(project_id: int, milestone_id: int):
    """Update milestone details or status."""
    milestone = Milestone.query.filter_by(id=milestone_id, project_id=project_id).first()
    if not milestone:
        return api_error("NOT_FOUND", "Milestone not found", 404)

    data = request.get_json(silent=True) or {}
    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return api_error("VALIDATION_ERROR", "Milestone name cannot be empty", 400)
        milestone.name = name
    if "description" in data:
        milestone.description = (data.get("description") or "").strip() or None
    if "status" in data:
        status_val = (data.get("status") or "").upper()
        if status_val in {"OPEN", "COMPLETED"}:
            milestone.status = status_val
    if "due_date" in data:
        due_date_str = data.get("due_date")
        if due_date_str:
            try:
                milestone.due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
            except Exception:
                pass
        else:
            milestone.due_date = None

    db.session.commit()
    return jsonify({"milestone": milestone.to_dict()}), 200


@milestones_bp.route("/projects/<int:project_id>/milestones/<int:milestone_id>", methods=["DELETE"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN", "MAINTAINER"])
def delete_milestone(project_id: int, milestone_id: int):
    """Delete a project milestone."""
    milestone = Milestone.query.filter_by(id=milestone_id, project_id=project_id).first()
    if not milestone:
        return api_error("NOT_FOUND", "Milestone not found", 404)

    db.session.delete(milestone)
    db.session.commit()
    return jsonify({"status": "deleted", "milestone_id": milestone_id}), 200
