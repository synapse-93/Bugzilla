import re
import secrets
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models.user import User
from app.utils.auth import get_current_user
from app.utils.errors import api_error
from app.services.email import send_verification_email, send_password_reset_email, send_welcome_email

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """Register a new email-based user account with duplicate race protection."""
    data = request.get_json(silent=True)
    if not data:
        return api_error("VALIDATION_ERROR", "JSON body is required", 400)

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    details = {}
    if not username or len(username) < 3 or len(username) > 50:
        details["username"] = "Username must be between 3 and 50 characters"
    if not email or not EMAIL_REGEX.match(email):
        details["email"] = "A valid email address is required"
    if not password or len(password) < 8:
        details["password"] = "Password must be at least 8 characters long"

    if details:
        return api_error("VALIDATION_ERROR", "Input validation failed", 400, details)

    # Check uniqueness
    if User.query.filter_by(username=username).first():
        return api_error("CONFLICT", "Username is already registered", 409, {"username": "Username already in use"})
    if User.query.filter_by(email=email).first():
        return api_error("CONFLICT", "Email is already registered", 409, {"email": "Email already in use"})

    verification_token = secrets.token_urlsafe(32)
    user = User(
        username=username,
        email=email,
        auth_provider="EMAIL",
        is_email_verified=False,
        email_verification_token=verification_token,
    )
    user.set_password(password)
    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return api_error("CONFLICT", "Username or email is already registered", 409, {"conflict": "Username or email already in use"})

    # Send verification email asynchronously / via service
    verification_url = f"https://bugzilla-foundation.vercel.app/verify-email?token={verification_token}"
    send_verification_email(email, username, verification_url)

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "user": user.to_dict(include_email=True),
        "access_token": access_token,
    }), 201


@auth_bp.route("/auth/guest", methods=["POST"])
def guest_auth():
    """Guest signup or login (requires only username & password, no email)."""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or len(username) < 3 or len(username) > 50:
        return api_error("VALIDATION_ERROR", "Guest username must be between 3 and 50 characters", 400)
    if not password or len(password) < 6:
        return api_error("VALIDATION_ERROR", "Guest password must be at least 6 characters", 400)

    user = User.query.filter_by(username=username).first()
    if user:
        if user.auth_provider != "GUEST" and not user.check_password(password):
            return api_error("AUTHENTICATION_FAILED", "Invalid username or password", 401)
        if not user.check_password(password):
            return api_error("AUTHENTICATION_FAILED", "Invalid guest credentials", 401)
    else:
        # Create new Guest account
        user = User(
            username=username,
            email=None,
            auth_provider="GUEST",
            is_email_verified=False,
        )
        user.set_password(password)
        db.session.add(user)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return api_error("CONFLICT", "Username already in use", 409)

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "user": user.to_dict(include_email=False),
        "access_token": access_token,
    }), 200


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """Authenticate with username/email and password to receive JWT token."""
    data = request.get_json(silent=True)
    if not data:
        return api_error("VALIDATION_ERROR", "JSON body is required", 400)

    login_identifier = (data.get("email") or data.get("username") or "").strip()
    password = data.get("password") or ""

    if not login_identifier or not password:
        return api_error("VALIDATION_ERROR", "Identifier and password are required", 400)

    user = User.query.filter(
        (User.email == login_identifier.lower()) | (User.username == login_identifier)
    ).first()

    if not user or not user.check_password(password):
        return api_error("AUTHENTICATION_FAILED", "Invalid email/username or password", 401)

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "user": user.to_dict(include_email=True),
        "access_token": access_token,
    }), 200


