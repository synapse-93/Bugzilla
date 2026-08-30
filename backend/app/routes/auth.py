import json
import os
import re
import secrets
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, redirect
from flask_jwt_extended import create_access_token, jwt_required, decode_token
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models.user import User
from app.utils.auth import get_current_user
from app.utils.errors import api_error
from app.services.email import send_verification_email, send_password_reset_email, send_welcome_email

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def get_frontend_url() -> str:
    """Resolve frontend application base URL."""
    return os.environ.get("FRONTEND_URL", "https://bugzilla-foundation.vercel.app").rstrip("/")


def get_oauth_redirect_uri(provider: str) -> str:
    """Determine callback URI for OAuth provider."""
    env_var = f"{provider.upper()}_REDIRECT_URI"
    explicit = os.environ.get(env_var)
    if explicit:
        return explicit.strip()

    backend_base = os.environ.get("BACKEND_URL", "").rstrip("/")
    if not backend_base:
        if request.headers.get("X-Forwarded-Host"):
            proto = request.headers.get("X-Forwarded-Proto", "https")
            backend_base = f"{proto}://{request.headers.get('X-Forwarded-Host')}"
        else:
            backend_base = request.url_root.rstrip("/")
    return f"{backend_base}/api/auth/{provider.lower()}/callback"


def exchange_google_code(code: str, redirect_uri: str, client_id: str, client_secret: str) -> dict:
    """Exchange authorization code with Google token endpoint and retrieve user profile."""
    token_url = "https://oauth2.googleapis.com/token"
    token_payload = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    encoded_data = urllib.parse.urlencode(token_payload).encode("utf-8")
    req = urllib.request.Request(
        token_url,
        data=encoded_data,
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        token_data = json.loads(resp.read().decode("utf-8"))

    access_token = token_data.get("access_token")
    if not access_token:
        raise ValueError(token_data.get("error_description") or "Google did not return an access token")

    userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    req_info = urllib.request.Request(
        userinfo_url,
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        method="GET",
    )
    with urllib.request.urlopen(req_info, timeout=10) as resp_info:
        return json.loads(resp_info.read().decode("utf-8"))


def exchange_github_code(code: str, redirect_uri: str, client_id: str, client_secret: str) -> dict:
    """Exchange authorization code with GitHub token endpoint and retrieve profile and verified email."""
    token_url = "https://github.com/login/oauth/access_token"
    token_payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
    }
    encoded_data = urllib.parse.urlencode(token_payload).encode("utf-8")
    req = urllib.request.Request(
        token_url,
        data=encoded_data,
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        token_data = json.loads(resp.read().decode("utf-8"))

    access_token = token_data.get("access_token")
    if not access_token:
        error_msg = token_data.get("error_description") or token_data.get("error") or "GitHub did not return an access token"
        raise ValueError(error_msg)

    user_url = "https://api.github.com/user"
    req_user = urllib.request.Request(
        user_url,
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json", "User-Agent": "Bugzilla-OAuth"},
        method="GET",
    )
    with urllib.request.urlopen(req_user, timeout=10) as resp_user:
        user_info = json.loads(resp_user.read().decode("utf-8"))

    # If email is private on profile, fetch primary verified email from /user/emails
    email = user_info.get("email")
    if not email:
        try:
            emails_url = "https://api.github.com/user/emails"
            req_emails = urllib.request.Request(
                emails_url,
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json", "User-Agent": "Bugzilla-OAuth"},
                method="GET",
            )
            with urllib.request.urlopen(req_emails, timeout=10) as resp_emails:
                emails_data = json.loads(resp_emails.read().decode("utf-8"))
                for em in emails_data:
                    if em.get("primary") and em.get("verified"):
                        email = em.get("email")
                        break
                if not email and emails_data:
                    email = emails_data[0].get("email")
        except Exception:
            pass

    user_info["verified_email"] = email
    return user_info


# =============================================================================
# 1. Standard Email & Password Auth
# =============================================================================

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

    verification_url = f"{get_frontend_url()}/verify-email?token={verification_token}"
    send_verification_email(email, username, verification_url)

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "user": user.to_dict(include_email=True),
        "access_token": access_token,
    }), 201


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """Authenticate with username or email + password."""
    data = request.get_json(silent=True)
    if not data:
        return api_error("VALIDATION_ERROR", "JSON body is required", 400)

    identifier = (data.get("username") or data.get("email") or "").strip()
    password = data.get("password") or ""

    if not identifier or not password:
        return api_error("VALIDATION_ERROR", "Username/email and password are required", 400)

    user = User.query.filter(
        (User.email == identifier.lower()) | (User.username == identifier)
    ).first()

    if not user or not user.check_password(password):
        return api_error("AUTHENTICATION_FAILED", "Invalid credentials", 401)

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "user": user.to_dict(include_email=True),
        "access_token": access_token,
    }), 200


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
            return api_error("CONFLICT", "Guest username already taken", 409)

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "user": user.to_dict(include_email=True),
        "access_token": access_token,
    }), 200


