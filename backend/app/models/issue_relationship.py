from datetime import datetime, timezone
from app.extensions import db


class IssueRelationship(db.Model):
    """Relationship between two issues (Blocks, Blocked by, Related, Duplicate)."""
    __tablename__ = "issue_relationships"

    id = db.Column(db.Integer, primary_key=True)
    source_issue_id = db.Column(
        db.Integer,
        db.ForeignKey("issues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_issue_id = db.Column(
        db.Integer,
        db.ForeignKey("issues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    relationship_type = db.Column(
        db.String(20),
        nullable=False,
    )  # BLOCKS, BLOCKED_BY, RELATED, DUPLICATE

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    source_issue = db.relationship("Issue", foreign_keys=[source_issue_id], back_populates="outgoing_relationships")
    target_issue = db.relationship("Issue", foreign_keys=[target_issue_id], back_populates="incoming_relationships")

    def to_dict(self) -> dict:
        """Serialize relationship to dict."""
        return {
            "id": self.id,
            "source_issue_id": self.source_issue_id,
            "target_issue_id": self.target_issue_id,
            "target_identifier": self.target_issue.identifier if self.target_issue else None,
            "target_title": self.target_issue.title if self.target_issue else None,
            "relationship_type": self.relationship_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
