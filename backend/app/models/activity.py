import json
from datetime import datetime, timezone
from app.extensions import db


class Activity(db.Model):
    """Issue activity log entity."""
    __tablename__ = "activities"

    id = db.Column(db.Integer, primary_key=True)
    issue_id = db.Column(
        db.Integer,
        db.ForeignKey("issues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action_type = db.Column(
        db.String(50),
        nullable=False,
    )  # e.g., STATUS_CHANGED, ASSIGNED, RESOLUTION_SET, COMMENT_ADDED, CREATED
    old_value = db.Column(db.Text, nullable=True)
    new_value = db.Column(db.Text, nullable=True)
    metadata_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    issue = db.relationship("Issue", back_populates="activities")
    actor = db.relationship("User", back_populates="activities")

    def get_metadata(self) -> dict | None:
        """Parse structured metadata JSON."""
        if not self.metadata_json:
            return None
        try:
            return json.loads(self.metadata_json)
        except (ValueError, TypeError):
            return None

    def set_metadata(self, data: dict) -> None:
        """Store structured metadata as JSON string."""
        self.metadata_json = json.dumps(data) if data else None

    def to_dict(self) -> dict:
        """Serialize activity to dict."""
        return {
            "id": self.id,
            "issue_id": self.issue_id,
            "actor_id": self.actor_id,
            "action_type": self.action_type,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "metadata": self.get_metadata(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "actor": self.actor.to_dict(include_email=False) if self.actor else None,
        }