@auth_bp.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    """Initiate password recovery."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email or not EMAIL_REGEX.match(email):
        return api_error("VALIDATION_ERROR", "Valid email is required", 400)

    user = User.query.filter_by(email=email).first()
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_password_token = token
        user.reset_password_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        db.session.commit()
        reset_url = f"{get_frontend_url()}/reset-password?token={token}"
        send_password_reset_email(email, user.username, reset_url)

    return jsonify({"message": "If this email is registered, recovery instructions have been sent."}), 200


@auth_bp.route("/auth/reset-password", methods=["POST"])
def reset_password():
    """Complete password reset with valid token."""
    data = request.get_json(silent=True) or {}
    token = data.get("token")
    new_password = data.get("password") or ""

    if not token:
        return api_error("VALIDATION_ERROR", "Reset token is required", 400)
    if not new_password or len(new_password) < 8:
        return api_error("VALIDATION_ERROR", "Password must be at least 8 characters long", 400)

    user = User.query.filter_by(reset_password_token=token).first()
    if not user:
        return api_error("INVALID_TOKEN", "Reset token is invalid", 400)

    if user.reset_password_expires_at and user.reset_password_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return api_error("TOKEN_EXPIRED", "Reset token has expired", 400)

    user.set_password(new_password)
    user.reset_password_token = None
    user.reset_password_expires_at = None
    db.session.commit()

    return jsonify({"message": "Password has been successfully updated."}), 200


@auth_bp.route("/auth/verify-email", methods=["POST"])
def verify_email():
    """Verify user email address from registration token."""
    data = request.get_json(silent=True) or {}
    token = data.get("token")
    if not token:
        return api_error("VALIDATION_ERROR", "Verification token is required", 400)

    user = User.query.filter_by(email_verification_token=token).first()
    if not user:
        return api_error("INVALID_TOKEN", "Verification token is invalid", 400)

    user.is_email_verified = True
    user.email_verification_token = None
    db.session.commit()

    return jsonify({"message": "Email verified successfully.", "user": user.to_dict(include_email=True)}), 200


# =============================================================================
# 2. Real Production Google OAuth 2.0 (Authorization Code Flow)
# =============================================================================

@auth_bp.route("/auth/google", methods=["GET"])
def auth_google_initiate():
    """Initiate Google OAuth 2.0 authorization code flow."""
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
    frontend_url = get_frontend_url()
    if not client_id:
        if request.args.get("json") == "1" or request.headers.get("Accept") == "application/json":
            return api_error("CONFIG_ERROR", "GOOGLE_CLIENT_ID is not configured", 500)
        return redirect(f"{frontend_url}/#oauth_error=" + urllib.parse.quote("Google OAuth is not configured on the server (missing GOOGLE_CLIENT_ID)"))

    redirect_uri = get_oauth_redirect_uri("GOOGLE")
    state = secrets.token_urlsafe(24)
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urllib.parse.urlencode({
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "prompt": "select_account",
        })
    )
    if request.args.get("json") == "1" or request.headers.get("Accept") == "application/json":
        return jsonify({"url": auth_url}), 200
    return redirect(auth_url)


@auth_bp.route("/auth/google/callback", methods=["GET"])
def auth_google_callback():
    """Handle Google OAuth callback, exchange code, verify identity, and sign in / onboard user."""
    frontend_url = get_frontend_url()
    error = request.args.get("error")
    if error:
        err_desc = request.args.get("error_description") or error
        return redirect(f"{frontend_url}/#oauth_error=" + urllib.parse.quote(err_desc))

    code = request.args.get("code")
    if not code:
        return redirect(f"{frontend_url}/#oauth_error=" + urllib.parse.quote("Missing Google authorization code"))

    client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
    if not client_id or not client_secret:
        return redirect(f"{frontend_url}/#oauth_error=" + urllib.parse.quote("Google OAuth client credentials not configured"))

    redirect_uri = get_oauth_redirect_uri("GOOGLE")
    try:
        user_info = exchange_google_code(code, redirect_uri, client_id, client_secret)
    except Exception as e:
        return redirect(f"{frontend_url}/#oauth_error=" + urllib.parse.quote(f"Google authorization failed: {str(e)}"))

    email = (user_info.get("email") or "").strip().lower()
    name = user_info.get("name")
    picture = user_info.get("picture")
    sub = user_info.get("sub")

    if not email:
        return redirect(f"{frontend_url}/#oauth_error=" + urllib.parse.quote("Google did not return a verified email address"))

    user = User.query.filter_by(email=email).first()
    if user:
        if not user.avatar_url and picture:
            user.avatar_url = picture
        if not user.display_name and name:
            user.display_name = name
        user.is_email_verified = True
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return redirect(f"{frontend_url}/#auth_token=" + urllib.parse.quote(access_token))

    # New user: sign temporary pending token for username selection
    pending_token = create_access_token(
        identity="pending_oauth",
        additional_claims={
            "provider": "GOOGLE",
            "email": email,
            "name": name or "",
            "picture": picture or "",
            "sub": sub or "",
        },
        expires_delta=timedelta(minutes=15),
    )
    suggested = email.split("@")[0].replace(".", "_")
    return redirect(
        f"{frontend_url}/#oauth_pending="
        + urllib.parse.quote(pending_token)
        + "&provider=GOOGLE&email="
        + urllib.parse.quote(email)
        + "&name="
        + urllib.parse.quote(name or "")
        + "&suggested="
        + urllib.parse.quote(suggested)
    )


# =============================================================================
# 3. Real Production GitHub OAuth (Authorization Code Flow)
# =============================================================================

@auth_bp.route("/auth/github", methods=["GET"])
def auth_github_initiate():
    """Initiate GitHub OAuth authorization code flow."""
    client_id = os.environ.get("GITHUB_CLIENT_ID", "").strip()
    frontend_url = get_frontend_url()
    if not client_id:
        if request.args.get("json") == "1" or request.headers.get("Accept") == "application/json":
            return api_error("CONFIG_ERROR", "GITHUB_CLIENT_ID is not configured", 500)
        return redirect(f"{frontend_url}/#oauth_error=" + urllib.parse.quote("GitHub OAuth is not configured on the server (missing GITHUB_CLIENT_ID)"))

    redirect_uri = get_oauth_redirect_uri("GITHUB")
    state = secrets.token_urlsafe(24)
    auth_url = (
        "https://github.com/login/oauth/authorize?"
        + urllib.parse.urlencode({
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": "read:user user:email",
            "state": state,
        })
    )
    if request.args.get("json") == "1" or request.headers.get("Accept") == "application/json":
        return jsonify({"url": auth_url}), 200
    return redirect(auth_url)


@auth_bp.route("/auth/github/callback", methods=["GET"])
def auth_github_callback():
    """Handle GitHub OAuth callback, exchange code, verify identity, and sign in / onboard user."""
    frontend_url = get_frontend_url()
    error = request.args.get("error")
    if error:
        err_desc = request.args.get("error_description") or error
        return redirect(f"{frontend_url}/#oauth_error=" + urllib.parse.quote(err_desc))

    code = request.args.get("code")
    if not code:
        return redirect(f"{frontend_url}/#oauth_error=" + urllib.parse.quote("Missing GitHub authorization code"))

    client_id = os.environ.get("GITHUB_CLIENT_ID", "").strip()
    client_secret = os.environ.get("GITHUB_CLIENT_SECRET", "").strip()
    if not client_id or not client_secret:
        return redirect(f"{frontend_url}/#oauth_error=" + urllib.parse.quote("GitHub OAuth client credentials not configured"))

    redirect_uri = get_oauth_redirect_uri("GITHUB")
    try:
        user_info = exchange_github_code(code, redirect_uri, client_id, client_secret)
    except Exception as e:
        return redirect(f"{frontend_url}/#oauth_error=" + urllib.parse.quote(f"GitHub authorization failed: {str(e)}"))

    login = (user_info.get("login") or "").strip()
    email = (user_info.get("verified_email") or user_info.get("email") or "").strip().lower()
    name = user_info.get("name")
    avatar_url = user_info.get("avatar_url")
    html_url = user_info.get("html_url") or (f"https://github.com/{login}" if login else None)

    user = None
    if email:
        user = User.query.filter_by(email=email).first()
    if not user and html_url:
        user = User.query.filter_by(github_url=html_url).first()
    if not user and login:
        user = User.query.filter_by(username=login).first()

    if user:
        if not user.avatar_url and avatar_url:
            user.avatar_url = avatar_url
        if not user.display_name and name:
            user.display_name = name
        if not user.github_url and html_url:
            user.github_url = html_url
        if email:
            user.is_email_verified = True
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return redirect(f"{frontend_url}/#auth_token=" + urllib.parse.quote(access_token))

    # New user: sign temporary pending token for username selection
    pending_token = create_access_token(
        identity="pending_oauth",
        additional_claims={
            "provider": "GITHUB",
            "github_username": login,
            "email": email or "",
            "name": name or login,
            "avatar_url": avatar_url or "",
            "github_url": html_url or "",
        },
        expires_delta=timedelta(minutes=15),
    )
    return redirect(
        f"{frontend_url}/#oauth_pending="
        + urllib.parse.quote(pending_token)
        + "&provider=GITHUB&github_username="
        + urllib.parse.quote(login)
        + "&email="
        + urllib.parse.quote(email or "")
        + "&name="
        + urllib.parse.quote(name or "")
        + "&suggested="
        + urllib.parse.quote(login)
    )


# =============================================================================
# 4. OAuth Complete Registration & Linking
# =============================================================================

@auth_bp.route("/auth/oauth/complete-registration", methods=["POST"])
def complete_oauth_registration():
    """Complete new user registration after OAuth identity verification with chosen username."""
    data = request.get_json(silent=True) or {}
    pending_token = data.get("pending_token")
    username = (data.get("username") or "").strip()

    if not pending_token:
        return api_error("VALIDATION_ERROR", "Pending OAuth token is required", 400)
    if not username or len(username) < 3 or len(username) > 50:
        return api_error("VALIDATION_ERROR", "Username must be between 3 and 50 characters", 400)
    if not re.match(r"^[a-zA-Z0-9_-]+$", username):
        return api_error("VALIDATION_ERROR", "Username can only contain letters, numbers, hyphens, and underscores", 400)

    try:
        decoded = decode_token(pending_token)
    except Exception as e:
        return api_error("INVALID_TOKEN", f"Invalid or expired registration token: {str(e)}", 400)

    provider = decoded.get("provider")
    if not provider or provider not in ("GOOGLE", "GITHUB"):
        return api_error("INVALID_TOKEN", "Invalid provider in registration token", 400)

    # Check username uniqueness
    if User.query.filter_by(username=username).first():
        return api_error("CONFLICT", "Username is already taken. Please choose another.", 409)

    email = (decoded.get("email") or "").strip().lower() or None
    name = decoded.get("name") or username
    avatar_url = decoded.get("avatar_url") or decoded.get("picture") or None
    github_url = decoded.get("github_url") or None

    if email and User.query.filter_by(email=email).first():
        return api_error("CONFLICT", "An account with this email already exists", 409)

    user = User(
        username=username,
        email=email if email else (f"{username}@github.bugzilla.local" if provider == "GITHUB" else None),
        display_name=name,
        avatar_url=avatar_url,
        github_url=github_url,
        auth_provider=provider,
        is_email_verified=bool(email),
    )
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "user": user.to_dict(include_email=True),
        "access_token": access_token,
    }), 201


# Direct OAuth JSON endpoints (for backwards compatibility / direct token tests)
@auth_bp.route("/auth/oauth/google", methods=["POST"])
def oauth_google():
    """Handle direct Google OAuth login/registration."""
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
    """Handle direct GitHub OAuth login/registration."""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    avatar_url = data.get("avatar_url")
    display_name = data.get("name")

    if not username and not email:
        return api_error("VALIDATION_ERROR", "GitHub username or email is required", 400)

    user = None
    if email:
        user = User.query.filter_by(email=email).first()
    if not user and username:
        user = User.query.filter_by(username=username).first()

    if not user:
        clean_user = username or email.split("@")[0]
        base_user = clean_user
        idx = 1
        while User.query.filter_by(username=clean_user).first():
            clean_user = f"{base_user}{idx}"
            idx += 1

        user = User(
            username=clean_user,
            email=email if email else f"{clean_user}@github.bugzilla.local",
            display_name=display_name or clean_user,
            avatar_url=avatar_url,
            github_url=f"https://github.com/{username}" if username else None,
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


@auth_bp.route("/auth/oauth/check", methods=["POST"])
def oauth_check():
    """Check if an OAuth user already exists in the system."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    username = (data.get("username") or "").strip()

    user = None
    if email:
        user = User.query.filter_by(email=email).first()
    if not user and username:
        user = User.query.filter_by(username=username).first()

    return jsonify({
        "exists": user is not None,
        "username": user.username if user else None,
    }), 200


@auth_bp.route("/auth/logout", methods=["POST"])
@jwt_required(optional=True)
def logout():
    """Logout current session."""
    return jsonify({"message": "Successfully logged out"}), 200


# =============================================================================
# 5. User Profile Endpoints
# =============================================================================

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
