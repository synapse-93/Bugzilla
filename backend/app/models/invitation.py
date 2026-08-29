from datetime import datetime, timezone
from app.extensions import db


class Invitation(db.Model):
    """Project team invitation entity."""
    __tablename__ = "invitations"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    inviter_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    invitee_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = db.Column(db.String(20), nullable=False, default="DEVELOPER")  # ADMIN, MAINTAINER, DEVELOPER, VIEWER
    status = db.Column(db.String(20), nullable=False, default="PENDING")  # PENDING, ACCEPTED, DECLINED, EXPIRED
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
    project = db.relationship("Project", back_populates="invitations")
    inviter = db.relationship("User", foreign_keys=[inviter_id])
    invitee = db.relationship("User", foreign_keys=[invitee_id])

    def to_dict(self) -> dict:
        """Serialize invitation to dict."""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "project_name": self.project.name if self.project else None,
            "project_key": self.project.key if self.project else None,
            "inviter_id": self.inviter_id,
            "inviter_username": self.inviter.username if self.inviter else None,
            "invitee_id": self.invitee_id,
            "invitee_username": self.invitee.username if self.invitee else None,
            "role": self.role,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
