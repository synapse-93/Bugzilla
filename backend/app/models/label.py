from datetime import datetime, timezone
from app.extensions import db


class Label(db.Model):
    """Project-scoped label entity."""
    __tablename__ = "labels"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(20), nullable=False, default="#6b7280")
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        db.UniqueConstraint("project_id", "name", name="uq_project_label_name"),
    )

    # Relationships
    project = db.relationship("Project", back_populates="labels")
    issue_labels = db.relationship(
        "IssueLabel",
        back_populates="label",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def to_dict(self) -> dict:
        """Serialize label to dict."""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "color": self.color,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class IssueLabel(db.Model):
    """Association entity between Issue and Label."""
    __tablename__ = "issue_labels"

    id = db.Column(db.Integer, primary_key=True)
    issue_id = db.Column(
        db.Integer,
        db.ForeignKey("issues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label_id = db.Column(
        db.Integer,
        db.ForeignKey("labels.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    __table_args__ = (
        db.UniqueConstraint("issue_id", "label_id", name="uq_issue_label"),
    )

    # Relationships
    issue = db.relationship("Issue", back_populates="issue_labels")
    label = db.relationship("Label", back_populates="issue_labels")

    def to_dict(self) -> dict:
        """Serialize issue label to dict."""
        return {
            "id": self.id,
            "issue_id": self.issue_id,
            "label_id": self.label_id,
            "label": self.label.to_dict() if self.label else None,
        }
