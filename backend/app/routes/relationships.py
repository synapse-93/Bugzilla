from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.issue import Issue
from app.models.issue_relationship import IssueRelationship
from app.utils.auth import require_project_access
from app.utils.errors import api_error

relationships_bp = Blueprint("relationships", __name__)

VALID_REL_TYPES = {"BLOCKS", "BLOCKED_BY", "RELATED", "DUPLICATE"}


@relationships_bp.route("/projects/<int:project_id>/issues/<int:issue_id>/relationships", methods=["GET"])
@jwt_required()
@require_project_access()
def list_relationships(project_id: int, issue_id: int):
    """List all relationships for an issue."""
    issue = Issue.query.filter_by(id=issue_id, project_id=project_id).first()
    if not issue:
        return api_error("NOT_FOUND", "Issue not found", 404)

    relationships = IssueRelationship.query.filter(
        (IssueRelationship.source_issue_id == issue_id) | (IssueRelationship.target_issue_id == issue_id)
    ).all()

    return jsonify({"relationships": [r.to_dict() for r in relationships]}), 200


@relationships_bp.route("/projects/<int:project_id>/issues/<int:issue_id>/relationships", methods=["POST"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN", "MAINTAINER", "DEVELOPER"])
def create_relationship(project_id: int, issue_id: int):
    """Create a relationship between two issues."""
    source_issue = Issue.query.filter_by(id=issue_id, project_id=project_id).first()
    if not source_issue:
        return api_error("NOT_FOUND", "Source issue not found", 404)

    data = request.get_json(silent=True) or {}
    target_id = data.get("target_issue_id")
    rel_type = (data.get("relationship_type") or "RELATED").strip().upper()

    if not target_id or target_id == issue_id:
        return api_error("VALIDATION_ERROR", "Valid distinct target issue is required", 400)
    if rel_type not in VALID_REL_TYPES:
        return api_error("VALIDATION_ERROR", f"Invalid relationship type: {rel_type}", 400)

    target_issue = Issue.query.filter_by(id=target_id, project_id=project_id).first()
    if not target_issue:
        return api_error("NOT_FOUND", "Target issue not found in this project", 404)

    # Prevent duplicate relationship
    existing = IssueRelationship.query.filter_by(
        source_issue_id=issue_id,
        target_issue_id=target_id,
        relationship_type=rel_type,
    ).first()
    if existing:
        return api_error("CONFLICT", "Relationship already exists between these issues", 409)

    relationship = IssueRelationship(
        source_issue_id=issue_id,
        target_issue_id=target_id,
        relationship_type=rel_type,
    )
    db.session.add(relationship)
    db.session.commit()

    return jsonify({"relationship": relationship.to_dict()}), 201


@relationships_bp.route("/projects/<int:project_id>/issues/<int:issue_id>/relationships/<int:relationship_id>", methods=["DELETE"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN", "MAINTAINER", "DEVELOPER"])
def delete_relationship(project_id: int, issue_id: int, relationship_id: int):
    """Delete an issue relationship."""
    rel = IssueRelationship.query.filter_by(id=relationship_id).first()
    if not rel or (rel.source_issue_id != issue_id and rel.target_issue_id != issue_id):
        return api_error("NOT_FOUND", "Relationship not found on this issue", 404)

    db.session.delete(rel)
    db.session.commit()
    return jsonify({"status": "deleted", "relationship_id": relationship_id}), 200
