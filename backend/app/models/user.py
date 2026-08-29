from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db


class User(db.Model):
    """User account entity."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable for OAuth users
    display_name = db.Column(db.String(100), nullable=True)
    auth_provider = db.Column(db.String(20), nullable=False, default="EMAIL")  # EMAIL, GOOGLE, GITHUB, GUEST
    is_email_verified = db.Column(db.Boolean, default=False, nullable=False)
    email_verification_token = db.Column(db.String(255), nullable=True)
    reset_password_token = db.Column(db.String(255), nullable=True)
    reset_password_expires_at = db.Column(db.DateTime(timezone=True), nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    role_title = db.Column(db.String(100), nullable=True)
    skills = db.Column(db.String(500), nullable=True)  # Comma-separated list of skills
    github_url = db.Column(db.String(255), nullable=True)
    linkedin_url = db.Column(db.String(255), nullable=True)
    website_url = db.Column(db.String(255), nullable=True)
    is_open_to_work = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    project_memberships = db.relationship(
        "ProjectMember",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    created_issues = db.relationship(
        "Issue",
        foreign_keys="Issue.creator_id",
        back_populates="creator",
    )
    assigned_issues = db.relationship(
        "Issue",
        foreign_keys="Issue.assignee_id",
        back_populates="assignee",
    )
    comments = db.relationship(
        "Comment",
        back_populates="author",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    activities = db.relationship(
        "Activity",
        back_populates="actor",
    )

    def set_password(self, password: str) -> None:
        """Hash and store password securely."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify password against stored hash."""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_email: bool = True) -> dict:
        """Serialize user to dict for authenticated responses."""
        data = {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name or self.username,
            "auth_provider": self.auth_provider,
            "is_email_verified": self.is_email_verified,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "role_title": self.role_title,
            "skills": [s.strip() for s in self.skills.split(",") if s.strip()] if self.skills else [],
            "github_url": self.github_url,
            "linkedin_url": self.linkedin_url,
            "website_url": self.website_url,
            "is_open_to_work": self.is_open_to_work,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_email:
            data["email"] = self.email
        return data

    def to_public_dict(self) -> dict:
        """Serialize user for public collaboration discovery & team browsing."""
        return {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name or self.username,
            "auth_provider": self.auth_provider,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "role_title": self.role_title,
            "skills": [s.strip() for s in self.skills.split(",") if s.strip()] if self.skills else [],
            "github_url": self.github_url,
            "linkedin_url": self.linkedin_url,
            "website_url": self.website_url,
            "is_open_to_work": self.is_open_to_work,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
