import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.label import Label
from app.utils.auth import get_current_user, get_project_member_role, require_project_access
from app.utils.errors import api_error

projects_bp = Blueprint("projects", __name__)

PROJECT_KEY_REGEX = re.compile(r"^[A-Z0-9]{2,10}$")
VALID_ROLES = {"ADMIN", "MAINTAINER", "DEVELOPER", "VIEWER"}

DEFAULT_LABELS = [
    {"name": "bug", "color": "#ef4444"},
    {"name": "feature", "color": "#3b82f6"},
    {"name": "frontend", "color": "#8b5cf6"},
    {"name": "backend", "color": "#10b981"},
    {"name": "documentation", "color": "#f59e0b"},
]


@projects_bp.route("/projects", methods=["GET"])
@jwt_required()
def list_projects():
    """List all projects that the current user belongs to or can access."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    memberships = ProjectMember.query.filter_by(user_id=user.id).all()
    project_ids = [m.project_id for m in memberships]
    projects = Project.query.filter(Project.id.in_(project_ids)).order_by(Project.name.asc()).all() if project_ids else []

    result = []
    for project in projects:
        data = project.to_dict()
        data["role"] = get_project_member_role(project.id, user.id)
        data["issue_count"] = len(project.issues)
        data["member_count"] = len(project.members)
        result.append(data)

    return jsonify({"projects": result}), 200


@projects_bp.route("/projects", methods=["POST"])
@jwt_required()
def create_project():
    """Create a new project and assign creator as ADMIN."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    data = request.get_json(silent=True)
    if not data:
        return api_error("VALIDATION_ERROR", "JSON body is required", 400)

    name = (data.get("name") or "").strip()
    key = (data.get("key") or "").strip().upper()
    description = (data.get("description") or "").strip()

    details = {}
    if not name or len(name) < 2 or len(name) > 100:
        details["name"] = "Name must be between 2 and 100 characters"
    if not key or not PROJECT_KEY_REGEX.match(key):
        details["key"] = "Key must be 2-10 uppercase alphanumeric characters (e.g. BUG, PROJ)"

    if details:
        return api_error("VALIDATION_ERROR", "Invalid project input", 400, details)

    if Project.query.filter_by(key=key).first():
        return api_error("CONFLICT", f"Project key '{key}' already exists", 409, {"key": "Key already taken"})

    project = Project(
        name=name,
        key=key,
        description=description if description else None,
        created_by=user.id,
    )
    db.session.add(project)
    db.session.flush()

    member = ProjectMember(project_id=project.id, user_id=user.id, role="ADMIN")
    db.session.add(member)

    for dl in DEFAULT_LABELS:
        lbl = Label(project_id=project.id, name=dl["name"], color=dl["color"])
        db.session.add(lbl)

    db.session.commit()

    project_data = project.to_dict()
    project_data["role"] = "ADMIN"
    project_data["member_count"] = 1
    project_data["issue_count"] = 0
    return jsonify({"project": project_data}), 201


