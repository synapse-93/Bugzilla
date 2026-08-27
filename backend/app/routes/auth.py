import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required
from app.extensions import db
from app.models.user import User
from app.utils.auth import get_current_user
from app.utils.errors import api_error

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """Register a new user account."""
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

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "user": user.to_dict(include_email=True),
        "access_token": access_token,
    }), 201


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
