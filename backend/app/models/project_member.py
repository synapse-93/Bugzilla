from datetime import datetime, timezone
from app.extensions import db


class ProjectMember(db.Model):
    """Project membership and role assignment."""
    __tablename__ = "project_members"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = db.Column(
        db.String(20),
        nullable=False,
        default="DEVELOPER",
    )  # ADMIN, MAINTAINER, DEVELOPER, VIEWER
    joined_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        db.UniqueConstraint("project_id", "user_id", name="uq_project_member"),
    )

    # Relationships
    project = db.relationship("Project", back_populates="members")
    user = db.relationship("User", back_populates="project_memberships")

    def to_dict(self) -> dict:
        """Serialize project member to dict."""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "user_id": self.user_id,
            "role": self.role,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
            "user": self.user.to_dict(include_email=False) if self.user else None,
        }
