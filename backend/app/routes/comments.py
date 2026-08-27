from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.issue import Issue
from app.models.comment import Comment
from app.models.activity import Activity
from app.utils.auth import get_current_user, require_project_access, get_project_member_role
from app.utils.errors import api_error

comments_bp = Blueprint("comments", __name__)


@comments_bp.route("/projects/<int:project_id>/issues/<int:issue_id>/comments", methods=["GET"])
@jwt_required()
@require_project_access()
def list_comments(project_id: int, issue_id: int):
    """List all comments on an issue."""
    issue = Issue.query.filter_by(id=issue_id, project_id=project_id).first()
    if not issue:
        return api_error("NOT_FOUND", "Issue not found", 404)

    comments = Comment.query.filter_by(issue_id=issue_id).order_by(Comment.created_at.asc()).all()
    return jsonify({"comments": [c.to_dict() for c in comments]}), 200


@comments_bp.route("/projects/<int:project_id>/issues/<int:issue_id>/comments", methods=["POST"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN", "MAINTAINER", "DEVELOPER"])
def create_comment(project_id: int, issue_id: int):
    """Add a new comment to an issue."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    issue = Issue.query.filter_by(id=issue_id, project_id=project_id).first()
    if not issue:
        return api_error("NOT_FOUND", "Issue not found", 404)

    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    if not body:
        return api_error("VALIDATION_ERROR", "Comment body cannot be empty", 400)

    comment = Comment(
        issue_id=issue.id,
        author_id=user.id,
        body=body,
    )
    db.session.add(comment)

    # Activity record for comment
    activity = Activity(
        issue_id=issue.id,
        actor_id=user.id,
        action_type="COMMENT_ADDED",
        new_value=body[:100] + ("..." if len(body) > 100 else ""),
    )
    db.session.add(activity)

    db.session.commit()
    return jsonify({"comment": comment.to_dict()}), 201


@comments_bp.route("/projects/<int:project_id>/issues/<int:issue_id>/comments/<int:comment_id>", methods=["PATCH"])
@jwt_required()
@require_project_access()
def update_comment(project_id: int, issue_id: int, comment_id: int):
    """Update a comment (author only) and record activity audit log."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    issue = Issue.query.filter_by(id=issue_id, project_id=project_id).first()
    if not issue:
        return api_error("NOT_FOUND", "Issue not found", 404)

    comment = Comment.query.filter_by(id=comment_id, issue_id=issue_id).first()
    if not comment:
        return api_error("NOT_FOUND", "Comment not found", 404)

    if comment.author_id != user.id:
        return api_error("FORBIDDEN", "Only comment author can edit comment", 403)

    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    if not body:
        return api_error("VALIDATION_ERROR", "Comment body cannot be empty", 400)

    old_body = comment.body
    if old_body != body:
        comment.body = body
        # Activity record for comment update
        activity = Activity(
            issue_id=issue.id,
            actor_id=user.id,
            action_type="COMMENT_UPDATED",
            old_value=old_body[:100] + ("..." if len(old_body) > 100 else ""),
            new_value=body[:100] + ("..." if len(body) > 100 else ""),
        )
        activity.set_metadata({"comment_id": comment.id})
        db.session.add(activity)

    db.session.commit()
    return jsonify({"comment": comment.to_dict()}), 200


@comments_bp.route("/projects/<int:project_id>/issues/<int:issue_id>/comments/<int:comment_id>", methods=["DELETE"])
@jwt_required()
@require_project_access()
def delete_comment(project_id: int, issue_id: int, comment_id: int):
    """Delete a comment (author or project ADMIN)."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    comment = Comment.query.filter_by(id=comment_id, issue_id=issue_id).first()
    if not comment:
        return api_error("NOT_FOUND", "Comment not found", 404)

    role = get_project_member_role(project_id, user.id)
    if comment.author_id != user.id and role != "ADMIN":
        return api_error("FORBIDDEN", "Only author or project admin can delete this comment", 403)

    db.session.delete(comment)
    db.session.commit()
    return jsonify({"status": "deleted", "comment_id": comment_id}), 200
