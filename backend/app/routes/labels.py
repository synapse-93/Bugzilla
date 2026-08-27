from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.label import Label
from app.utils.auth import require_project_access
from app.utils.errors import api_error

labels_bp = Blueprint("labels", __name__)


@labels_bp.route("/projects/<int:project_id>/labels", methods=["GET"])
@jwt_required()
@require_project_access()
def list_labels(project_id: int):
    """List all labels in a project."""
    labels = Label.query.filter_by(project_id=project_id).order_by(Label.name.asc()).all()
    return jsonify({"labels": [lbl.to_dict() for lbl in labels]}), 200


@labels_bp.route("/projects/<int:project_id>/labels", methods=["POST"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN", "MAINTAINER"])
def create_label(project_id: int):
    """Create a new label in a project."""
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip().lower()
    color = (data.get("color") or "#6b7280").strip()

    if not name or len(name) < 1 or len(name) > 50:
        return api_error("VALIDATION_ERROR", "Label name must be between 1 and 50 characters", 400)

    existing = Label.query.filter_by(project_id=project_id, name=name).first()
    if existing:
        return api_error("CONFLICT", f"Label '{name}' already exists in this project", 409)

    label = Label(project_id=project_id, name=name, color=color)
    db.session.add(label)
    db.session.commit()

    return jsonify({"label": label.to_dict()}), 201


@labels_bp.route("/projects/<int:project_id>/labels/<int:label_id>", methods=["DELETE"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN", "MAINTAINER"])
def delete_label(project_id: int, label_id: int):
    """Delete a label from a project."""
    label = Label.query.filter_by(id=label_id, project_id=project_id).first()
    if not label:
        return api_error("NOT_FOUND", "Label not found", 404)

    db.session.delete(label)
    db.session.commit()
    return jsonify({"status": "deleted", "label_id": label_id}), 200