@projects_bp.route("/projects/<int:project_id>", methods=["GET"])
@jwt_required()
def get_project(project_id: int):
    """Retrieve details for a single project."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    project = db.session.get(Project, project_id)
    if not project:
        return api_error("NOT_FOUND", "Project not found", 404)

    role = get_project_member_role(project.id, user.id)
    if not role:
        return api_error("FORBIDDEN", "You do not have access to this project", 403)

    data = project.to_dict()
    data["role"] = role
    data["member_count"] = len(project.members)
    data["issue_count"] = len(project.issues)
    data["labels"] = [lbl.to_dict() for lbl in project.labels]
    return jsonify({"project": data}), 200


@projects_bp.route("/projects/<int:project_id>", methods=["PATCH"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN"])
def update_project(project_id: int):
    """Update project details (ADMIN only)."""
    project = db.session.get(Project, project_id)
    if not project:
        return api_error("NOT_FOUND", "Project not found", 404)

    data = request.get_json(silent=True) or {}
    if "name" in data:
        name = data["name"].strip()
        if not name or len(name) < 2 or len(name) > 100:
            return api_error("VALIDATION_ERROR", "Name must be between 2 and 100 characters", 400)
        project.name = name

    if "description" in data:
        project.description = data["description"].strip() if data["description"] else None

    db.session.commit()
    return jsonify({"project": project.to_dict()}), 200


@projects_bp.route("/projects/<int:project_id>", methods=["DELETE"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN"])
def delete_project(project_id: int):
    """Delete project and all associated resources (ADMIN only)."""
    project = db.session.get(Project, project_id)
    if not project:
        return api_error("NOT_FOUND", "Project not found", 404)

    db.session.delete(project)
    db.session.commit()
    return jsonify({"status": "deleted", "message": f"Project {project.key} deleted"}), 200


@projects_bp.route("/projects/<int:project_id>/members", methods=["GET"])
@jwt_required()
@require_project_access()
def list_members(project_id: int):
    """List members of a project."""
    members = ProjectMember.query.filter_by(project_id=project_id).all()
    return jsonify({"members": [m.to_dict() for m in members]}), 200


@projects_bp.route("/projects/<int:project_id>/members", methods=["POST"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN"])
def add_member(project_id: int):
    """Add a member to a project (ADMIN only)."""
    project = (
        db.session.query(Project)
        .filter_by(id=project_id)
        .with_for_update()
        .first()
    )
    if not project:
        return api_error("NOT_FOUND", "Project not found", 404)

    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    identifier = data.get("email") or data.get("username")
    role = (data.get("role") or "DEVELOPER").upper()

    if role not in VALID_ROLES:
        return api_error("VALIDATION_ERROR", f"Role must be one of: {', '.join(sorted(VALID_ROLES))}", 400)

    target_user = None
    if user_id:
        target_user = db.session.get(User, user_id)
    elif identifier:
        target_user = User.query.filter(
            (User.email == identifier.lower()) | (User.username == identifier)
        ).first()

    if not target_user:
        return api_error("NOT_FOUND", "User not found", 404)

    existing = ProjectMember.query.filter_by(project_id=project_id, user_id=target_user.id).first()
    if existing:
        return api_error("CONFLICT", "User is already a member of this project", 409)

    member = ProjectMember(project_id=project_id, user_id=target_user.id, role=role)
    db.session.add(member)
    db.session.commit()

    return jsonify({"member": member.to_dict()}), 201


@projects_bp.route("/projects/<int:project_id>/members/<int:user_id>", methods=["PATCH"])
@jwt_required()
@require_project_access(allowed_roles=["ADMIN"])
def update_member_role(project_id: int, user_id: int):
    """Update a member's role (ADMIN only)."""
    project = (
        db.session.query(Project)
        .filter_by(id=project_id)
        .with_for_update()
        .first()
    )
    if not project:
        return api_error("NOT_FOUND", "Project not found", 404)

    data = request.get_json(silent=True) or {}
    role = (data.get("role") or "").upper()

    if role not in VALID_ROLES:
        return api_error("VALIDATION_ERROR", f"Role must be one of: {', '.join(sorted(VALID_ROLES))}", 400)

    member = ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        return api_error("NOT_FOUND", "Project member not found", 404)

    if member.role == "ADMIN" and role != "ADMIN":
        admin_count = ProjectMember.query.filter_by(project_id=project_id, role="ADMIN").count()
        if admin_count <= 1:
            return api_error("BAD_REQUEST", "Cannot demote the only project admin", 400)

    member.role = role
    db.session.commit()
    return jsonify({"member": member.to_dict()}), 200


@projects_bp.route("/projects/<int:project_id>/members/<int:user_id>", methods=["DELETE"])
@jwt_required()
def remove_member(project_id: int, user_id: int):
    """Remove a member from the project (ADMIN or self-leave)."""
    current_user = get_current_user()
    if not current_user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    caller_role = get_project_member_role(project_id, current_user.id)
    if not caller_role:
        return api_error("FORBIDDEN", "You are not a member of this project", 403)

    if caller_role != "ADMIN" and current_user.id != user_id:
        return api_error("FORBIDDEN", "Only project admins can remove other members", 403)

    project = (
        db.session.query(Project)
        .filter_by(id=project_id)
        .with_for_update()
        .first()
    )
    if not project:
        return api_error("NOT_FOUND", "Project not found", 404)

    member = ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        return api_error("NOT_FOUND", "Project member not found", 404)

    if member.role == "ADMIN":
        admin_count = ProjectMember.query.filter_by(project_id=project_id, role="ADMIN").count()
        if admin_count <= 1:
            return api_error("BAD_REQUEST", "Cannot remove the only project admin", 400)

    db.session.delete(member)
    db.session.commit()
    return jsonify({"status": "removed", "user_id": user_id}), 200
