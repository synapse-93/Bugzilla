from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.extensions import db
from app.models.user import User
from app.models.project_member import ProjectMember
from app.utils.errors import api_error


def get_current_user() -> User | None:
    """Retrieve the current authenticated User model instance from JWT identity."""
    identity = get_jwt_identity()
    if not identity:
        return None
    try:
        user_id = int(identity)
        return db.session.get(User, user_id)
    except (ValueError, TypeError):
        return None


def get_project_member_role(project_id: int, user_id: int) -> str | None:
    """Get the role string of a user within a project, or None if not a member."""
    member = ProjectMember.query.filter_by(
        project_id=project_id, user_id=user_id
    ).first()
    return member.role if member else None


def require_project_access(allowed_roles: list[str] | None = None):
    """Decorator to enforce project membership and optional role requirement."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = get_current_user()
            if not user:
                return api_error("UNAUTHORIZED", "Invalid or missing authentication credentials", 401)

            project_id = kwargs.get("project_id")
            if not project_id:
                return api_error("BAD_REQUEST", "Project ID is required", 400)

            role = get_project_member_role(project_id, user.id)
            if not role:
                return api_error("FORBIDDEN", "You are not a member of this project", 403)

            if allowed_roles and role not in allowed_roles:
                return api_error(
                    "FORBIDDEN",
                    f"Action requires one of roles: {', '.join(allowed_roles)}. Your role is {role}",
                    403,
                )

            return fn(*args, **kwargs)
        return wrapper
    return decorator