@auth_bp.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    """Generate secure password reset token and dispatch email."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email or not EMAIL_REGEX.match(email):
        return api_error("VALIDATION_ERROR", "A valid email address is required", 400)

    user = User.query.filter_by(email=email).first()
    if user and user.auth_provider != "GUEST":
        reset_token = secrets.token_urlsafe(32)
        user.reset_password_token = reset_token
        user.reset_password_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        db.session.commit()

        reset_url = f"https://bugzilla-foundation.vercel.app/reset-password?token={reset_token}"
        send_password_reset_email(user.email, user.username, reset_url)

    return jsonify({"message": "If an account exists with that email, a password reset link has been sent."}), 200


@auth_bp.route("/auth/reset-password", methods=["POST"])
def reset_password():
    """Reset password using one-time token."""
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    new_password = data.get("password") or ""

    if not token or not new_password or len(new_password) < 8:
        return api_error("VALIDATION_ERROR", "Valid token and password (min 8 characters) required", 400)

    user = User.query.filter_by(reset_password_token=token).first()
    if not user or not user.reset_password_expires_at:
        return api_error("INVALID_TOKEN", "Reset token is invalid or has expired", 400)

    expires_at = user.reset_password_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        return api_error("INVALID_TOKEN", "Reset token has expired", 400)

    user.set_password(new_password)
    user.reset_password_token = None
    user.reset_password_expires_at = None
    db.session.commit()

    return jsonify({"message": "Password reset successfully. You may now sign in."}), 200


@auth_bp.route("/auth/verify-email", methods=["POST"])
def verify_email():
    """Verify email address using verification token."""
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()

    if not token:
        return api_error("VALIDATION_ERROR", "Verification token is required", 400)

    user = User.query.filter_by(email_verification_token=token).first()
    if not user:
        return api_error("INVALID_TOKEN", "Verification token is invalid", 400)

    user.is_email_verified = True
    user.email_verification_token = None
    db.session.commit()

    return jsonify({"message": "Email verified successfully.", "user": user.to_dict(include_email=True)}), 200


@auth_bp.route("/auth/oauth/google", methods=["POST"])
def oauth_google():
    """Handle Google OAuth login/registration."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    username = (data.get("username") or "").strip()
    display_name = data.get("name")
    avatar_url = data.get("picture")

    if not email:
        return api_error("VALIDATION_ERROR", "Email is required from Google OAuth", 400)

    user = User.query.filter_by(email=email).first()
    if not user:
        clean_user = username or email.split("@")[0]
        # Ensure unique username
        base_user = clean_user
        idx = 1
        while User.query.filter_by(username=clean_user).first():
            clean_user = f"{base_user}{idx}"
            idx += 1

        user = User(
            username=clean_user,
            email=email,
            display_name=display_name,
            avatar_url=avatar_url,
            auth_provider="GOOGLE",
            is_email_verified=True,
        )
        db.session.add(user)
        db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "user": user.to_dict(include_email=True),
        "access_token": access_token,
    }), 200


@auth_bp.route("/auth/oauth/github", methods=["POST"])
def oauth_github():
    """Handle GitHub OAuth login/registration."""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    avatar_url = data.get("avatar_url")

    if not username:
        return api_error("VALIDATION_ERROR", "GitHub username is required", 400)

    user = User.query.filter(
        (User.username == username) | (User.email == email if email else False)
    ).first()

    if not user:
        user = User(
            username=username,
            email=email if email else f"{username}@github.bugzilla.local",
            avatar_url=avatar_url,
            github_url=f"https://github.com/{username}",
            auth_provider="GITHUB",
            is_email_verified=bool(email),
        )
        db.session.add(user)
        db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "user": user.to_dict(include_email=True),
        "access_token": access_token,
    }), 200


@auth_bp.route("/auth/me", methods=["GET"])
@jwt_required()
def get_current_user_profile():
    """Retrieve authenticated user's profile."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "User profile not found", 401)
    return jsonify({
        "user": user.to_dict(include_email=True),
    }), 200


@auth_bp.route("/auth/profile", methods=["GET", "PATCH"])
@jwt_required()
def manage_profile():
    """Get or update current user profile details."""
    user = get_current_user()
    if not user:
        return api_error("UNAUTHORIZED", "Invalid credentials", 401)

    if request.method == "GET":
        return jsonify({"user": user.to_dict(include_email=True)}), 200

    data = request.get_json(silent=True) or {}
    if "display_name" in data:
        user.display_name = (data.get("display_name") or "").strip() or None
    if "bio" in data:
        user.bio = (data.get("bio") or "").strip() or None
    if "role_title" in data:
        user.role_title = (data.get("role_title") or "").strip() or None
    if "skills" in data:
        skills_val = data.get("skills")
        if isinstance(skills_val, list):
            user.skills = ",".join(str(s).strip() for s in skills_val if str(s).strip())
        else:
            user.skills = str(skills_val).strip() if skills_val else None
    if "github_url" in data:
        user.github_url = (data.get("github_url") or "").strip() or None
    if "linkedin_url" in data:
        user.linkedin_url = (data.get("linkedin_url") or "").strip() or None
    if "website_url" in data:
        user.website_url = (data.get("website_url") or "").strip() or None
    if "avatar_url" in data:
        user.avatar_url = (data.get("avatar_url") or "").strip() or None
    if "is_open_to_work" in data:
        user.is_open_to_work = bool(data.get("is_open_to_work"))

    db.session.commit()
    return jsonify({"user": user.to_dict(include_email=True)}), 200


@auth_bp.route("/users/<int:user_id>/public-profile", methods=["GET"])
@jwt_required()
def get_public_profile(user_id: int):
    """Retrieve public profile for collaboration and team viewing."""
    user = db.session.get(User, user_id)
    if not user:
        return api_error("NOT_FOUND", "User not found", 404)
    return jsonify({"profile": user.to_public_dict()}), 200


@auth_bp.route("/users/collaborators", methods=["GET"])
@jwt_required()
def list_open_collaborators():
    """Discover users who have explicitly set 'is_open_to_work = True'."""
    query = User.query.filter_by(is_open_to_work=True)
    skill_filter = request.args.get("skill")
    if skill_filter:
        query = query.filter(User.skills.ilike(f"%{skill_filter.strip()}%"))

    collaborators = query.order_by(User.updated_at.desc()).limit(50).all()
    return jsonify({"collaborators": [c.to_public_dict() for c in collaborators]}), 200
