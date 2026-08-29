from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.invitation import Invitation
from app.models.notification import Notification
from app.utils.auth import get_current_user, require_project_access
from app.utils.errors import api_error
from app.services.email import send_project_invitation_email, send_invitation_accepted_email

invitations_bp = Blueprint("invitations", __name__)


@invitations_bp.route("/projects/<int:project_id>/invitations", methods=["POST"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN", "MAINTAINER"])
def invite_member(project_id: int):
    """Send project invitation to a user (no silent adding)."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    project = db.session.get(Project, project_id)
    if not project:
        return api_error("NOT_FOUND", "Project not found", 404)

    data = request.get_json(silent=True) or {}
    identifier = (data.get("username") or data.get("email") or "").strip()
    role = (data.get("role") or "DEVELOPER").strip().upper()

    if not identifier:
        return api_error("VALIDATION_ERROR", "Username or email is required", 400)
    if role not in {"ADMIN", "MAINTAINER", "DEVELOPER", "VIEWER"}:
        return api_error("VALIDATION_ERROR", "Invalid project role", 400)

    target_user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not target_user:
        return api_error("NOT_FOUND", f"User '{identifier}' not found", 404)

    # Check if already a member
    if ProjectMember.query.filter_by(project_id=project_id, user_id=target_user.id).first():
        return api_error("CONFLICT", "User is already a member of this project", 409)

    # Check if active pending invitation already exists
    existing_invite = Invitation.query.filter_by(
        project_id=project_id, invitee_id=target_user.id, status="PENDING"
    ).first()
    if existing_invite:
        return api_error("CONFLICT", "An active invitation is already pending for this user", 409)

    invitation = Invitation(
        project_id=project_id,
        inviter_id=user.id,
        invitee_id=target_user.id,
        role=role,
        status="PENDING",
    )
    db.session.add(invitation)

    # Create In-App Notification for Invitee
    notification = Notification(
        user_id=target_user.id,
        actor_id=user.id,
        project_id=project_id,
        notification_type="INVITATION",
        title=f"Invitation to join {project.name}",
        message=f"{user.username} invited you to join {project.name} as a {role}.",
    )
    db.session.add(notification)
    db.session.commit()

    # Send Email Notification if user has email
    if target_user.email:
        accept_url = f"https://bugzilla-foundation.vercel.app/invitations"
        send_project_invitation_email(
            target_user.email,
            target_user.username,
            project.name,
            user.username,
            role,
            accept_url,
        )

    return jsonify({"invitation": invitation.to_dict()}), 201


@invitations_bp.route("/invitations/my", methods=["GET"])
@jwt_required()
def list_my_invitations():
    """List pending project invitations for current logged-in user."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    invitations = Invitation.query.filter_by(
        invitee_id=user.id, status="PENDING"
    ).order_by(Invitation.created_at.desc()).all()

    return jsonify({"invitations": [i.to_dict() for i in invitations]}), 200


@invitations_bp.route("/invitations/<int:invitation_id>/accept", methods=["POST"])
@jwt_required()
def accept_invitation(invitation_id: int):
    """Accept project invitation and become a project member."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    invitation = db.session.get(Invitation, invitation_id)
    if not invitation or invitation.invitee_id != user.id or invitation.status != "PENDING":
        return api_error("NOT_FOUND", "Pending invitation not found", 404)

    # Add project member
    if not ProjectMember.query.filter_by(project_id=invitation.project_id, user_id=user.id).first():
        member = ProjectMember(
            project_id=invitation.project_id,
            user_id=user.id,
            role=invitation.role,
        )
        db.session.add(member)

    invitation.status = "ACCEPTED"

    # Notify Project Inviter
    if invitation.inviter_id:
        notification = Notification(
            user_id=invitation.inviter_id,
            actor_id=user.id,
            project_id=invitation.project_id,
            notification_type="INVITATION_ACCEPTED",
            title="Invitation Accepted",
            message=f"{user.username} accepted your invitation to join {invitation.project.name}.",
        )
        db.session.add(notification)

    db.session.commit()
    return jsonify({"status": "accepted", "project": invitation.project.to_dict()}), 200


@invitations_bp.route("/invitations/<int:invitation_id>/decline", methods=["POST"])
@jwt_required()
def decline_invitation(invitation_id: int):
    """Decline project invitation."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    invitation = db.session.get(Invitation, invitation_id)
    if not invitation or invitation.invitee_id != user.id or invitation.status != "PENDING":
        return api_error("NOT_FOUND", "Pending invitation not found", 404)

    invitation.status = "DECLINED"
    db.session.commit()
    return jsonify({"status": "declined"}), 200
