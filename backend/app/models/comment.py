from datetime import datetime, timezone
from app.extensions import db


class Comment(db.Model):
    """Issue comment entity."""
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    issue_id = db.Column(
        db.Integer,
        db.ForeignKey("issues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    body = db.Column(db.Text, nullable=False)
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
    issue = db.relationship("Issue", back_populates="comments")
    author = db.relationship("User", back_populates="comments")

    def to_dict(self) -> dict:
        """Serialize comment to dict."""
        return {
            "id": self.id,
            "issue_id": self.issue_id,
            "author_id": self.author_id,
            "body": self.body,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "author": self.author.to_dict(include_email=False) if self.author else None,
        }
