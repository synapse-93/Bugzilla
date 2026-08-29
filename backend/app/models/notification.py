from datetime import datetime, timezone
from app.extensions import db


class Notification(db.Model):
    """In-app user notification entity."""
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True,
    )
    issue_id = db.Column(
        db.Integer,
        db.ForeignKey("issues.id", ondelete="CASCADE"),
        nullable=True,
    )
    notification_type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = db.relationship("User", foreign_keys=[user_id])
    actor = db.relationship("User", foreign_keys=[actor_id])
    project = db.relationship("Project")
    issue = db.relationship("Issue")

    def to_dict(self) -> dict:
        """Serialize notification to dict."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "actor_id": self.actor_id,
            "actor_username": self.actor.username if self.actor else None,
            "project_id": self.project_id,
            "project_name": self.project.name if self.project else None,
            "issue_id": self.issue_id,
            "issue_identifier": self.issue.identifier if self.issue else None,
            "notification_type": self.notification_type,
            "title": self.title,
            "message": self.message,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
